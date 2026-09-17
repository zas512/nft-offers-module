import { getAllNfts, getNftById } from "../services/nftService.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { logger } from "../utils/logger.js";

export const getNfts = asyncHandler(async (req, res) => {
  logger.flow("FETCH_NFTS", "Retrieving NFTs", req.query);
  const nfts = await getAllNfts(req.query);
  res.status(200).json({ success: true, count: nfts.length, data: nfts });
});

export const getNftByIdHandler = asyncHandler(async (req, res) => {
  const { id } = req.params;
  logger.flow("FETCH_NFT_BY_ID", `Retrieving NFT by ID: ${id}`);
  const nft = await getNftById(id);
  res.status(200).json({ success: true, data: nft });
});
