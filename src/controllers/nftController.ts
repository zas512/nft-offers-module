import type { Request, Response } from "express";
import { nftService } from "../services/nftService.js";
import type { NftFilterQuery } from "../types/index.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { logger } from "../utils/logger.js";

export class NftController {
  public getNfts = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    logger.flow("FETCH_NFTS", "Retrieving NFTs", req.query);
    const nfts = await nftService.getAllNfts(req.query as NftFilterQuery);
    res.status(200).json({ success: true, count: nfts.length, data: nfts });
  });

  public getNftByIdHandler = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const id = String(req.params.id);
    logger.flow("FETCH_NFT_BY_ID", `Retrieving NFT by ID: ${id}`);
    const nft = await nftService.getNftById(id);
    res.status(200).json({ success: true, data: nft });
  });
}

export const nftController = new NftController();

export const getNfts = nftController.getNfts;
export const getNftByIdHandler = nftController.getNftByIdHandler;
