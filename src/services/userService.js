import { ObjectId } from "mongodb";
import { getDb } from "../config/db.js";
import { COLLECTIONS } from "../models/index.js";
import { createAppError } from "../utils/appError.js";

export async function getAllUsers() {
  const db = getDb();
  return db.collection(COLLECTIONS.USERS).find({}).toArray();
}

export async function getAllUsersWithNfts() {
  const db = getDb();
  return db
    .collection(COLLECTIONS.USERS)
    .aggregate([
      {
        $lookup: {
          from: COLLECTIONS.NFTS,
          localField: "_id",
          foreignField: "ownerId",
          as: "nfts"
        }
      }
    ])
    .toArray();
}

export async function getUserById(id) {
  if (!id || !ObjectId.isValid(id)) {
    throw createAppError("Invalid user ID format", 400);
  }
  const db = getDb();
  const user = await db.collection(COLLECTIONS.USERS).findOne({ _id: new ObjectId(id) });
  if (!user) {
    throw createAppError("User not found", 404);
  }

  return user;
}
