import mongoose, { Schema, type Model } from "mongoose";
import { NFT_STATUSES, type INft } from "../types/index.js";

export { NFT_STATUSES };

export const nftSchema = new Schema<INft>(
  {
    collectionId: {
      type: Schema.Types.ObjectId,
      ref: "Collection",
      required: true
    },
    ownerId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true
    },
    tokenId: {
      type: Number,
      required: true,
      min: 1
    },
    name: {
      type: String,
      required: true,
      trim: true,
      minlength: 1,
      maxlength: 100
    },
    status: {
      type: String,
      enum: NFT_STATUSES,
      default: "active",
      required: true
    },
    isLocked: {
      type: Boolean,
      default: false,
      required: true
    }
  },
  {
    timestamps: true,
    versionKey: false
  }
);

nftSchema.index({ collectionId: 1, tokenId: 1 }, { unique: true });
nftSchema.index({ ownerId: 1 });

export const Nft: Model<INft> =
  mongoose.models.Nft || mongoose.model<INft>("Nft", nftSchema, "nfts");
