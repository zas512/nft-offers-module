import { ObjectId } from "mongodb";
import { getCurrentTimestamp } from "../utils/timestamps.js";

export const LEDGER_DIRECTIONS = Object.freeze(["credit", "debit"]);

export const ledgerSchemaValidator = {
  $jsonSchema: {
    bsonType: "object",
    required: ["referenceId", "userId", "account", "type", "direction", "amountGrams", "createdAt"],
    properties: {
      referenceId: {
        bsonType: "objectId"
      },
      userId: {
        bsonType: "objectId"
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

export function createLedgerDocument({
  referenceId,
  userId,
  account,
  type,
  direction,
  amountGrams
}) {
  if (!referenceId || !ObjectId.isValid(referenceId)) {
    throw new Error("INVALID_REFERENCE_ID");
  }
  if (!userId || !ObjectId.isValid(userId)) {
    throw new Error("INVALID_USER_ID");
  }
  if (!account || typeof account !== "string" || !account.trim()) {
    throw new Error("INVALID_ACCOUNT");
  }
  if (!type || typeof type !== "string" || !type.trim()) {
    throw new Error("INVALID_TYPE");
  }
  if (!LEDGER_DIRECTIONS.includes(direction)) {
    throw new Error("INVALID_DIRECTION");
  }
  if (typeof amountGrams !== "number" || amountGrams <= 0 || !Number.isSafeInteger(amountGrams)) {
    throw new Error("INVALID_AMOUNT");
  }
  return {
    referenceId: typeof referenceId === "string" ? new ObjectId(referenceId) : referenceId,
    userId: typeof userId === "string" ? new ObjectId(userId) : userId,
    account: account.trim(),
    type: type.trim(),
    direction,
    amountGrams,
    createdAt: getCurrentTimestamp()
  };
}
