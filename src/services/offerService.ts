import { type Filter, Int32, Long, ObjectId } from "mongodb";
import { getClient, getDb } from "../config/db.js";
import { COLLECTIONS } from "../models/index.js";
import type {
  AcceptSingleItemOfferInput,
  CreateSingleItemOfferInput,
  ICollection,
  IEscrowAccount,
  ILedgerEntry,
  INft,
  IOffer,
  IUser,
  OfferFilterQuery,
  OfferSettlementSummary,
  SingleItemOfferResult
} from "../types/index.js";
import { AppError } from "../utils/appError.js";
import { logger } from "../utils/logger.js";
import {
  acceptOfferBodySchema,
  createSingleItemOfferBodySchema
} from "../validations/offerValidation.js";

export class OfferService {
  public async createSingleItemOffer(
    input: CreateSingleItemOfferInput
  ): Promise<SingleItemOfferResult> {
    const validated = createSingleItemOfferBodySchema.parse(input);
    const { buyerId, nftId, grossAmountGrams, expiresAt } = validated;

    const expirationDate = expiresAt instanceof Date ? expiresAt : new Date(expiresAt);

    const client = getClient();
    const db = getDb();
    const session = client.startSession();

    try {
      let result!: SingleItemOfferResult;
      await session.withTransaction(async () => {
        const now = new Date();
        const buyerObjectId = new ObjectId(buyerId);
        const nftObjectId = new ObjectId(nftId);
        const grossAmountLong = Long.fromNumber(grossAmountGrams);

        const nft = await db
          .collection<INft>(COLLECTIONS.NFTS)
          .findOne({ _id: nftObjectId }, { session });

        if (!nft) {
          throw AppError.notFound("NFT not found");
        }
        if (nft.isLocked) {
          throw AppError.badRequest("NFT is currently locked");
        }
        if (nft.ownerId.equals(buyerObjectId)) {
          throw AppError.badRequest("Cannot place an offer on your own NFT");
        }

        const collection = await db
          .collection<ICollection>(COLLECTIONS.COLLECTIONS)
          .findOne({ _id: nft.collectionId }, { session });

        if (!collection) {
          throw AppError.notFound("Parent collection for NFT not found");
        }

        const balanceUpdate = await db.collection<IUser>(COLLECTIONS.USERS).updateOne(
          {
            _id: buyerObjectId,
            availableBalance: { $gte: grossAmountLong }
          },
          {
            $inc: { availableBalance: Long.fromNumber(-grossAmountGrams) },
            $set: { updatedAt: now }
          },
          { session }
        );

        if (balanceUpdate.matchedCount === 0) {
          throw AppError.badRequest(
            "Insufficient funds: Available balance is lower than offer amount"
          );
        }

        const offerId = new ObjectId();
        const escrowId = new ObjectId();

        const escrowDoc: IEscrowAccount = {
          _id: escrowId,
          offerId,
          buyerId: buyerObjectId,
          sellerId: nft.ownerId,
          creatorId: collection.creatorId || null,
          grossAmountGrams: grossAmountLong,
          platformFeeBps: new Int32(
            typeof collection.platformFeeBps === "number"
              ? collection.platformFeeBps
              : Number(collection.platformFeeBps) || 0
          ),
          royaltyFeeBps: new Int32(
            typeof collection.royaltyFeeBps === "number"
              ? collection.royaltyFeeBps
              : Number(collection.royaltyFeeBps) || 0
          ),
          status: "held",
          settledAt: null,
          createdAt: now,
          updatedAt: now
        };

        await db.collection<IEscrowAccount>(COLLECTIONS.ESCROW_ACCOUNTS).insertOne(escrowDoc, { session });

        const ledgerDoc: ILedgerEntry = {
          _id: new ObjectId(),
          referenceId: escrowId,
          userId: buyerObjectId,
          account: "available",
          type: "escrow_lock",
          direction: "debit",
          amountGrams: grossAmountLong,
          createdAt: now
        };

        await db.collection<ILedgerEntry>(COLLECTIONS.LEDGER_ENTRIES).insertOne(ledgerDoc, { session });

        const offerDoc: IOffer = {
          _id: offerId,
          buyerId: buyerObjectId,
          escrowId,
          collectionId: nft.collectionId,
          nftId: nftObjectId,
          type: "item",
          grossAmountGrams: grossAmountLong,
          status: "pending",
          expiresAt: expirationDate,
          createdAt: now,
          updatedAt: now
        };

        await db.collection<IOffer>(COLLECTIONS.OFFERS).insertOne(offerDoc, { session });

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
    const query: Filter<IOffer> = {};
    if (filter.buyerId && ObjectId.isValid(filter.buyerId)) {
      query.buyerId = new ObjectId(filter.buyerId);
    }
    if (filter.collectionId && ObjectId.isValid(filter.collectionId)) {
      query.collectionId = new ObjectId(filter.collectionId);
    }
    if (filter.nftId && ObjectId.isValid(filter.nftId)) {
      query.nftId = new ObjectId(filter.nftId);
    }
    if (filter.status) {
      query.status = filter.status;
    }
    const db = getDb();
    return db.collection<IOffer>(COLLECTIONS.OFFERS).find(query).toArray();
  }

  public async getOfferById(id: string): Promise<IOffer> {
    if (!id || !ObjectId.isValid(id)) {
      throw AppError.badRequest("Invalid offer ID format");
    }
    const db = getDb();
    const offer = await db.collection<IOffer>(COLLECTIONS.OFFERS).findOne({ _id: new ObjectId(id) });
    if (!offer) {
      throw AppError.notFound("Offer not found");
    }
    return offer;
  }

  public async acceptSingleItemOffer(
    input: AcceptSingleItemOfferInput
  ): Promise<OfferSettlementSummary> {
    const { offerId, sellerId } = input;
    if (!offerId || !ObjectId.isValid(offerId)) {
      throw AppError.badRequest("Invalid offer ID format");
    }
    acceptOfferBodySchema.parse({ sellerId });

    const client = getClient();
    const db = getDb();
    const session = client.startSession();

    try {
      let settlementSummary!: OfferSettlementSummary;
      await session.withTransaction(async () => {
        const now = new Date();
        const offerObjectId = new ObjectId(offerId);
        const sellerObjectId = new ObjectId(sellerId);

        const offer = await db.collection<IOffer>(COLLECTIONS.OFFERS).findOne(
          {
            _id: offerObjectId,
            status: "pending",
            expiresAt: { $gt: now }
          },
          { session }
        );

        if (!offer) {
          throw AppError.notFound("Offer not found or has already expired");
        }

        const escrow = await db
          .collection<IEscrowAccount>(COLLECTIONS.ESCROW_ACCOUNTS)
          .findOne({ _id: offer.escrowId, status: "held" }, { session });

        if (!escrow) {
          throw AppError.badRequest("Escrow not found or is in an invalid state");
        }

        if (!offer.nftId) {
          throw AppError.badRequest("Offer does not contain an associated NFT");
        }

        const nft = await db.collection<INft>(COLLECTIONS.NFTS).findOne(
          {
            _id: offer.nftId,
            ownerId: sellerObjectId,
            isLocked: false
          },
          { session }
        );

        if (!nft) {
          throw AppError.forbidden("Seller not authorized to accept this offer or NFT is locked");
        }

        const gross = BigInt(escrow.grossAmountGrams.toString());
        const platformBps = BigInt(
          escrow.platformFeeBps?.toString() ?? escrow.feeConfig?.platformFeeBps?.toString() ?? "0"
        );
        const royaltyBps = BigInt(
          escrow.royaltyFeeBps?.toString() ?? escrow.feeConfig?.royaltyFeeBps?.toString() ?? "0"
        );
        const creatorId = escrow.creatorId ?? escrow.feeConfig?.creatorId ?? null;

        const platformFee = (gross * platformBps) / 10000n;
        const royaltyFee = (gross * royaltyBps) / 10000n;
        const netPayout = gross - platformFee - royaltyFee;

        await db.collection<INft>(COLLECTIONS.NFTS).updateOne(
          { _id: nft._id },
          {
            $set: {
              ownerId: offer.buyerId,
              status: "active",
              isLocked: false,
              updatedAt: now
            }
          },
          { session }
        );

        await db.collection<IUser>(COLLECTIONS.USERS).updateOne(
          { _id: sellerObjectId },
          {
            $inc: { availableBalance: Long.fromString(netPayout.toString()) },
            $set: { updatedAt: now }
          },
          { session }
        );

        if (royaltyFee > 0n && creatorId) {
          await db.collection<IUser>(COLLECTIONS.USERS).updateOne(
            { _id: creatorId },
            {
              $inc: { availableBalance: Long.fromString(royaltyFee.toString()) },
              $set: { updatedAt: now }
            },
            { session }
          );
        }

        await db.collection<IEscrowAccount>(COLLECTIONS.ESCROW_ACCOUNTS).updateOne(
          { _id: escrow._id },
          {
            $set: {
              sellerId: sellerObjectId,
              status: "settled",
              settledAt: now,
              updatedAt: now
            }
          },
          { session }
        );

        await db.collection<IOffer>(COLLECTIONS.OFFERS).updateOne(
          { _id: offer._id },
          {
            $set: {
              status: "accepted",
              updatedAt: now
            }
          },
          { session }
        );

        const ledgerEntries: ILedgerEntry[] = [
          {
            _id: new ObjectId(),
            referenceId: escrow._id,
            userId: sellerObjectId,
            account: "available",
            type: "seller_payout",
            direction: "credit",
            amountGrams: Long.fromString(netPayout.toString()),
            createdAt: now
          },
          {
            _id: new ObjectId(),
            referenceId: escrow._id,
            userId: null,
            account: "treasury",
            type: "platform_fee",
            direction: "credit",
            amountGrams: Long.fromString(platformFee.toString()),
            createdAt: now
          }
        ];

        if (royaltyFee > 0n && creatorId) {
          ledgerEntries.push({
            _id: new ObjectId(),
            referenceId: escrow._id,
            userId: creatorId,
            account: "available",
            type: "royalty_fee",
            direction: "credit",
            amountGrams: Long.fromString(royaltyFee.toString()),
            createdAt: now
          });
        }

        await db.collection<ILedgerEntry>(COLLECTIONS.LEDGER_ENTRIES).insertMany(ledgerEntries, { session });

        const competingOffers = await db
          .collection<IOffer>(COLLECTIONS.OFFERS)
          .find(
            {
              _id: { $ne: offer._id },
              nftId: nft._id,
              status: "pending"
            },
            { session }
          )
          .toArray();

        for (const compOffer of competingOffers) {
          await db
            .collection<IOffer>(COLLECTIONS.OFFERS)
            .updateOne(
              { _id: compOffer._id },
              { $set: { status: "invalidated", updatedAt: now } },
              { session }
            );

          const compEscrow = await db
            .collection<IEscrowAccount>(COLLECTIONS.ESCROW_ACCOUNTS)
            .findOne({ _id: compOffer.escrowId, status: "held" }, { session });

          if (compEscrow) {
            await db
              .collection<IEscrowAccount>(COLLECTIONS.ESCROW_ACCOUNTS)
              .updateOne(
                { _id: compEscrow._id },
                { $set: { status: "refunded", updatedAt: now, settledAt: now } },
                { session }
              );

            await db.collection<IUser>(COLLECTIONS.USERS).updateOne(
              { _id: compOffer.buyerId },
              {
                $inc: { availableBalance: compEscrow.grossAmountGrams },
                $set: { updatedAt: now }
              },
              { session }
            );

            await db.collection<ILedgerEntry>(COLLECTIONS.LEDGER_ENTRIES).insertOne(
              {
                _id: new ObjectId(),
                referenceId: compEscrow._id,
                userId: compOffer.buyerId,
                account: "available",
                type: "escrow_refund",
                direction: "credit",
                amountGrams: compEscrow.grossAmountGrams,
                createdAt: now
              },
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

export const createSingleItemOffer = (input: CreateSingleItemOfferInput) =>
  offerService.createSingleItemOffer(input);
export const getAllOffers = (filter?: OfferFilterQuery) => offerService.getAllOffers(filter);
export const getOfferById = (id: string) => offerService.getOfferById(id);
export const acceptSingleItemOffer = (input: AcceptSingleItemOfferInput) =>
  offerService.acceptSingleItemOffer(input);
