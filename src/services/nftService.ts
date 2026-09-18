import { type Filter, ObjectId } from "mongodb";
import { getDb } from "../config/db.js";
import { COLLECTIONS } from "../models/index.js";
import type { INft, NftFilterQuery } from "../types/index.js";
import { AppError } from "../utils/appError.js";

export class NftService {
  public async getAllNfts(filter: NftFilterQuery = {}): Promise<INft[]> {
    const query: Filter<INft> = {};
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
    return db.collection<INft>(COLLECTIONS.NFTS).find(query).toArray();
  }

  public async getNftById(id: string): Promise<INft> {
    if (!id || !ObjectId.isValid(id)) {
      throw AppError.badRequest("Invalid NFT ID format");
    }
    const db = getDb();
    const nft = await db.collection<INft>(COLLECTIONS.NFTS).findOne({ _id: new ObjectId(id) });
    if (!nft) {
      throw AppError.notFound("NFT not found");
    }
    return nft;
  }
}

export const nftService = new NftService();

export const getAllNfts = (filter?: NftFilterQuery) => nftService.getAllNfts(filter);
export const getNftById = (id: string) => nftService.getNftById(id);
