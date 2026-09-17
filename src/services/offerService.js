import { Int32, Long, ObjectId } from "mongodb";
import { getClient, getDb } from "../config/db.js";
import { COLLECTIONS } from "../models/index.js";
import { createAppError } from "../utils/appError.js";
import { logger } from "../utils/logger.js";

export async function createSingleItemOffer({ buyerId, nftId, grossAmountGrams, expiresAt }) {
  if (!buyerId || !ObjectId.isValid(buyerId)) {
    throw createAppError("Invalid buyer ID format", 400);
  }
  if (!nftId || !ObjectId.isValid(nftId)) {
    throw createAppError("Invalid NFT ID format", 400);
  }
  if (
    typeof grossAmountGrams !== "number" ||
    grossAmountGrams <= 0 ||
    !Number.isSafeInteger(grossAmountGrams)
  ) {
    throw createAppError("Invalid gross amount (must be a positive integer)", 400);
  }
  const expirationDate = expiresAt instanceof Date ? expiresAt : new Date(expiresAt);
  if (Number.isNaN(expirationDate.getTime()) || expirationDate <= new Date()) {
    throw createAppError("Invalid expiration date (must be in the future)", 400);
  }
  const client = getClient();
  const db = getDb();
  const session = client.startSession();
  try {
    let result;
    await session.withTransaction(async () => {
      const now = new Date();
      const buyerObjectId = new ObjectId(buyerId);
      const nftObjectId = new ObjectId(nftId);
      const grossAmountLong = Long.fromNumber(grossAmountGrams);
      const nft = await db.collection(COLLECTIONS.NFTS).findOne({ _id: nftObjectId }, { session });
      if (!nft) {
        throw createAppError("NFT not found", 404);
      }
      if (nft.isLocked) {
        throw createAppError("NFT is currently locked", 400);
      }
      if (nft.ownerId.equals(buyerObjectId)) {
        throw createAppError("Cannot place an offer on your own NFT", 400);
      }
      const collection = await db
        .collection(COLLECTIONS.COLLECTIONS)
        .findOne({ _id: nft.collectionId }, { session });
      if (!collection) {
        throw createAppError("Parent collection for NFT not found", 404);
      }
      const balanceUpdate = await db.collection(COLLECTIONS.USERS).updateOne(
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
        throw createAppError(
          "Insufficient funds: Available balance is lower than offer amount",
          400
        );
      }
      const offerId = new ObjectId();
      const escrowId = new ObjectId();
      const escrowDoc = {
        _id: escrowId,
        offerId,
        buyerId: buyerObjectId,
        sellerId: nft.ownerId,
        creatorId: collection.creatorId || null,
        grossAmountGrams: grossAmountLong,
        platformFeeBps: new Int32(collection.platformFeeBps || 0),
        royaltyFeeBps: new Int32(collection.royaltyFeeBps || 0),
        status: "held",
        settledAt: null,
        createdAt: now,
        updatedAt: now
      };
      await db.collection(COLLECTIONS.ESCROW_ACCOUNTS).insertOne(escrowDoc, { session });
      const ledgerDoc = {
        _id: new ObjectId(),
        referenceId: escrowId,
        userId: buyerObjectId,
        account: "available",
        type: "escrow_lock",
        direction: "debit",
        amountGrams: grossAmountLong,
        createdAt: now
      };
      await db.collection(COLLECTIONS.LEDGER_ENTRIES).insertOne(ledgerDoc, { session });
      const offerDoc = {
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
      await db.collection(COLLECTIONS.OFFERS).insertOne(offerDoc, { session });
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

export async function getAllOffers(filter = {}) {
  const query = {};
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
  return db.collection(COLLECTIONS.OFFERS).find(query).toArray();
}

export async function getOfferById(id) {
  if (!id || !ObjectId.isValid(id)) {
    throw createAppError("Invalid offer ID format", 400);
  }
  const db = getDb();
  const offer = await db.collection(COLLECTIONS.OFFERS).findOne({ _id: new ObjectId(id) });
  if (!offer) {
    throw createAppError("Offer not found", 404);
  }
  return offer;
}

export async function acceptSingleItemOffer({ offerId, sellerId }) {
  if (!offerId || !ObjectId.isValid(offerId)) {
    throw createAppError("Invalid offer ID format", 400);
  }
  if (!sellerId || !ObjectId.isValid(sellerId)) {
    throw createAppError("Invalid seller ID format", 400);
  }
  const client = getClient();
  const db = getDb();
  const session = client.startSession();
  try {
    let settlementSummary;
    await session.withTransaction(async () => {
      const now = new Date();
      const offerObjectId = new ObjectId(offerId);
      const sellerObjectId = new ObjectId(sellerId);
      const offer = await db.collection(COLLECTIONS.OFFERS).findOne(
        {
          _id: offerObjectId,
          status: "pending",
          expiresAt: { $gt: now }
        },
        { session }
      );
      if (!offer) {
        throw createAppError("Offer not found or has already expired", 404);
      }
      const escrow = await db
        .collection(COLLECTIONS.ESCROW_ACCOUNTS)
        .findOne({ _id: offer.escrowId, status: "held" }, { session });
      if (!escrow) {
        throw createAppError("Escrow not found or is in an invalid state", 400);
      }
      const nft = await db.collection(COLLECTIONS.NFTS).findOne(
        {
          _id: offer.nftId,
          ownerId: sellerObjectId,
          isLocked: false
        },
        { session }
      );
      if (!nft) {
        throw createAppError("Seller not authorized to accept this offer or NFT is locked", 403);
      }
      const gross = BigInt(escrow.grossAmountGrams.toString());
      const platformBps = BigInt(escrow.platformFeeBps ?? escrow.feeConfig?.platformFeeBps ?? 0);
      const royaltyBps = BigInt(escrow.royaltyFeeBps ?? escrow.feeConfig?.royaltyFeeBps ?? 0);
      const creatorId = escrow.creatorId ?? escrow.feeConfig?.creatorId ?? null;
      const platformFee = (gross * platformBps) / 10000n;
      const royaltyFee = (gross * royaltyBps) / 10000n;
      const netPayout = gross - platformFee - royaltyFee;
      await db.collection(COLLECTIONS.NFTS).updateOne(
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
      await db.collection(COLLECTIONS.USERS).updateOne(
        { _id: sellerObjectId },
        {
          $inc: { availableBalance: Long.fromString(netPayout.toString()) },
          $set: { updatedAt: now }
        },
        { session }
      );
      if (royaltyFee > 0n && creatorId) {
        await db.collection(COLLECTIONS.USERS).updateOne(
          { _id: creatorId },
          {
            $inc: { availableBalance: Long.fromString(royaltyFee.toString()) },
            $set: { updatedAt: now }
          },
          { session }
        );
      }
      await db.collection(COLLECTIONS.ESCROW_ACCOUNTS).updateOne(
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
      await db.collection(COLLECTIONS.OFFERS).updateOne(
        { _id: offer._id },
        {
          $set: {
            status: "accepted",
            updatedAt: now
          }
        },
        { session }
      );
      const ledgerEntries = [
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
      await db.collection(COLLECTIONS.LEDGER_ENTRIES).insertMany(ledgerEntries, { session });
      const competingOffers = await db
        .collection(COLLECTIONS.OFFERS)
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
          .collection(COLLECTIONS.OFFERS)
          .updateOne(
            { _id: compOffer._id },
            { $set: { status: "invalidated", updatedAt: now } },
            { session }
          );
        const compEscrow = await db
          .collection(COLLECTIONS.ESCROW_ACCOUNTS)
          .findOne({ _id: compOffer.escrowId, status: "held" }, { session });
        if (compEscrow) {
          await db
            .collection(COLLECTIONS.ESCROW_ACCOUNTS)
            .updateOne(
              { _id: compEscrow._id },
              { $set: { status: "refunded", updatedAt: now, settledAt: now } },
              { session }
            );
          await db.collection(COLLECTIONS.USERS).updateOne(
            { _id: compOffer.buyerId },
            {
              $inc: { availableBalance: compEscrow.grossAmountGrams },
              $set: { updatedAt: now }
            },
            { session }
          );
          await db.collection(COLLECTIONS.LEDGER_ENTRIES).insertOne(
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
