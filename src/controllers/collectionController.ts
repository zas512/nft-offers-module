import type { Request, Response } from "express";
import { collectionService } from "../services/index.js";
import { asyncHandler } from "../utils/asyncHandler.js";

export class CollectionController {
  public getCollections = asyncHandler(async (_req: Request, res: Response): Promise<void> => {
    const collections = await collectionService.getAllCollections();
    res.status(200).json({ success: true, count: collections.length, data: collections });
  });
  public getCollectionsWithNfts = asyncHandler(
    async (_req: Request, res: Response): Promise<void> => {
      const collections = await collectionService.getAllCollectionsWithNfts();
      res.status(200).json({ success: true, count: collections.length, data: collections });
    }
  );
  public getCollectionById = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const id = String(req.params.id);
    const collection = await collectionService.getCollectionByIdWithNfts(id);
    res.status(200).json({ success: true, data: collection });
  });
}

export const collectionController = new CollectionController();
export const getCollections = collectionController.getCollections;
export const getCollectionsWithNfts = collectionController.getCollectionsWithNfts;
export const getCollectionById = collectionController.getCollectionById;
