import type { Request, Response } from "express";
import { offerService } from "../services/index.js";
import type { OfferFilterQuery } from "../types/index.js";
import { AppError } from "../utils/appError.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { logger } from "../utils/logger.js";

export class OfferController {
  public createOffer = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { buyerId, nftId, grossAmountGrams, expiresAt } = req.body || {};
    if (!buyerId || !nftId || grossAmountGrams === undefined || !expiresAt) {
      throw AppError.badRequest(
        "Missing required fields: buyerId, nftId, grossAmountGrams, and expiresAt are required."
      );
    }
    logger.flow("INIT_SINGLE_ITEM_OFFER", "Received request to place single-item offer", {
      buyerId,
      nftId,
      grossAmountGrams,
      expiresAt
    });
    const offer = await offerService.createSingleItemOffer({
      buyerId,
      nftId,
      grossAmountGrams: Number(grossAmountGrams),
      expiresAt
    });
    res.status(201).json({
      success: true,
      message: "Single-item offer placed successfully with locked escrow.",
      data: offer
    });
  });
  public acceptOffer = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const id = String(req.params.id);
    const { sellerId } = req.body || {};
    if (!sellerId) {
      throw AppError.badRequest("Missing required field: sellerId is required in request body.");
    }
    logger.flow("ACCEPT_SINGLE_ITEM_OFFER", `Processing acceptance for offer ${id}`, {
      offerId: id,
      sellerId
    });
    const settlement = await offerService.acceptSingleItemOffer({
      offerId: id,
      sellerId
    });
    res.status(200).json({
      success: true,
      message: "Offer accepted and settled successfully.",
      data: settlement
    });
  });
  public getOffers = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    logger.flow("FETCH_OFFERS", "Retrieving offers", req.query);
    const offers = await offerService.getAllOffers(req.query as OfferFilterQuery);
    res.status(200).json({ success: true, count: offers.length, data: offers });
  });
  public getOffer = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const id = String(req.params.id);
    logger.flow("FETCH_OFFER_BY_ID", `Retrieving offer by ID: ${id}`);
    const offer = await offerService.getOfferById(id);
    res.status(200).json({ success: true, data: offer });
  });
}

export const offerController = new OfferController();
export const createOffer = offerController.createOffer;
export const acceptOffer = offerController.acceptOffer;
export const getOffers = offerController.getOffers;
export const getOffer = offerController.getOffer;
