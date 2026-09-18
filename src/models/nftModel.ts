import { Int32, ObjectId } from "mongodb";
import { type CreateNftInput, type INft, NFT_STATUSES } from "../types/index.js";
import { AppError } from "../utils/appError.js";
import { createTimestamps } from "../utils/timestamps.js";
import { createNftBodySchema } from "../validations/nftValidation.js";

export { NFT_STATUSES };

export const nftSchemaValidator = {
  $jsonSchema: {
    bsonType: "object",
    required: [
      "collectionId",
      "ownerId",
      "tokenId",
      "name",
      "status",
      "isLocked",
      "createdAt",
      "updatedAt"
    ],
    properties: {
      collectionId: {
        bsonType: "objectId"
      },
      ownerId: {
        bsonType: "objectId"
      },
      tokenId: {
        bsonType: "int",
        minimum: 1
      },
      name: {
        bsonType: "string",
        minLength: 1,
        maxLength: 100
      },
      status: {
        bsonType: "string",
        enum: ["active", "listed", "burned", "transferred"]
      },
      isLocked: {
        bsonType: "bool"
      },
      createdAt: { bsonType: "date" },
      updatedAt: { bsonType: "date" }
    }
  }
};

export class NftModel {
  public static createDocument(input: CreateNftInput): Omit<INft, "_id"> {
    const collectionIdStr = typeof input.collectionId === "string" ? input.collectionId : input.collectionId?.toString();
    const ownerIdStr = typeof input.ownerId === "string" ? input.ownerId : input.ownerId?.toString();

    const parseResult = createNftBodySchema.safeParse({
      ...input,
      collectionId: collectionIdStr,
      ownerId: ownerIdStr
    });

    if (!parseResult.success) {
      throw AppError.badRequest(`INVALID_NFT_DATA: ${parseResult.error.issues[0]?.message}`);
    }

    const { collectionId, ownerId, tokenId, name, status, isLocked } = parseResult.data;

    return {
      collectionId: new ObjectId(collectionId),
      ownerId: new ObjectId(ownerId),
      tokenId: new Int32(tokenId),
      name,
      status,
      isLocked,
      ...createTimestamps()
    };
  }
}

export function createNftDocument(input: CreateNftInput): Omit<INft, "_id"> {
  return NftModel.createDocument(input);
}
