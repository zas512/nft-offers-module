import { Int32, Long, ObjectId } from "mongodb";
import { type CreateEscrowInput, ESCROW_STATUSES, type IEscrowAccount } from "../types/index.js";
import { AppError } from "../utils/appError.js";
import { createTimestamps } from "../utils/timestamps.js";

export { ESCROW_STATUSES };

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

function toObjectId(id: string | ObjectId | null | undefined): ObjectId | null {
  if (!id) return null;
  return typeof id === "string" ? new ObjectId(id) : id;
}

export class EscrowModel {
  public static createDocument(input: CreateEscrowInput): Omit<IEscrowAccount, "_id"> {
    const {
      offerId,
      buyerId,
      sellerId = null,
      creatorId = null,
      grossAmountGrams,
      platformFeeBps = 0,
      royaltyFeeBps = 0,
      status = "held",
      settledAt = null
    } = input;

    if (!offerId || !ObjectId.isValid(offerId)) {
      throw AppError.badRequest("INVALID_OFFER_ID");
    }
    if (!buyerId || !ObjectId.isValid(buyerId)) {
      throw AppError.badRequest("INVALID_BUYER_ID");
    }
    if (sellerId && !ObjectId.isValid(sellerId)) {
      throw AppError.badRequest("INVALID_SELLER_ID");
    }
    if (creatorId && !ObjectId.isValid(creatorId)) {
      throw AppError.badRequest("INVALID_CREATOR_ID");
    }
    if (
      typeof grossAmountGrams !== "number" ||
      grossAmountGrams <= 0 ||
      !Number.isSafeInteger(grossAmountGrams)
    ) {
      throw AppError.badRequest("INVALID_GROSS_AMOUNT");
    }
    if (
      typeof platformFeeBps !== "number" ||
      platformFeeBps < 0 ||
      platformFeeBps > 10000 ||
      !Number.isInteger(platformFeeBps)
    ) {
      throw AppError.badRequest("INVALID_PLATFORM_FEE_BPS");
    }
    if (
      typeof royaltyFeeBps !== "number" ||
      royaltyFeeBps < 0 ||
      royaltyFeeBps > 10000 ||
      !Number.isInteger(royaltyFeeBps)
    ) {
      throw AppError.badRequest("INVALID_ROYALTY_FEE_BPS");
    }
    if (!ESCROW_STATUSES.includes(status)) {
      throw AppError.badRequest("INVALID_STATUS");
    }

    const settledDate = settledAt ? (settledAt instanceof Date ? settledAt : new Date(settledAt)) : null;

    return {
      offerId: toObjectId(offerId)!,
      buyerId: toObjectId(buyerId)!,
      sellerId: toObjectId(sellerId),
      creatorId: toObjectId(creatorId),
      grossAmountGrams: Long.fromNumber(grossAmountGrams),
      platformFeeBps: new Int32(platformFeeBps),
      royaltyFeeBps: new Int32(royaltyFeeBps),
      status,
      settledAt: settledDate,
      ...createTimestamps()
    };
  }
}

export function createEscrowDocument(input: CreateEscrowInput): Omit<IEscrowAccount, "_id"> {
  return EscrowModel.createDocument(input);
}
