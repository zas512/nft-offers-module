import mongoose, { Schema, type Model } from "mongoose";
import type { CreateUserInput, IUser } from "../types/index.js";
import { AppError } from "../utils/appError.js";
import { createUserBodySchema } from "../validations/userValidation.js";

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
export const UserModel = User;

export function createUserDocument(input: CreateUserInput): Partial<IUser> {
  const parseResult = createUserBodySchema.safeParse(input);
  if (!parseResult.success) {
    throw AppError.badRequest(`INVALID_USER_DATA: ${parseResult.error.issues[0]?.message}`);
  }
  const { name, walletAddress, telegramId, initialBalanceGrams } = parseResult.data;
  return {
    name,
    walletAddress: walletAddress ? walletAddress.toLowerCase().trim() : null,
    telegramId: telegramId ? String(telegramId).trim() : null,
    availableBalance: initialBalanceGrams
  };
}
