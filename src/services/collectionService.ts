import { type Document, ObjectId } from "mongodb";
import { getDb } from "../config/db.js";
import { COLLECTIONS } from "../models/index.js";
import type { ICollection } from "../types/index.js";
import { AppError } from "../utils/appError.js";

export class CollectionService {
  public async getAllCollections(): Promise<ICollection[]> {
    const db = getDb();
    return db.collection<ICollection>(COLLECTIONS.COLLECTIONS).find({}).toArray();
  }

  public async getAllCollectionsWithNfts(): Promise<Document[]> {
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

  public async getCollectionByIdWithNfts(id: string): Promise<Document> {
    if (!id || !ObjectId.isValid(id)) {
      throw AppError.badRequest("Invalid collection ID format");
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
      throw AppError.notFound("Collection not found");
    }
    return results[0]!;
  }
}

export const collectionService = new CollectionService();

export const getAllCollections = () => collectionService.getAllCollections();
export const getAllCollectionsWithNfts = () => collectionService.getAllCollectionsWithNfts();
export const getCollectionByIdWithNfts = (id: string) => collectionService.getCollectionByIdWithNfts(id);
