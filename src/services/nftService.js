import { ObjectId } from "mongodb";
import { getDb } from "../config/db.js";
import { COLLECTIONS } from "../models/index.js";
import { createAppError } from "../utils/appError.js";

export async function getAllNfts(filter = {}) {
  const query = {};
  if (filter.collectionId && ObjectId.isValid(filter.collectionId)) {
    query.collectionId = new ObjectId(filter.collectionId);
  }
  if (filter.ownerId && ObjectId.isValid(filter.ownerId)) {
    query.ownerId = new ObjectId(filter.ownerId);
  }
  if (filter.status) {
    query.status = filter.status;
  }
  const db = getDb();
  return db.collection(COLLECTIONS.NFTS).find(query).toArray();
}

export async function getNftById(id) {
  if (!id || !ObjectId.isValid(id)) {
    throw createAppError("Invalid NFT ID format", 400);
  }
  const db = getDb();
  const nft = await db.collection(COLLECTIONS.NFTS).findOne({ _id: new ObjectId(id) });
  if (!nft) {
    throw createAppError("NFT not found", 404);
  }
  return nft;
}
