import mongoose, { Schema, type Model } from "mongoose";
import { OFFER_STATUSES, OFFER_TYPES, type IOffer } from "../types/index.js";

export { OFFER_STATUSES, OFFER_TYPES };

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
      type: Schema.Types.Mixed,
      required: true
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
