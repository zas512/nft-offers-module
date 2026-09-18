import mongoose, { Schema, type Model } from "mongoose";
import { LEDGER_DIRECTIONS, type CreateLedgerInput, type ILedgerEntry } from "../types/index.js";
import { AppError } from "../utils/appError.js";

export { LEDGER_DIRECTIONS };

export const ledgerEntrySchema = new Schema<ILedgerEntry>(
  {
    referenceId: {
      type: Schema.Types.ObjectId,
      ref: "EscrowAccount",
      required: true
    },
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      default: null
    },
    account: {
      type: String,
      required: true,
      trim: true,
      minlength: 1,
      maxlength: 50
    },
    type: {
      type: String,
      required: true,
      trim: true,
      minlength: 1,
      maxlength: 50
    },
    direction: {
      type: String,
      enum: LEDGER_DIRECTIONS,
      required: true
    },
    amountGrams: {
      type: Number,
      required: true,
      min: 1
    },
    createdAt: {
      type: Date,
      default: Date.now,
      required: true
    }
  },
  {
    timestamps: false,
    versionKey: false
  }
);

ledgerEntrySchema.index({ referenceId: 1 });
ledgerEntrySchema.index({ userId: 1 });

export const LedgerEntry: Model<ILedgerEntry> =
  mongoose.models.LedgerEntry ||
  mongoose.model<ILedgerEntry>("LedgerEntry", ledgerEntrySchema, "ledger_entries");

export const LedgerModel = LedgerEntry;

function toObjectId(
  id: string | mongoose.Types.ObjectId | null | undefined
): mongoose.Types.ObjectId | null {
  if (!id) return null;
  return typeof id === "string" ? new mongoose.Types.ObjectId(id) : id;
}

export function createLedgerDocument(input: CreateLedgerInput): Partial<ILedgerEntry> {
  const { referenceId, userId = null, account, type, direction, amountGrams } = input;
  if (!referenceId || !mongoose.Types.ObjectId.isValid(referenceId)) {
    throw AppError.badRequest("INVALID_REFERENCE_ID");
  }
  if (userId && !mongoose.Types.ObjectId.isValid(userId)) {
    throw AppError.badRequest("INVALID_USER_ID");
  }
  if (!account || typeof account !== "string" || !account.trim()) {
    throw AppError.badRequest("INVALID_ACCOUNT");
  }
  if (!type || typeof type !== "string" || !type.trim()) {
    throw AppError.badRequest("INVALID_TYPE");
  }
  if (!LEDGER_DIRECTIONS.includes(direction)) {
    throw AppError.badRequest("INVALID_DIRECTION");
  }
  if (typeof amountGrams !== "number" || amountGrams <= 0 || !Number.isSafeInteger(amountGrams)) {
    throw AppError.badRequest("INVALID_AMOUNT");
  }

  return {
    referenceId: toObjectId(referenceId)!,
    userId: toObjectId(userId),
    account: account.trim(),
    type: type.trim(),
    direction,
    amountGrams,
    createdAt: new Date()
  };
}
