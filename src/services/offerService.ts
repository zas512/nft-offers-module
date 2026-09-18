import mongoose, { type ClientSession, type Types } from "mongoose";
import { EscrowAccount, LedgerEntry, Nft, Offer, User } from "../models/index.js";
import type {
  AcceptSingleItemOfferInput,
  CreateSingleItemOfferInput,
  IOffer,
  LedgerAccount,
  LedgerDirection,
  LedgerType,
  OfferFilterQuery,
  OfferSettlementSummary,
  SingleItemOfferResult
} from "../types/index.js";
import { BPS_DENOMINATOR } from "../types/index.js";
import { AppError } from "../utils/appError.js";

const toLong = (n: bigint | number | string) => mongoose.mongo.Long.fromString(String(n));

interface SettlementCalculation {
  gross: bigint;
  platformFee: bigint;
  royaltyFee: bigint;
  netPayout: bigint;
}

export class OfferService {
  private async runInTransaction<T>(fn: (session: ClientSession) => Promise<T>): Promise<T> {
    const session = await mongoose.startSession();
    try {
      let result!: T;
      await session.withTransaction(async () => {
        result = await fn(session);
      });
      return result;
    } finally {
      await session.endSession();
    }
  }

  private buildLedgerEntry(p: {
    referenceId: Types.ObjectId;
    userId: Types.ObjectId | null;
    account: LedgerAccount;
    type: LedgerType;
    direction: LedgerDirection;
    amountGrams: mongoose.mongo.Long;
    now: Date;
  }) {
    return {
      _id: new mongoose.Types.ObjectId(),
      referenceId: p.referenceId,
      userId: p.userId,
      account: p.account,
      type: p.type,
      direction: p.direction,
      amountGrams: p.amountGrams,
      createdAt: p.now
    };
  }

  public calculateSettlement(
    grossAmountStr: string,
    platformFeeBps: number,
    royaltyFeeBps: number
  ): SettlementCalculation {
    const gross = BigInt(grossAmountStr);
    const platformBps = BigInt(platformFeeBps || 0);
    const royaltyBps = BigInt(royaltyFeeBps || 0);
    const totalBps = platformBps + royaltyBps;
    if (totalBps > BPS_DENOMINATOR) {
      throw AppError.badRequest("Total collection fees exceed 100% (10,000 bps)");
    }
    const platformFee = (gross * platformBps) / BPS_DENOMINATOR;
    const royaltyFee = (gross * royaltyBps) / BPS_DENOMINATOR;
    const netPayout = gross - platformFee - royaltyFee;
    if (netPayout < 0n) {
      throw AppError.badRequest("Calculated net payout cannot be negative");
    }
    return { gross, platformFee, royaltyFee, netPayout };
  }

  // Create offer
  public async createSingleItemOffer(
    input: CreateSingleItemOfferInput
  ): Promise<SingleItemOfferResult> {
    const { buyerId, nftId, grossAmountGrams, expiresAt } = input;
    const expirationDate = expiresAt instanceof Date ? expiresAt : new Date(expiresAt);
    const buyerObjectId =
      buyerId instanceof mongoose.Types.ObjectId ? buyerId : new mongoose.Types.ObjectId(buyerId);
    const nftObjectId =
      nftId instanceof mongoose.Types.ObjectId ? nftId : new mongoose.Types.ObjectId(nftId);
    return this.runInTransaction(async (session) => {
      const now = new Date();
      const nft = await Nft.findById(nftObjectId).session(session);
      if (!nft) {
        throw AppError.notFound("NFT not found");
      }
      if (nft.isLocked) {
        throw AppError.badRequest("NFT is currently locked");
      }
      if (nft.ownerId.equals(buyerObjectId)) {
        throw AppError.badRequest("Cannot place an offer on your own NFT");
      }
      const grossAmountLong = toLong(grossAmountGrams);
      const balanceUpdate = await User.updateOne(
        {
          _id: buyerObjectId,
          availableBalance: { $gte: grossAmountLong }
        },
        {
          $inc: { availableBalance: toLong(`-${grossAmountGrams}`) }
        },
        { session }
      );
      if (balanceUpdate.matchedCount === 0) {
        throw AppError.badRequest(
          "Insufficient funds: Available balance is lower than offer amount"
        );
      }
      const offerId = new mongoose.Types.ObjectId();
      const escrowId = new mongoose.Types.ObjectId();
      const platformFeeBps = Math.round(2.5 * 100);
      const royaltyFeeBps = Math.round(5 * 100);
      await EscrowAccount.create(
        [
          {
            _id: escrowId,
            offerId,
            buyerId: buyerObjectId,
            sellerId: nft.ownerId,
            grossAmountGrams: grossAmountLong,
            platformFeeBps,
            royaltyFeeBps,
            status: "held",
            settledAt: null
          }
        ],
        { session }
      );
      await LedgerEntry.create(
        [
          this.buildLedgerEntry({
            referenceId: escrowId,
            userId: buyerObjectId,
            account: "available",
            type: "escrow_lock",
            direction: "debit",
            amountGrams: grossAmountLong,
            now
          })
        ],
        { session }
      );
      await Offer.create(
        [
          {
            _id: offerId,
            buyerId: buyerObjectId,
            escrowId,
            collectionId: nft.collectionId,
            nftId: nftObjectId,
            type: "item",
            grossAmountGrams: grossAmountLong,
            status: "pending",
            expiresAt: expirationDate
          }
        ],
        { session }
      );
      return {
        offerId: offerId.toString(),
        escrowId: escrowId.toString(),
        buyerId: buyerObjectId.toString(),
        sellerId: nft.ownerId.toString(),
        collectionId: nft.collectionId.toString(),
        nftId: nftObjectId.toString(),
        grossAmountGrams: grossAmountGrams.toString(),
        status: "pending",
        expiresAt: expirationDate.toISOString()
      };
    });
  }

  // Load offer for acceptance
  private async loadOfferForAcceptance(
    offerId: Types.ObjectId | string,
    sellerId: Types.ObjectId | string,
    session: ClientSession
  ) {
    const now = new Date();
    const offerObjectId =
      offerId instanceof mongoose.Types.ObjectId ? offerId : new mongoose.Types.ObjectId(offerId);
    const sellerObjectId =
      sellerId instanceof mongoose.Types.ObjectId ?
        sellerId
      : new mongoose.Types.ObjectId(sellerId);

    const offer = await Offer.findOne({
      _id: offerObjectId,
      status: "pending",
      expiresAt: { $gt: now }
    }).session(session);
    if (!offer) {
      throw AppError.notFound("Offer not found or has already expired");
    }
    const escrow = await EscrowAccount.findOne({
      _id: offer.escrowId,
      status: "held"
    }).session(session);
    if (!escrow) {
      throw AppError.badRequest("Escrow not found or is in an invalid state");
    }
    if (!offer.nftId) {
      throw AppError.badRequest("Offer does not contain an associated NFT");
    }
    const nft = await Nft.findOne({
      _id: offer.nftId,
      ownerId: sellerObjectId,
      isLocked: false
    }).session(session);
    if (!nft) {
      throw AppError.forbidden("Seller not authorized to accept this offer or NFT is locked");
    }
    return { offer, escrow, nft, sellerObjectId };
  }

  // Invalidate competing offers
  private async invalidateCompetingOffers(
    nftId: Types.ObjectId,
    acceptedOfferId: Types.ObjectId,
    now: Date,
    session: ClientSession
  ): Promise<number> {
    const competingOffers = await Offer.find({
      _id: { $ne: acceptedOfferId },
      nftId,
      status: "pending"
    }).session(session);
    if (competingOffers.length === 0) {
      return 0;
    }
    const compOfferIds = competingOffers.map((o) => o._id);
    const compEscrowIds = competingOffers.map((o) => o.escrowId);
    await Offer.updateMany(
      { _id: { $in: compOfferIds } },
      { $set: { status: "invalidated" } },
      { session }
    );
    const compEscrows = await EscrowAccount.find({
      _id: { $in: compEscrowIds },
      status: "held"
    }).session(session);
    if (compEscrows.length > 0) {
      const activeEscrowIds = compEscrows.map((e) => e._id);
      await EscrowAccount.updateMany(
        { _id: { $in: activeEscrowIds } },
        { $set: { status: "refunded", settledAt: now } },
        { session }
      );
      const userBulkOps = compEscrows.map((escrow) => ({
        updateOne: {
          filter: { _id: escrow.buyerId },
          update: {
            $inc: { availableBalance: toLong(escrow.grossAmountGrams.toString()) }
          }
        }
      }));
      await User.bulkWrite(userBulkOps, { session });
      const refundLedgerEntries = compEscrows.map((escrow) =>
        this.buildLedgerEntry({
          referenceId: escrow._id,
          userId: escrow.buyerId,
          account: "available",
          type: "escrow_refund",
          direction: "credit",
          amountGrams: toLong(escrow.grossAmountGrams.toString()),
          now
        })
      );
      await LedgerEntry.insertMany(refundLedgerEntries, { session });
    }
    return competingOffers.length;
  }

  // Accept offer
  public async acceptSingleItemOffer(
    input: AcceptSingleItemOfferInput
  ): Promise<OfferSettlementSummary> {
    const { offerId, sellerId } = input;
    return this.runInTransaction(async (session) => {
      const now = new Date();
      const { offer, escrow, nft, sellerObjectId } = await this.loadOfferForAcceptance(
        offerId,
        sellerId,
        session
      );
      const { gross, platformFee, royaltyFee, netPayout } = this.calculateSettlement(
        escrow.grossAmountGrams.toString(),
        escrow.platformFeeBps,
        escrow.royaltyFeeBps
      );
      await Nft.updateOne(
        { _id: nft._id },
        {
          $set: {
            ownerId: offer.buyerId,
            status: "active",
            isLocked: false
          }
        },
        { session }
      );
      await User.updateOne(
        { _id: sellerObjectId },
        {
          $inc: { availableBalance: toLong(netPayout) }
        },
        { session }
      );
      await EscrowAccount.updateOne(
        { _id: escrow._id },
        {
          $set: {
            sellerId: sellerObjectId,
            status: "settled",
            settledAt: now
          }
        },
        { session }
      );
      await Offer.updateOne(
        { _id: offer._id },
        {
          $set: {
            status: "accepted"
          }
        },
        { session }
      );
      const settlementLedgerEntries = [
        this.buildLedgerEntry({
          referenceId: escrow._id,
          userId: sellerObjectId,
          account: "available",
          type: "seller_payout",
          direction: "credit",
          amountGrams: toLong(netPayout),
          now
        }),
        this.buildLedgerEntry({
          referenceId: escrow._id,
          userId: null,
          account: "treasury",
          type: "platform_fee",
          direction: "credit",
          amountGrams: toLong(platformFee),
          now
        })
      ];
      await LedgerEntry.insertMany(settlementLedgerEntries, { session });
      const invalidatedOffersCount = await this.invalidateCompetingOffers(
        nft._id,
        offer._id,
        now,
        session
      );
      return {
        offerId: offer._id.toString(),
        nftId: nft._id.toString(),
        buyerId: offer.buyerId.toString(),
        sellerId: sellerObjectId.toString(),
        grossAmountGrams: gross.toString(),
        netPayoutGrams: netPayout.toString(),
        platformFeeGrams: platformFee.toString(),
        royaltyFeeGrams: royaltyFee.toString(),
        invalidatedOffersCount
      };
    });
  }

  // Get all offers
  public async getAllOffers(filter: OfferFilterQuery = {}): Promise<IOffer[]> {
    return Offer.find(filter).lean<IOffer[]>();
  }

  // Get offer by id
  public async getOfferById(id: string): Promise<IOffer> {
    const offer = await Offer.findById(id).lean<IOffer | null>();
    if (!offer) {
      throw AppError.notFound("Offer not found");
    }
    return offer;
  }
}

export const offerService = new OfferService();
