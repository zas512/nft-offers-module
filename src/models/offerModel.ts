import mongoose, { Schema, type Model } from "mongoose";
import {
  OFFER_STATUSES,
  OFFER_TYPES,
  type IOffer,
  type OfferStatus,
  type OfferType
} from "../types/index.js";
import { AppError } from "../utils/appError.js";

export { OFFER_STATUSES, OFFER_TYPES };

export interface CreateOfferDocumentInput {
  buyerId: string | mongoose.Types.ObjectId;
  collectionId: string | mongoose.Types.ObjectId;
  escrowId: string | mongoose.Types.ObjectId;
  nftId?: string | mongoose.Types.ObjectId | null;
  type?: OfferType;
  grossAmountGrams: number;
  expiresAt: string | Date;
  status?: OfferStatus;
}

export const offerSchema = new Schema<IOffer>(
  {
    buyerId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true
    },
    escrowId: {
      type: Schema.Types.ObjectId,
      ref: "EscrowAccount",
      required: true
    },
    collectionId: {
      type: Schema.Types.ObjectId,
      ref: "Collection",
      required: true
    },
    nftId: {
      type: Schema.Types.ObjectId,
      ref: "Nft",
      default: null
    },
    type: {
      type: String,
      enum: OFFER_TYPES,
      default: "item",
      required: true
    },
    grossAmountGrams: {
      type: Number,
      required: true,
      min: 1
    },
    status: {
      type: String,
      enum: OFFER_STATUSES,
      default: "pending",
      required: true
    },
    expiresAt: {
      type: Date,
      required: true
    }
  },
  {
    timestamps: true,
    versionKey: false
  }
);

offerSchema.index({ nftId: 1, status: 1 });
offerSchema.index({ buyerId: 1 });
offerSchema.index({ collectionId: 1 });

export const Offer: Model<IOffer> =
  mongoose.models.Offer || mongoose.model<IOffer>("Offer", offerSchema, "offers");
export const OfferModel = Offer;

function toObjectId(
  id: string | mongoose.Types.ObjectId | null | undefined
): mongoose.Types.ObjectId | null {
  if (!id) return null;
  return typeof id === "string" ? new mongoose.Types.ObjectId(id) : id;
}

export function createOfferDocument(input: CreateOfferDocumentInput): Partial<IOffer> {
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
  if (!buyerId || !mongoose.Types.ObjectId.isValid(buyerId)) {
    throw AppError.badRequest("INVALID_BUYER_ID");
  }
  if (!escrowId || !mongoose.Types.ObjectId.isValid(escrowId)) {
    throw AppError.badRequest("INVALID_ESCROW_ID");
  }
  if (!collectionId || !mongoose.Types.ObjectId.isValid(collectionId)) {
    throw AppError.badRequest("INVALID_COLLECTION_ID");
  }
  if (nftId && !mongoose.Types.ObjectId.isValid(nftId)) {
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
    grossAmountGrams,
    status,
    expiresAt: expirationDate
  };
}
