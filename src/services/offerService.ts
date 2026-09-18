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
  OfferRejectionSummary,
  OfferSettlementSummary,
  RejectSingleItemOfferInput,
  SingleItemOfferResult
} from "../types/index.js";
import { BPS_DENOMINATOR } from "../types/index.js";
import { AppError } from "../utils/appError.js";
import {
  validateNftForAcceptance,
  validateNftForOffer,
  validateNftForRejection
} from "../validations/index.js";

const toLong = (n: bigint | number | string | mongoose.mongo.Long) =>
  n instanceof mongoose.mongo.Long ? n : mongoose.mongo.Long.fromString(n.toString());

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
    referenceId: Types.ObjectId | string;
    userId: Types.ObjectId | string | null;
    account: LedgerAccount;
    type: LedgerType;
    direction: LedgerDirection;
    amountGrams: mongoose.mongo.Long;
    now: Date;
  }) {
    return {
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
    return this.runInTransaction(async (session) => {
      const now = new Date();
      const existingOffer = await Offer.findOne({
        buyerId,
        nftId,
        status: "pending",
        expiresAt: { $gt: now }
      }).session(session);
      if (existingOffer) {
        throw AppError.badRequest(
          "An active offer for this NFT already exists from you. Please wait until it expires before making a new one."
        );
      }
      const nft = await Nft.findById(nftId).session(session);
      validateNftForOffer(nft, buyerId);
      const grossAmountLong = toLong(grossAmountGrams);
      const balanceUpdate = await User.updateOne(
        {
          _id: buyerId,
          availableBalance: { $gte: grossAmountLong }
        },
        {
          $inc: { availableBalance: toLong(-BigInt(grossAmountGrams)) }
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
      const platformFeeBps = 250;
      const royaltyFeeBps = 500;

      await EscrowAccount.create(
        [
          {
            _id: escrowId,
            offerId,
            buyerId,
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

      await Offer.create(
        [
          {
            _id: offerId,
            buyerId,
            escrowId,
            collectionId: nft.collectionId,
            nftId,
            type: "item",
            grossAmountGrams: grossAmountLong,
            status: "pending",
            expiresAt: expirationDate
          }
        ],
        { session }
      );

      await LedgerEntry.insertMany(
        [
          this.buildLedgerEntry({
            referenceId: escrowId,
            userId: buyerId,
            account: "available",
            type: "escrow_lock",
            direction: "debit",
            amountGrams: grossAmountLong,
            now
          })
        ],
        { session }
      );

      return {
        offerId: offerId.toString(),
        escrowId: escrowId.toString(),
        buyerId: buyerId.toString(),
        sellerId: nft.ownerId.toString(),
        collectionId: nft.collectionId.toString(),
        nftId: nftId.toString(),
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
    session: ClientSession,
    inputNftId?: Types.ObjectId | string
  ) {
    const now = new Date();
    const offer = await Offer.findOne({
      _id: offerId,
      status: "pending",
      expiresAt: { $gt: now }
    }).session(session);
    if (!offer) {
      throw AppError.notFound("Offer not found or has already expired");
    }
    if (!offer.nftId) {
      throw AppError.badRequest("Offer does not contain an associated NFT");
    }
    if (inputNftId && !offer.nftId.equals(inputNftId)) {
      throw AppError.badRequest("Offer does not match the provided NFT ID");
    }
    const nft = await Nft.findById(offer.nftId).session(session);
    validateNftForAcceptance(nft, sellerId);
    const escrow = await EscrowAccount.findOne({
      _id: offer.escrowId,
      status: "held"
    }).session(session);
    if (!escrow) {
      throw AppError.badRequest("Escrow not found or is in an invalid state");
    }
    return { offer, escrow, nft };
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
            $inc: { availableBalance: toLong(escrow.grossAmountGrams) }
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
          amountGrams: toLong(escrow.grossAmountGrams),
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
    const { offerId, sellerId, nftId } = input;
    return this.runInTransaction(async (session) => {
      const now = new Date();
      const { offer, escrow, nft } = await this.loadOfferForAcceptance(
        offerId,
        sellerId,
        session,
        nftId
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
        { _id: sellerId },
        {
          $inc: { availableBalance: toLong(netPayout) }
        },
        { session }
      );
      await EscrowAccount.updateOne(
        { _id: escrow._id },
        {
          $set: {
            sellerId,
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
          userId: sellerId,
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
      if (royaltyFee > 0n) {
        settlementLedgerEntries.push(
          this.buildLedgerEntry({
            referenceId: escrow._id,
            userId: null,
            account: "treasury",
            type: "royalty_fee",
            direction: "credit",
            amountGrams: toLong(royaltyFee),
            now
          })
        );
      }
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
        sellerId: sellerId.toString(),
        grossAmountGrams: gross.toString(),
        netPayoutGrams: netPayout.toString(),
        platformFeeGrams: platformFee.toString(),
        royaltyFeeGrams: royaltyFee.toString(),
        invalidatedOffersCount
      };
    });
  }

  // Reject offer
  public async rejectSingleItemOffer(
    input: RejectSingleItemOfferInput
  ): Promise<OfferRejectionSummary> {
    const { offerId, sellerId, nftId } = input;
    return this.runInTransaction(async (session) => {
      const now = new Date();
      const offer = await Offer.findOne({
        _id: offerId,
        status: "pending",
        expiresAt: { $gt: now }
      }).session(session);
      if (!offer) {
        throw AppError.notFound("Offer not found or has already expired");
      }
      if (!offer.nftId) {
        throw AppError.badRequest("Offer does not contain an associated NFT");
      }
      if (nftId && !offer.nftId.equals(nftId)) {
        throw AppError.badRequest("Offer does not match the provided NFT ID");
      }
      const nft = await Nft.findById(offer.nftId).session(session);
      validateNftForRejection(nft, sellerId);
      const escrow = await EscrowAccount.findOne({
        _id: offer.escrowId,
        status: "held"
      }).session(session);
      if (!escrow) {
        throw AppError.badRequest("Escrow not found or is in an invalid state");
      }
      await Offer.updateOne({ _id: offer._id }, { $set: { status: "rejected" } }, { session });
      await EscrowAccount.updateOne(
        { _id: escrow._id },
        {
          $set: {
            sellerId,
            status: "refunded",
            settledAt: now
          }
        },
        { session }
      );
      const refundAmountLong = toLong(escrow.grossAmountGrams);
      await User.updateOne(
        { _id: escrow.buyerId },
        {
          $inc: { availableBalance: refundAmountLong }
        },
        { session }
      );
      const refundLedgerEntry = this.buildLedgerEntry({
        referenceId: escrow._id,
        userId: escrow.buyerId,
        account: "available",
        type: "escrow_refund",
        direction: "credit",
        amountGrams: refundAmountLong,
        now
      });
      await LedgerEntry.insertMany([refundLedgerEntry], { session });
      return {
        offerId: offer._id.toString(),
        nftId: nft._id.toString(),
        buyerId: offer.buyerId.toString(),
        sellerId: sellerId.toString(),
        refundedAmountGrams: escrow.grossAmountGrams.toString(),
        status: "rejected"
      };
    });
  }

  // Expire pending offers and refund escrow
  public async expirePendingOffers(offerIds?: (Types.ObjectId | string)[]): Promise<number> {
    const now = new Date();
    const query: Record<string, any> = {
      status: "pending",
      expiresAt: { $lte: now }
    };
    if (offerIds && offerIds.length > 0) {
      query._id = { $in: offerIds };
    }
    return this.runInTransaction(async (session) => {
      const expiredOffers = await Offer.find(query).session(session);
      if (expiredOffers.length === 0) {
        return 0;
      }
      const expiredOfferIds = expiredOffers.map((o) => o._id);
      const expiredEscrowIds = expiredOffers.map((o) => o.escrowId);
      await Offer.updateMany(
        { _id: { $in: expiredOfferIds } },
        { $set: { status: "expired" } },
        { session }
      );
      const heldEscrows = await EscrowAccount.find({
        _id: { $in: expiredEscrowIds },
        status: "held"
      }).session(session);
      if (heldEscrows.length > 0) {
        const activeEscrowIds = heldEscrows.map((e) => e._id);
        await EscrowAccount.updateMany(
          { _id: { $in: activeEscrowIds } },
          { $set: { status: "refunded", settledAt: now } },
          { session }
        );
        const userBulkOps = heldEscrows.map((escrow) => ({
          updateOne: {
            filter: { _id: escrow.buyerId },
            update: {
              $inc: { availableBalance: toLong(escrow.grossAmountGrams) }
            }
          }
        }));
        await User.bulkWrite(userBulkOps, { session });
        const refundLedgerEntries = heldEscrows.map((escrow) =>
          this.buildLedgerEntry({
            referenceId: escrow._id,
            userId: escrow.buyerId,
            account: "available",
            type: "escrow_refund",
            direction: "credit",
            amountGrams: toLong(escrow.grossAmountGrams),
            now
          })
        );
        await LedgerEntry.insertMany(refundLedgerEntries, { session });
      }
      return expiredOffers.length;
    });
  }

  // Get all offers
  public async getAllOffers(filter: OfferFilterQuery = {}): Promise<IOffer[]> {
    await this.expirePendingOffers();
    return Offer.find(filter).lean<IOffer[]>();
  }

  // Get offer by id
  public async getOfferById(id: string): Promise<IOffer> {
    await this.expirePendingOffers([id]);
    const offer = await Offer.findById(id).lean<IOffer | null>();
    if (!offer) {
      throw AppError.notFound("Offer not found");
    }
    return offer;
  }
}

export const offerService = new OfferService();
