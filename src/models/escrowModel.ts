import mongoose, { Schema, type Model } from "mongoose";
import { ESCROW_STATUSES, type IEscrowAccount } from "../types/index.js";

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
    grossAmountGrams: {
      type: Schema.Types.Mixed,
      required: true
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
