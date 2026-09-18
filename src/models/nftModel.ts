import mongoose, { Schema, type Model } from "mongoose";
import { NFT_STATUSES, type CreateNftInput, type INft } from "../types/index.js";
import { AppError } from "../utils/appError.js";
import { createNftBodySchema } from "../validations/nftValidation.js";

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
export const NftModel = Nft;

export function createNftDocument(input: CreateNftInput): Partial<INft> {
  const collectionIdStr =
    typeof input.collectionId === "string" ? input.collectionId : input.collectionId?.toString();
  const ownerIdStr = typeof input.ownerId === "string" ? input.ownerId : input.ownerId?.toString();
  const parseResult = createNftBodySchema.safeParse({
    ...input,
    collectionId: collectionIdStr,
    ownerId: ownerIdStr
  });
  if (!parseResult.success) {
    throw AppError.badRequest(`INVALID_NFT_DATA: ${parseResult.error.issues[0]?.message}`);
  }
  const {
    collectionId,
    ownerId,
    tokenId,
    name,
    status = "active",
    isLocked = false
  } = parseResult.data;
  return {
    collectionId: new mongoose.Types.ObjectId(collectionId),
    ownerId: new mongoose.Types.ObjectId(ownerId),
    tokenId,
    name,
    status,
    isLocked
  };
}
