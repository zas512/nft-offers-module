import mongoose, { Schema, type Model } from "mongoose";
import type { ICollection } from "../types/index.js";

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

