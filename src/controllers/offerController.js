import {
  acceptSingleItemOffer,
  createSingleItemOffer,
  getAllOffers,
  getOfferById
} from "../services/offerService.js";
import { createAppError } from "../utils/appError.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { logger } from "../utils/logger.js";

export const createOffer = asyncHandler(async (req, res) => {
  const { buyerId, nftId, grossAmountGrams, expiresAt } = req.body || {};
  if (!buyerId || !nftId || grossAmountGrams === undefined || !expiresAt) {
    throw createAppError(
      "Missing required fields: buyerId, nftId, grossAmountGrams, and expiresAt are required.",
      400
    );
  }
  logger.flow("INIT_SINGLE_ITEM_OFFER", "Received request to place single-item offer", {
    buyerId,
    nftId,
    grossAmountGrams,
    expiresAt
  });
  const offer = await createSingleItemOffer({
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

export const acceptOffer = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { sellerId } = req.body || {};
  if (!sellerId) {
    throw createAppError("Missing required field: sellerId is required in request body.", 400);
  }
  logger.flow("ACCEPT_SINGLE_ITEM_OFFER", `Processing acceptance for offer ${id}`, {
    offerId: id,
    sellerId
  });
  const settlement = await acceptSingleItemOffer({
    offerId: id,
    sellerId
  });
  res.status(200).json({
    success: true,
    message: "Offer accepted and settled successfully.",
    data: settlement
  });
});

export const getOffers = asyncHandler(async (req, res) => {
  logger.flow("FETCH_OFFERS", "Retrieving offers", req.query);
  const offers = await getAllOffers(req.query);
  res.status(200).json({ success: true, count: offers.length, data: offers });
});

export const getOffer = asyncHandler(async (req, res) => {
  const { id } = req.params;
  logger.flow("FETCH_OFFER_BY_ID", `Retrieving offer by ID: ${id}`);
  const offer = await getOfferById(id);
  res.status(200).json({ success: true, data: offer });
});
