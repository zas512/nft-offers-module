import { z } from "zod";
import { NFT_STATUSES } from "../types/index.js";
import { objectIdSchema } from "./commonValidation.js";

export const createNftSchema = z
  .object({
    collectionId: objectIdSchema,
    ownerId: objectIdSchema,
    tokenId: z
      .number()
      .int()
      .min(1, "Token ID must be a positive integer")
      .openapi({ example: 101 }),
    name: z
      .string()
      .trim()
      .min(1, "Name is required")
      .max(100, "Name must not exceed 100 characters")
      .openapi({ example: "Cyber Punk #101" }),
    status: z.enum(NFT_STATUSES).default("active").openapi({ example: "active" }),
    isLocked: z.boolean().default(false).openapi({ example: false })
  })
  .openapi("CreateNft");

export const nftParamSchema = z
  .object({
    id: objectIdSchema
  })
  .openapi("NftParam");

export const nftFilterQuerySchema = z
  .object({
    collectionId: objectIdSchema.optional().openapi({
      param: {
        name: "collectionId",
        in: "query",
        description: "Filter by Collection ObjectId"
      }
    }),
    ownerId: objectIdSchema.optional().openapi({
      param: {
        name: "ownerId",
        in: "query",
        description: "Filter by Owner User ObjectId"
      }
    }),
    status: z
      .enum(NFT_STATUSES)
      .optional()
      .openapi({
        param: {
          name: "status",
          in: "query",
          description: "Filter by NFT status"
        }
      })
  })
  .openapi("NftFilterQuery");
