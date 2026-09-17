import { ObjectId } from "mongodb";
import { createTimestamps } from "../utils/timestamps.js";

export const ESCROW_STATUSES = Object.freeze(["held", "settled", "refunded", "cancelled"]);

export const escrowSchemaValidator = {
  $jsonSchema: {
    bsonType: "object",
    required: ["offerId", "buyerId", "grossAmountGrams", "status", "createdAt", "updatedAt"],
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
      grossAmountGrams: {
        bsonType: "long",
        minimum: 0
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
  grossAmountGrams,
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
  if (
    typeof grossAmountGrams !== "number" ||
    grossAmountGrams <= 0 ||
    !Number.isSafeInteger(grossAmountGrams)
  ) {
    throw new Error("INVALID_GROSS_AMOUNT");
  }
  if (!ESCROW_STATUSES.includes(status)) {
    throw new Error("INVALID_STATUS");
  }
  return {
    offerId: toObjectId(offerId),
    buyerId: toObjectId(buyerId),
    sellerId: toObjectId(sellerId),
    grossAmountGrams,
    status,
    settledAt: parseSettledAt(settledAt),
    ...createTimestamps()
  };
}
