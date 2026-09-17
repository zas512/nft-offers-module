import { Int32, Long, ObjectId } from "mongodb";
import { createTimestamps } from "../utils/timestamps.js";

export const ESCROW_STATUSES = Object.freeze(["held", "settled", "refunded", "cancelled"]);

export const escrowSchemaValidator = {
  $jsonSchema: {
    bsonType: "object",
    required: [
      "offerId",
      "buyerId",
      "grossAmountGrams",
      "platformFeeBps",
      "royaltyFeeBps",
      "status",
      "createdAt",
      "updatedAt"
    ],
    properties: {
      offerId: {
        bsonType: "objectId"
      },
      buyerId: {
        bsonType: "objectId"
      },
      sellerId: {
        bsonType: ["objectId", "null"]
      },
      creatorId: {
        bsonType: ["objectId", "null"]
      },
      grossAmountGrams: {
        bsonType: "long",
        minimum: 0
      },
      platformFeeBps: {
        bsonType: "int",
        minimum: 0,
        maximum: 10000
      },
      royaltyFeeBps: {
        bsonType: "int",
        minimum: 0,
        maximum: 10000
      },
      status: {
        bsonType: "string",
        enum: ["held", "settled", "refunded", "cancelled"]
      },
      settledAt: {
        bsonType: ["date", "null"]
      },
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

function parseSettledAt(settledAt) {
  if (!settledAt) {
    return null;
  }
  return settledAt instanceof Date ? settledAt : new Date(settledAt);
}

export function createEscrowDocument({
  offerId,
  buyerId,
  sellerId = null,
  creatorId = null,
  grossAmountGrams,
  platformFeeBps = 0,
  royaltyFeeBps = 0,
  status = "held",
  settledAt = null
}) {
  if (!offerId || !ObjectId.isValid(offerId)) {
    throw new Error("INVALID_OFFER_ID");
  }
  if (!buyerId || !ObjectId.isValid(buyerId)) {
    throw new Error("INVALID_BUYER_ID");
  }
  if (sellerId && !ObjectId.isValid(sellerId)) {
    throw new Error("INVALID_SELLER_ID");
  }
  if (creatorId && !ObjectId.isValid(creatorId)) {
    throw new Error("INVALID_CREATOR_ID");
  }
  if (
    typeof grossAmountGrams !== "number" ||
    grossAmountGrams <= 0 ||
    !Number.isSafeInteger(grossAmountGrams)
  ) {
    throw new Error("INVALID_GROSS_AMOUNT");
  }
  if (
    typeof platformFeeBps !== "number" ||
    platformFeeBps < 0 ||
    platformFeeBps > 10000 ||
    !Number.isInteger(platformFeeBps)
  ) {
    throw new Error("INVALID_PLATFORM_FEE_BPS");
  }
  if (
    typeof royaltyFeeBps !== "number" ||
    royaltyFeeBps < 0 ||
    royaltyFeeBps > 10000 ||
    !Number.isInteger(royaltyFeeBps)
  ) {
    throw new Error("INVALID_ROYALTY_FEE_BPS");
  }
  if (!ESCROW_STATUSES.includes(status)) {
    throw new Error("INVALID_STATUS");
  }
  return {
    offerId: toObjectId(offerId),
    buyerId: toObjectId(buyerId),
    sellerId: toObjectId(sellerId),
    creatorId: toObjectId(creatorId),
    grossAmountGrams: Long.fromNumber(grossAmountGrams),
    platformFeeBps: new Int32(platformFeeBps),
    royaltyFeeBps: new Int32(royaltyFeeBps),
    status,
    settledAt: parseSettledAt(settledAt),
    ...createTimestamps()
  };
}
