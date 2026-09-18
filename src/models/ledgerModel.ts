import mongoose, { Schema, type Model } from "mongoose";
import { LEDGER_DIRECTIONS, type ILedgerEntry } from "../types/index.js";

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
