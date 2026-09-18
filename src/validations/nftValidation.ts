import { z } from "zod";
import { NFT_STATUSES } from "../types/index.js";
import { objectIdSchema } from "./commonValidation.js";

z.object({
  collectionId: objectIdSchema,
  ownerId: objectIdSchema,
  tokenId: z.number().int().min(1, "Token ID must be a positive integer"),
  name: z
    .string()
    .trim()
    .min(1, "Name is required")
    .max(100, "Name must not exceed 100 characters"),
  status: z.enum(NFT_STATUSES).default("active"),
  isLocked: z.boolean().default(false)
});

export const nftParamSchema = z.object({
  id: objectIdSchema
});

export const nftFilterQuerySchema = z.object({
  collectionId: objectIdSchema.optional(),
  ownerId: objectIdSchema.optional(),
  status: z.enum(NFT_STATUSES).optional()
});
