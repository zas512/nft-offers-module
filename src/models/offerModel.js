import { Long, ObjectId } from "mongodb";
import { createTimestamps } from "../utils/timestamps.js";

export const OFFER_TYPES = Object.freeze(["item", "collection"]);
export const OFFER_STATUSES = Object.freeze([
  "pending",
  "accepted",
  "cancelled",
  "expired",
  "invalidated"
]);

export const offerSchemaValidator = {
  $jsonSchema: {
    bsonType: "object",
    required: [
      "buyerId",
      "escrowId",
      "collectionId",
      "type",
      "grossAmountGrams",
      "status",
      "expiresAt",
      "createdAt",
      "updatedAt"
    ],
    properties: {
      buyerId: {
        bsonType: "objectId"
      },
      escrowId: {
        bsonType: "objectId"
      },
      collectionId: {
        bsonType: "objectId"
      },
      nftId: {
        bsonType: ["objectId", "null"]
      },
      type: {
        bsonType: "string",
        enum: ["item", "collection"]
      },
      grossAmountGrams: {
        bsonType: "long",
        minimum: 0
      },
      status: {
        bsonType: "string",
        enum: ["pending", "accepted", "cancelled", "expired", "invalidated"]
      },
      expiresAt: { bsonType: "date" },
      createdAt: { bsonType: "date" },
      updatedAt: { bsonType: "date" }
    }
  }
};

function toObjectId(id) {
  if (!id) {
    return null;
  }
  return typeof id === "string" ? new ObjectId(id) : id;
}

function validateOfferIds({ buyerId, collectionId, escrowId, nftId }) {
  if (!buyerId || !ObjectId.isValid(buyerId)) {
    throw new Error("INVALID_BUYER_ID");
  }
  if (!escrowId || !ObjectId.isValid(escrowId)) {
    throw new Error("INVALID_ESCROW_ID");
  }
  if (!collectionId || !ObjectId.isValid(collectionId)) {
    throw new Error("INVALID_COLLECTION_ID");
  }
  if (nftId && !ObjectId.isValid(nftId)) {
    throw new Error("INVALID_NFT_ID");
  }
}

function validateOfferTypeAndStatus(type, nftId, status) {
  if (!OFFER_TYPES.includes(type)) {
    throw new Error("INVALID_OFFER_TYPE");
  }
  if (type === "item" && !nftId) {
    throw new Error("NFT_ID_REQUIRED_FOR_ITEM_OFFER");
  }
  if (!OFFER_STATUSES.includes(status)) {
    throw new Error("INVALID_STATUS");
  }
}

function validateGrossAmount(grossAmountGrams) {
  if (
    typeof grossAmountGrams !== "number" ||
    grossAmountGrams <= 0 ||
    !Number.isSafeInteger(grossAmountGrams)
  ) {
    throw new Error("INVALID_GROSS_AMOUNT");
  }
}

function parseExpirationDate(expiresAt) {
  const expirationDate = expiresAt instanceof Date ? expiresAt : new Date(expiresAt);
  if (Number.isNaN(expirationDate.getTime()) || expirationDate <= new Date()) {
    throw new Error("INVALID_EXPIRES_AT");
  }
  return expirationDate;
}

export function createOfferDocument({
  buyerId,
  collectionId,
  escrowId,
  nftId = null,
  type = "item",
  grossAmountGrams,
  expiresAt,
  status = "pending"
}) {
  validateOfferIds({ buyerId, collectionId, escrowId, nftId });
  validateOfferTypeAndStatus(type, nftId, status);
  validateGrossAmount(grossAmountGrams);
  const expirationDate = parseExpirationDate(expiresAt);
  return {
    buyerId: toObjectId(buyerId),
    escrowId: toObjectId(escrowId),
    collectionId: toObjectId(collectionId),
    nftId: toObjectId(nftId),
    type,
    grossAmountGrams: Long.fromNumber(grossAmountGrams),
    status,
    expiresAt: expirationDate,
    ...createTimestamps()
  };
}
