import {
  getAllCollections,
  getAllCollectionsWithNfts,
  getCollectionByIdWithNfts
} from "../services/collectionService.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { logger } from "../utils/logger.js";

export const getCollections = asyncHandler(async (_req, res) => {
  logger.flow("FETCH_COLLECTIONS", "Retrieving all NFT collections");
  const collections = await getAllCollections();
  res.status(200).json({ success: true, count: collections.length, data: collections });
});

export const getCollectionsWithNfts = asyncHandler(async (_req, res) => {
  logger.flow("FETCH_COLLECTIONS_WITH_NFTS", "Retrieving all collections with nested NFTs");
  const collections = await getAllCollectionsWithNfts();
  res.status(200).json({ success: true, count: collections.length, data: collections });
});

export const getCollectionById = asyncHandler(async (req, res) => {
  const { id } = req.params;
  logger.flow("FETCH_COLLECTION_BY_ID", `Retrieving collection with NFTs for ID: ${id}`);
  const collection = await getCollectionByIdWithNfts(id);
  res.status(200).json({ success: true, data: collection });
});
