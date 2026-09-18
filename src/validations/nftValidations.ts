import type { Types } from "mongoose";
import type { INft } from "../types/index.js";
import { AppError } from "../utils/appError.js";

export function validateNftForOffer(
  nft: INft | null,
  buyerId: Types.ObjectId | string
): asserts nft is INft {
  if (!nft) {
    throw AppError.notFound("NFT not found");
  }
  switch (nft.status) {
    case "burned":
      throw AppError.badRequest("Cannot place an offer on a burned NFT");
    case "transferred":
      throw AppError.badRequest("Cannot place an offer on a transferred NFT");
    case "active":
    case "listed":
      break;
    default:
      throw AppError.badRequest(`NFT is not available for offers (current status: ${nft.status})`);
  }
  if (nft.isLocked) {
    throw AppError.badRequest("NFT is currently locked");
  }
  if (nft.ownerId.equals(buyerId)) {
    throw AppError.badRequest("Cannot place an offer on your own NFT");
  }
}

export function validateNftForAcceptance(
  nft: INft | null,
  sellerId: Types.ObjectId | string
): asserts nft is INft {
  if (!nft) {
    throw AppError.notFound("NFT not found");
  }
  if (!nft.ownerId.equals(sellerId)) {
    throw AppError.forbidden("Only the owner of the NFT can accept this offer");
  }
  if (nft.isLocked) {
    throw AppError.badRequest("NFT is currently locked");
  }
  switch (nft.status) {
    case "burned":
      throw AppError.badRequest("Cannot accept an offer on a burned NFT");
    case "transferred":
      throw AppError.badRequest("Cannot accept an offer on a transferred NFT");
    case "active":
    case "listed":
      break;
    default:
      throw AppError.badRequest(`NFT is not available (current status: ${nft.status})`);
  }
}

export function validateNftForRejection(
  nft: INft | null,
  sellerId: Types.ObjectId | string
): asserts nft is INft {
  if (!nft) {
    throw AppError.notFound("NFT not found");
  }
  if (!nft.ownerId.equals(sellerId)) {
    throw AppError.forbidden("Only the owner of the NFT can reject this offer");
  }
}
