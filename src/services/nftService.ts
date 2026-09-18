import mongoose from "mongoose";
import { Nft } from "../models/nftModel.js";
import type { INft, NftFilterQuery } from "../types/index.js";
import { AppError } from "../utils/appError.js";

export class NftService {
  public async getAllNfts(filter: NftFilterQuery = {}): Promise<INft[]> {
    const query: Record<string, unknown> = {};
    if (filter.collectionId && mongoose.Types.ObjectId.isValid(filter.collectionId)) {
      query.collectionId = new mongoose.Types.ObjectId(filter.collectionId);
    }
    if (filter.ownerId && mongoose.Types.ObjectId.isValid(filter.ownerId)) {
      query.ownerId = new mongoose.Types.ObjectId(filter.ownerId);
    }
    if (filter.status) {
      query.status = filter.status;
    }
    return Nft.find(query).lean<INft[]>();
  }
  public async getNftById(id: string): Promise<INft> {
    if (!id || !mongoose.Types.ObjectId.isValid(id)) {
      throw AppError.badRequest("Invalid NFT ID format");
    }
    const nft = await Nft.findById(id).lean<INft | null>();
    if (!nft) {
      throw AppError.notFound("NFT not found");
    }
    return nft;
  }
}

export const nftService = new NftService();
