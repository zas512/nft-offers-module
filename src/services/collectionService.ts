import mongoose from "mongoose";
import { Collection } from "../models/index.js";
import type { ICollection } from "../types/index.js";
import { AppError } from "../utils/appError.js";

export class CollectionService {
  public async getAllCollections(): Promise<ICollection[]> {
    return Collection.find().lean<ICollection[]>();
  }
  public async getAllCollectionsWithNfts(): Promise<unknown[]> {
    return Collection.aggregate([
      {
        $lookup: {
          from: "nfts",
          localField: "_id",
          foreignField: "collectionId",
          as: "nfts"
        }
      }
    ]);
  }
  public async getCollectionByIdWithNfts(id: string): Promise<Record<string, unknown>> {
    if (!id || !mongoose.Types.ObjectId.isValid(id)) {
      throw AppError.badRequest("Invalid collection ID format");
    }
    const results = await Collection.aggregate([
      {
        $match: { _id: new mongoose.Types.ObjectId(id) }
      },
      {
        $lookup: {
          from: "nfts",
          localField: "_id",
          foreignField: "collectionId",
          as: "nfts"
        }
      }
    ]);
    if (!results.length) {
      throw AppError.notFound("Collection not found");
    }
    return results[0] as Record<string, unknown>;
  }
}

export const collectionService = new CollectionService();
