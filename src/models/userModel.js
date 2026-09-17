import { createTimestamps } from "../utils/timestamps.js";

export const userSchemaValidator = {
  $jsonSchema: {
    bsonType: "object",
    required: ["name", "availableBalance", "escrowBalance", "createdAt", "updatedAt"],
    properties: {
      name: {
        bsonType: "string",
        minLength: 1,
        maxLength: 60
      },
      walletAddress: {
        bsonType: ["string", "null"]
      },
      telegramId: {
        bsonType: ["string", "null"]
      },
      availableBalance: {
        bsonType: "long",
        minimum: 0
      },
      escrowBalance: {
        bsonType: "long",
        minimum: 0
      },
      createdAt: { bsonType: "date" },
      updatedAt: { bsonType: "date" }
    }
  }
};

export function createUserDocument({
  name,
  walletAddress = null,
  telegramId = null,
  initialBalanceGrams = 0
}) {
  if (!name || typeof name !== "string" || !name.trim()) {
    throw new Error("INVALID_NAME");
  }
  if (
    typeof initialBalanceGrams !== "number" ||
    initialBalanceGrams < 0 ||
    !Number.isSafeInteger(initialBalanceGrams)
  ) {
    throw new Error("INVALID_INITIAL_BALANCE");
  }
  return {
    name: name.trim(),
    walletAddress: walletAddress ? walletAddress.toLowerCase().trim() : null,
    telegramId: telegramId ? String(telegramId).trim() : null,
    availableBalance: initialBalanceGrams,
    escrowBalance: 0,
    ...createTimestamps()
  };
}
