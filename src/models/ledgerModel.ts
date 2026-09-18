import { Long, ObjectId } from "mongodb";
import { type CreateLedgerInput, type ILedgerEntry, LEDGER_DIRECTIONS } from "../types/index.js";
import { AppError } from "../utils/appError.js";
import { getCurrentTimestamp } from "../utils/timestamps.js";

export { LEDGER_DIRECTIONS };

export const ledgerSchemaValidator = {
  $jsonSchema: {
    bsonType: "object",
    required: ["referenceId", "account", "type", "direction", "amountGrams", "createdAt"],
    properties: {
      referenceId: {
        bsonType: "objectId"
      },
      userId: {
        bsonType: ["objectId", "null"]
      },
      account: {
        bsonType: "string",
        minLength: 1,
        maxLength: 50
      },
      type: {
        bsonType: "string",
        minLength: 1,
        maxLength: 50
      },
      direction: {
        bsonType: "string",
        enum: ["credit", "debit"]
      },
      amountGrams: {
        bsonType: "long",
        minimum: 0
      },
      createdAt: { bsonType: "date" }
    }
  }
};

function toObjectId(id: string | ObjectId | null | undefined): ObjectId | null {
  if (!id) return null;
  return typeof id === "string" ? new ObjectId(id) : id;
}

export class LedgerModel {
  public static createDocument(input: CreateLedgerInput): Omit<ILedgerEntry, "_id"> {
    const { referenceId, userId = null, account, type, direction, amountGrams } = input;

    if (!referenceId || !ObjectId.isValid(referenceId)) {
      throw AppError.badRequest("INVALID_REFERENCE_ID");
    }
    if (userId && !ObjectId.isValid(userId)) {
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
      referenceId: typeof referenceId === "string" ? new ObjectId(referenceId) : referenceId,
      userId: toObjectId(userId),
      account: account.trim(),
      type: type.trim(),
      direction,
      amountGrams: Long.fromNumber(amountGrams),
      createdAt: getCurrentTimestamp()
    };
  }
}

export function createLedgerDocument(input: CreateLedgerInput): Omit<ILedgerEntry, "_id"> {
  return LedgerModel.createDocument(input);
}
