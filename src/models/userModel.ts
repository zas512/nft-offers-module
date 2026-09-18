import mongoose, { Schema, type Model } from "mongoose";
import type { IUser } from "../types/index.js";

export const userSchema = new Schema<IUser>(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      minlength: 1,
      maxlength: 60
    },
    walletAddress: {
      type: String,
      default: null,
      trim: true,
      lowercase: true,
      sparse: true
    },
    telegramId: {
      type: String,
      default: null,
      trim: true,
      sparse: true
    },
    availableBalance: {
      type: Number,
      required: true,
      default: 0,
      min: [0, "availableBalance cannot be negative"]
    }
  },
  {
    timestamps: true,
    versionKey: false
  }
);

export const User: Model<IUser> =
  mongoose.models.User || mongoose.model<IUser>("User", userSchema, "users");
