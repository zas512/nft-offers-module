import { Long, ObjectId } from "mongodb";
import { type IOffer, OFFER_STATUSES, OFFER_TYPES, type OfferStatus, type OfferType } from "../types/index.js";
import { AppError } from "../utils/appError.js";
import { createTimestamps } from "../utils/timestamps.js";

export { OFFER_STATUSES, OFFER_TYPES };

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

function toObjectId(id: string | ObjectId | null | undefined): ObjectId | null {
  if (!id) return null;
  return typeof id === "string" ? new ObjectId(id) : id;
}

export interface CreateOfferDocumentInput {
  buyerId: string | ObjectId;
  collectionId: string | ObjectId;
  escrowId: string | ObjectId;
  nftId?: string | ObjectId | null;
  type?: OfferType;
  grossAmountGrams: number;
  expiresAt: string | Date;
  status?: OfferStatus;
}

export class OfferModel {
  public static createDocument(input: CreateOfferDocumentInput): Omit<IOffer, "_id"> {
    const {
      buyerId,
      collectionId,
      escrowId,
      nftId = null,
      type = "item",
      grossAmountGrams,
      expiresAt,
      status = "pending"
    } = input;

    if (!buyerId || !ObjectId.isValid(buyerId)) {
      throw AppError.badRequest("INVALID_BUYER_ID");
    }
    if (!escrowId || !ObjectId.isValid(escrowId)) {
      throw AppError.badRequest("INVALID_ESCROW_ID");
    }
    if (!collectionId || !ObjectId.isValid(collectionId)) {
      throw AppError.badRequest("INVALID_COLLECTION_ID");
    }
    if (nftId && !ObjectId.isValid(nftId)) {
      throw AppError.badRequest("INVALID_NFT_ID");
    }
    if (!OFFER_TYPES.includes(type)) {
      throw AppError.badRequest("INVALID_OFFER_TYPE");
    }
    if (type === "item" && !nftId) {
      throw AppError.badRequest("NFT_ID_REQUIRED_FOR_ITEM_OFFER");
    }
    if (!OFFER_STATUSES.includes(status)) {
      throw AppError.badRequest("INVALID_STATUS");
    }
    if (
      typeof grossAmountGrams !== "number" ||
      grossAmountGrams <= 0 ||
      !Number.isSafeInteger(grossAmountGrams)
    ) {
      throw AppError.badRequest("INVALID_GROSS_AMOUNT");
    }

    const expirationDate = expiresAt instanceof Date ? expiresAt : new Date(expiresAt);
    if (Number.isNaN(expirationDate.getTime()) || expirationDate <= new Date()) {
      throw AppError.badRequest("INVALID_EXPIRES_AT");
    }

    return {
      buyerId: toObjectId(buyerId)!,
      escrowId: toObjectId(escrowId)!,
      collectionId: toObjectId(collectionId)!,
      nftId: toObjectId(nftId),
      type,
      grossAmountGrams: Long.fromNumber(grossAmountGrams),
      status,
      expiresAt: expirationDate,
      ...createTimestamps()
    };
  }
}

export function createOfferDocument(input: CreateOfferDocumentInput): Omit<IOffer, "_id"> {
  return OfferModel.createDocument(input);
}
