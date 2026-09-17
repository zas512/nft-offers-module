import { ObjectId } from "mongodb";
import { createTimestamps } from "../utils/timestamps.js";

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

export function createCollectionDocument({
  name,
  creatorId,
  platformFeeBps = 0,
  royaltyFeeBps = 0
}) {
  if (!name || typeof name !== "string" || !name.trim()) {
    throw new Error("INVALID_NAME");
  }
  if (!creatorId || !ObjectId.isValid(creatorId)) {
    throw new Error("INVALID_CREATOR_ID");
  }
  if (
    typeof platformFeeBps !== "number" ||
    platformFeeBps < 0 ||
    platformFeeBps > 10000 ||
    !Number.isInteger(platformFeeBps)
  ) {
    throw new Error("INVALID_PLATFORM_FEE_BPS");
  }
  if (
    typeof royaltyFeeBps !== "number" ||
    royaltyFeeBps < 0 ||
    royaltyFeeBps > 10000 ||
    !Number.isInteger(royaltyFeeBps)
  ) {
    throw new Error("INVALID_ROYALTY_FEE_BPS");
  }
  return {
    name: name.trim(),
    creatorId: typeof creatorId === "string" ? new ObjectId(creatorId) : creatorId,
    platformFeeBps,
    royaltyFeeBps,
    ...createTimestamps()
  };
}
