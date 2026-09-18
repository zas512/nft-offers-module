import { Int32, ObjectId } from "mongodb";
import type { CreateCollectionInput, ICollection } from "../types/index.js";
import { AppError } from "../utils/appError.js";
import { createTimestamps } from "../utils/timestamps.js";
import { createCollectionBodySchema } from "../validations/collectionValidation.js";

export const collectionSchemaValidator = {
  $jsonSchema: {
    bsonType: "object",
    required: ["name", "creatorId", "platformFeeBps", "royaltyFeeBps", "createdAt", "updatedAt"],
    properties: {
      name: {
        bsonType: "string",
        minLength: 1,
        maxLength: 100
      },
      creatorId: {
        bsonType: "objectId"
      },
      platformFeeBps: {
        bsonType: "int",
        minimum: 0,
        maximum: 10000
      },
      royaltyFeeBps: {
        bsonType: "int",
        minimum: 0,
        maximum: 10000
      },
      createdAt: { bsonType: "date" },
      updatedAt: { bsonType: "date" }
    }
  }
};

export class CollectionModel {
  public static createDocument(input: CreateCollectionInput): Omit<ICollection, "_id"> {
    const creatorIdStr = typeof input.creatorId === "string" ? input.creatorId : input.creatorId?.toString();
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
      creatorId: new ObjectId(creatorId),
      platformFeeBps: new Int32(platformFeeBps),
      royaltyFeeBps: new Int32(royaltyFeeBps),
      ...createTimestamps()
    };
  }
}

export function createCollectionDocument(input: CreateCollectionInput): Omit<ICollection, "_id"> {
  return CollectionModel.createDocument(input);
}
