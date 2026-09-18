import type { Types } from "mongoose";
import type { INft } from "../types/index.js";
import { AppError } from "../utils/appError.js";

export function validateNftForOffer(
  nft: INft | null,
  buyerId: Types.ObjectId
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
