import { Int32, ObjectId } from "mongodb";
import { createTimestamps } from "../utils/timestamps.js";

export const NFT_STATUSES = Object.freeze(["active", "listed", "burned", "transferred"]);

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

export function createNftDocument({
  collectionId,
  ownerId,
  tokenId,
  name,
  status = "active",
  isLocked = false
}) {
  if (!collectionId || !ObjectId.isValid(collectionId)) {
    throw new Error("INVALID_COLLECTION_ID");
  }
  if (!ownerId || !ObjectId.isValid(ownerId)) {
    throw new Error("INVALID_OWNER_ID");
  }
  if (typeof tokenId !== "number" || tokenId < 1 || !Number.isSafeInteger(tokenId)) {
    throw new Error("INVALID_TOKEN_ID");
  }
  if (!name || typeof name !== "string" || !name.trim()) {
    throw new Error("INVALID_NAME");
  }
  if (!NFT_STATUSES.includes(status)) {
    throw new Error("INVALID_STATUS");
  }
  if (typeof isLocked !== "boolean") {
    throw new TypeError("INVALID_IS_LOCKED");
  }
  return {
    collectionId: typeof collectionId === "string" ? new ObjectId(collectionId) : collectionId,
    ownerId: typeof ownerId === "string" ? new ObjectId(ownerId) : ownerId,
    tokenId: new Int32(tokenId),
    name: name.trim(),
    status,
    isLocked,
    ...createTimestamps()
  };
}
