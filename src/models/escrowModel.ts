import mongoose, { Schema, type Model } from "mongoose";
import { ESCROW_STATUSES, type CreateEscrowInput, type IEscrowAccount } from "../types/index.js";
import { AppError } from "../utils/appError.js";

export { ESCROW_STATUSES };

export const escrowAccountSchema = new Schema<IEscrowAccount>(
  {
    offerId: {
      type: Schema.Types.ObjectId,
      ref: "Offer",
      required: true
    },
    buyerId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true
    },
    sellerId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      default: null
    },
    creatorId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      default: null
    },
    grossAmountGrams: {
      type: Number,
      required: true,
      min: 1
    },
    platformFeeBps: {
      type: Number,
      required: true,
      min: 0,
      max: 10000,
      default: 0
    },
    royaltyFeeBps: {
      type: Number,
      required: true,
      min: 0,
      max: 10000,
      default: 0
    },
    status: {
      type: String,
      enum: ESCROW_STATUSES,
      default: "held",
      required: true
    },
    settledAt: {
      type: Date,
      default: null
    }
  },
  {
    timestamps: true,
    versionKey: false
  }
);

escrowAccountSchema.index({ offerId: 1 });
escrowAccountSchema.index({ buyerId: 1 });

export const EscrowAccount: Model<IEscrowAccount> =
  mongoose.models.EscrowAccount ||
  mongoose.model<IEscrowAccount>("EscrowAccount", escrowAccountSchema, "escrow_accounts");
export const EscrowModel = EscrowAccount;

function toObjectId(
  id: string | mongoose.Types.ObjectId | null | undefined
): mongoose.Types.ObjectId | null {
  if (!id) return null;
  return typeof id === "string" ? new mongoose.Types.ObjectId(id) : id;
}

export function createEscrowDocument(input: CreateEscrowInput): Partial<IEscrowAccount> {
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
  if (!offerId || !mongoose.Types.ObjectId.isValid(offerId)) {
    throw AppError.badRequest("INVALID_OFFER_ID");
  }
  if (!buyerId || !mongoose.Types.ObjectId.isValid(buyerId)) {
    throw AppError.badRequest("INVALID_BUYER_ID");
  }
  if (sellerId && !mongoose.Types.ObjectId.isValid(sellerId)) {
    throw AppError.badRequest("INVALID_SELLER_ID");
  }
  if (creatorId && !mongoose.Types.ObjectId.isValid(creatorId)) {
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
  let settledDate: Date | null = null;
  if (settledAt) {
    settledDate = settledAt instanceof Date ? settledAt : new Date(settledAt);
  }
  return {
    offerId: toObjectId(offerId)!,
    buyerId: toObjectId(buyerId)!,
    sellerId: toObjectId(sellerId),
    creatorId: toObjectId(creatorId),
    grossAmountGrams,
    platformFeeBps,
    royaltyFeeBps,
    status,
    settledAt: settledDate
  };
}
