import mongoose, { Schema, type Model } from "mongoose";
import type { CreateCollectionInput, ICollection } from "../types/index.js";
import { AppError } from "../utils/appError.js";
import { createCollectionBodySchema } from "../validations/collectionValidation.js";

export const collectionSchema = new Schema<ICollection>(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      minlength: 1,
      maxlength: 100
    },
    creatorId: {
      type: Schema.Types.ObjectId,
      ref: "User",
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
    }
  },
  {
    timestamps: true,
    versionKey: false
  }
);

export const Collection: Model<ICollection> =
  mongoose.models.Collection ||
  mongoose.model<ICollection>("Collection", collectionSchema, "collections");
export const CollectionModel = Collection;
export function createCollectionDocument(input: CreateCollectionInput): Partial<ICollection> {
  const creatorIdStr =
    typeof input.creatorId === "string" ? input.creatorId : input.creatorId?.toString();
  const parseResult = createCollectionBodySchema.safeParse({
    ...input,
    creatorId: creatorIdStr
  });
  if (!parseResult.success) {
    throw AppError.badRequest(`INVALID_COLLECTION_DATA: ${parseResult.error.issues[0]?.message}`);
  }
  const { name, creatorId, platformFeeBps, royaltyFeeBps } = parseResult.data;
  return {
    name,
    creatorId: new mongoose.Types.ObjectId(creatorId),
    platformFeeBps,
    royaltyFeeBps
  };
}
