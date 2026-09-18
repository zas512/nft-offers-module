import type { Request, Response } from "express";
import { offerService } from "../services/index.js";
import type { OfferFilterQuery } from "../types/index.js";
import { asyncHandler } from "../utils/asyncHandler.js";

export class OfferController {
  public createOffer = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const offer = await offerService.createSingleItemOffer(req.body);
    res.status(201).json({
      success: true,
      message: "Single-item offer placed successfully with locked escrow.",
      data: offer
    });
  });

  public acceptOffer = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const settlement = await offerService.acceptSingleItemOffer({
      offerId: String(req.params.id),
      sellerId: String(req.body.sellerId),
      nftId: req.body.nftId ? String(req.body.nftId) : undefined
    });
    res.status(200).json({
      success: true,
      message: "Offer accepted and settled successfully.",
      data: settlement
    });
  });

  public rejectOffer = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const rejection = await offerService.rejectSingleItemOffer({
      offerId: String(req.params.id),
      sellerId: String(req.body.sellerId),
      nftId: req.body.nftId ? String(req.body.nftId) : undefined
    });
    res.status(200).json({
      success: true,
      message: "Offer rejected and escrow refunded successfully.",
      data: rejection
    });
  });

  public getOffers = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const offers = await offerService.getAllOffers(req.query as OfferFilterQuery);
    res.status(200).json({ success: true, count: offers.length, data: offers });
  });

  public getOffer = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const offer = await offerService.getOfferById(String(req.params.id));
    res.status(200).json({ success: true, data: offer });
  });
}

export const offerController = new OfferController();
export const createOffer = offerController.createOffer;
export const acceptOffer = offerController.acceptOffer;
export const rejectOffer = offerController.rejectOffer;
export const getOffers = offerController.getOffers;
export const getOffer = offerController.getOffer;
