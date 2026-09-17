import { ObjectId } from "mongodb";
import { getDb } from "../config/db.js";
import { COLLECTIONS } from "../models/index.js";
import { createAppError } from "../utils/appError.js";

export async function getAllCollections() {
  const db = getDb();
  return db.collection(COLLECTIONS.COLLECTIONS).find({}).toArray();
}

export async function getAllCollectionsWithNfts() {
  const db = getDb();
  return db
    .collection(COLLECTIONS.COLLECTIONS)
    .aggregate([
      {
        $lookup: {
          from: COLLECTIONS.NFTS,
          localField: "_id",
          foreignField: "collectionId",
          as: "nfts"
        }
      }
    ])
    .toArray();
}

export async function getCollectionByIdWithNfts(id) {
  if (!id || !ObjectId.isValid(id)) {
    throw createAppError("Invalid collection ID format", 400);
  }
  const db = getDb();
  const results = await db
    .collection(COLLECTIONS.COLLECTIONS)
    .aggregate([
      {
        $match: { _id: new ObjectId(id) }
      },
      {
        $lookup: {
          from: COLLECTIONS.NFTS,
          localField: "_id",
          foreignField: "collectionId",
          as: "nfts"
        }
      }
    ])
    .toArray();
  if (!results.length) {
    throw createAppError("Collection not found", 404);
  }
  return results[0];
}
