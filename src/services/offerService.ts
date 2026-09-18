import mongoose from "mongoose";
import { Collection, EscrowAccount, LedgerEntry, Nft, Offer, User } from "../models/index.js";
import type {
  AcceptSingleItemOfferInput,
  CreateSingleItemOfferInput,
  ILedgerEntry,
  IOffer,
  OfferFilterQuery,
  OfferSettlementSummary,
  SingleItemOfferResult
} from "../types/index.js";
import { AppError } from "../utils/appError.js";
import { logger } from "../utils/logger.js";
import {
  acceptOfferBodySchema,
  createSingleItemOfferBodySchema
} from "../validations/index.js";

export class OfferService {
  public async createSingleItemOffer(
    input: CreateSingleItemOfferInput
  ): Promise<SingleItemOfferResult> {
    const validated = createSingleItemOfferBodySchema.parse(input);
    const { buyerId, nftId, grossAmountGrams, expiresAt } = validated;

    const expirationDate = expiresAt instanceof Date ? expiresAt : new Date(expiresAt);

    const session = await mongoose.startSession();

    try {
      let result!: SingleItemOfferResult;
      await session.withTransaction(async () => {
        const now = new Date();
        const buyerObjectId = new mongoose.Types.ObjectId(buyerId);
        const nftObjectId = new mongoose.Types.ObjectId(nftId);

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

        const collection = await Collection.findById(nft.collectionId).session(session);
        if (!collection) {
          throw AppError.notFound("Parent collection for NFT not found");
        }

        const balanceUpdate = await User.updateOne(
          {
            _id: buyerObjectId,
            availableBalance: { $gte: grossAmountGrams }
          },
          {
            $inc: { availableBalance: -grossAmountGrams }
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

        const platformFeeBps = Number(collection.platformFeeBps) || 0;
        const royaltyFeeBps = Number(collection.royaltyFeeBps) || 0;

        await EscrowAccount.create(
          [
            {
              _id: escrowId,
              offerId,
              buyerId: buyerObjectId,
              sellerId: nft.ownerId,
              creatorId: collection.creatorId || null,
              grossAmountGrams,
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
            {
              _id: new mongoose.Types.ObjectId(),
              referenceId: escrowId,
              userId: buyerObjectId,
              account: "available",
              type: "escrow_lock",
              direction: "debit",
              amountGrams: grossAmountGrams,
              createdAt: now
            }
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
              grossAmountGrams,
              status: "pending",
              expiresAt: expirationDate
            }
          ],
          { session }
        );

        logger.flow("SINGLE_ITEM_OFFER_CREATED", "Offer placed, escrow held & ledger audited", {
          offerId: offerId.toString(),
          escrowId: escrowId.toString(),
          grossAmountGrams
        });

        result = {
          offerId: offerId.toString(),
          escrowId: escrowId.toString(),
          buyerId: buyerObjectId.toString(),
          sellerId: nft.ownerId.toString(),
          collectionId: nft.collectionId.toString(),
          nftId: nftObjectId.toString(),
          grossAmountGrams,
          status: "pending",
          expiresAt: expirationDate.toISOString()
        };
      });

      return result;
    } finally {
      await session.endSession();
    }
  }

  public async getAllOffers(filter: OfferFilterQuery = {}): Promise<IOffer[]> {
    const query: Record<string, unknown> = {};
    if (filter.buyerId && mongoose.Types.ObjectId.isValid(filter.buyerId)) {
      query.buyerId = new mongoose.Types.ObjectId(filter.buyerId);
    }
    if (filter.collectionId && mongoose.Types.ObjectId.isValid(filter.collectionId)) {
      query.collectionId = new mongoose.Types.ObjectId(filter.collectionId);
    }
    if (filter.nftId && mongoose.Types.ObjectId.isValid(filter.nftId)) {
      query.nftId = new mongoose.Types.ObjectId(filter.nftId);
    }
    if (filter.status) {
      query.status = filter.status;
    }
    return Offer.find(query).lean<IOffer[]>();
  }

  public async getOfferById(id: string): Promise<IOffer> {
    if (!id || !mongoose.Types.ObjectId.isValid(id)) {
      throw AppError.badRequest("Invalid offer ID format");
    }
    const offer = await Offer.findById(id).lean<IOffer | null>();
    if (!offer) {
      throw AppError.notFound("Offer not found");
    }
    return offer;
  }

  public async acceptSingleItemOffer(
    input: AcceptSingleItemOfferInput
  ): Promise<OfferSettlementSummary> {
    const { offerId, sellerId } = input;
    if (!offerId || !mongoose.Types.ObjectId.isValid(offerId)) {
      throw AppError.badRequest("Invalid offer ID format");
    }
    acceptOfferBodySchema.parse({ sellerId });

    const session = await mongoose.startSession();

    try {
      let settlementSummary!: OfferSettlementSummary;
      await session.withTransaction(async () => {
        const now = new Date();
        const offerObjectId = new mongoose.Types.ObjectId(offerId);
        const sellerObjectId = new mongoose.Types.ObjectId(sellerId);

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

        const gross = BigInt(escrow.grossAmountGrams);
        const platformBps = BigInt(escrow.platformFeeBps ?? escrow.feeConfig?.platformFeeBps ?? 0);
        const royaltyBps = BigInt(escrow.royaltyFeeBps ?? escrow.feeConfig?.royaltyFeeBps ?? 0);
        const creatorId = escrow.creatorId ?? escrow.feeConfig?.creatorId ?? null;

        const platformFee = (gross * platformBps) / 10000n;
        const royaltyFee = (gross * royaltyBps) / 10000n;
        const netPayout = gross - platformFee - royaltyFee;

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
            $inc: { availableBalance: Number(netPayout) }
          },
          { session }
        );

        if (royaltyFee > 0n && creatorId) {
          await User.updateOne(
            { _id: creatorId },
            {
              $inc: { availableBalance: Number(royaltyFee) }
            },
            { session }
          );
        }

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

        const ledgerEntries: Partial<ILedgerEntry>[] = [
          {
            _id: new mongoose.Types.ObjectId(),
            referenceId: escrow._id,
            userId: sellerObjectId,
            account: "available",
            type: "seller_payout",
            direction: "credit",
            amountGrams: Number(netPayout),
            createdAt: now
          },
          {
            _id: new mongoose.Types.ObjectId(),
            referenceId: escrow._id,
            userId: null,
            account: "treasury",
            type: "platform_fee",
            direction: "credit",
            amountGrams: Number(platformFee),
            createdAt: now
          }
        ];

        if (royaltyFee > 0n && creatorId) {
          ledgerEntries.push({
            _id: new mongoose.Types.ObjectId(),
            referenceId: escrow._id,
            userId: creatorId,
            account: "available",
            type: "royalty_fee",
            direction: "credit",
            amountGrams: Number(royaltyFee),
            createdAt: now
          });
        }

        await LedgerEntry.insertMany(ledgerEntries, { session });

        const competingOffers = await Offer.find({
          _id: { $ne: offer._id },
          nftId: nft._id,
          status: "pending"
        }).session(session);

        for (const compOffer of competingOffers) {
          await Offer.updateOne(
            { _id: compOffer._id },
            { $set: { status: "invalidated" } },
            { session }
          );

          const compEscrow = await EscrowAccount.findOne({
            _id: compOffer.escrowId,
            status: "held"
          }).session(session);

          if (compEscrow) {
            await EscrowAccount.updateOne(
              { _id: compEscrow._id },
              { $set: { status: "refunded", settledAt: now } },
              { session }
            );

            await User.updateOne(
              { _id: compOffer.buyerId },
              {
                $inc: { availableBalance: compEscrow.grossAmountGrams }
              },
              { session }
            );

            await LedgerEntry.create(
              [
                {
                  _id: new mongoose.Types.ObjectId(),
                  referenceId: compEscrow._id,
                  userId: compOffer.buyerId,
                  account: "available",
                  type: "escrow_refund",
                  direction: "credit",
                  amountGrams: compEscrow.grossAmountGrams,
                  createdAt: now
                }
              ],
              { session }
            );
          }
        }

        logger.flow(
          "SINGLE_ITEM_OFFER_ACCEPTED",
          "Offer accepted & settled with cascade invalidation",
          {
            offerId: offer._id.toString(),
            nftId: nft._id.toString(),
            netPayout: netPayout.toString(),
            invalidatedBidsCount: competingOffers.length
          }
        );

        settlementSummary = {
          offerId: offer._id.toString(),
          nftId: nft._id.toString(),
          buyerId: offer.buyerId.toString(),
          sellerId: sellerObjectId.toString(),
          grossAmountGrams: gross.toString(),
          netPayoutGrams: netPayout.toString(),
          platformFeeGrams: platformFee.toString(),
          royaltyFeeGrams: royaltyFee.toString(),
          invalidatedOffersCount: competingOffers.length
        };
      });

      return settlementSummary;
    } finally {
      await session.endSession();
    }
  }
}

export const offerService = new OfferService();
