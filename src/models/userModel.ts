import { Long } from "mongodb";
import type { CreateUserInput, IUser } from "../types/index.js";
import { AppError } from "../utils/appError.js";
import { createTimestamps } from "../utils/timestamps.js";
import { createUserBodySchema } from "../validations/userValidation.js";

export const userSchemaValidator = {
  $jsonSchema: {
    bsonType: "object",
    required: ["name", "availableBalance", "createdAt", "updatedAt"],
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
      createdAt: { bsonType: "date" },
      updatedAt: { bsonType: "date" }
    }
  }
};

export class UserModel {
  public static createDocument(input: CreateUserInput): Omit<IUser, "_id"> {
    const parseResult = createUserBodySchema.safeParse(input);
    if (!parseResult.success) {
      throw AppError.badRequest(`INVALID_USER_DATA: ${parseResult.error.issues[0]?.message}`);
    }

    const { name, walletAddress, telegramId, initialBalanceGrams } = parseResult.data;

    return {
      name,
      walletAddress: walletAddress ? walletAddress.toLowerCase().trim() : null,
      telegramId: telegramId ? String(telegramId).trim() : null,
      availableBalance: Long.fromNumber(initialBalanceGrams),
      ...createTimestamps()
    };
  }
}

export function createUserDocument(input: CreateUserInput): Omit<IUser, "_id"> {
  return UserModel.createDocument(input);
}
