import { z } from "zod";
import { objectIdSchema } from "./commonValidation.js";

export const createCollectionSchema = z
  .object({
    name: z
      .string()
      .trim()
      .min(1, "Name is required")
      .max(100, "Name must not exceed 100 characters")
      .openapi({ example: "Genesis Cyber Punks" }),
    creatorId: objectIdSchema,
    platformFeeBps: z
      .number()
      .int("Platform fee must be an integer")
      .min(0, "Platform fee cannot be negative")
      .max(10000, "Platform fee cannot exceed 10000 bps (100%)")
      .default(0)
      .openapi({ example: 250, description: "Platform fee in basis points (100 bps = 1%)" }),
    royaltyFeeBps: z
      .number()
      .int("Royalty fee must be an integer")
      .min(0, "Royalty fee cannot be negative")
      .max(10000, "Royalty fee cannot exceed 10000 bps (100%)")
      .default(0)
      .openapi({ example: 500, description: "Royalty fee in basis points (100 bps = 1%)" })
  })
  .openapi("CreateCollection");

export const collectionParamSchema = z
  .object({
    id: objectIdSchema
  })
  .openapi("CollectionParam");
