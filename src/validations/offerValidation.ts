import { z } from "zod";
import { OFFER_STATUSES } from "../types/index.js";
import { objectIdSchema } from "./commonValidation.js";

export const createSingleItemOfferBodySchema = z
  .object({
    buyerId: objectIdSchema.openapi({
      description: "Buyer user ObjectId",
      example: "65f1a2b3c4d5e6f7a8b9c0d1"
    }),
    nftId: objectIdSchema.openapi({
      description: "Target NFT ObjectId",
      example: "65f1a2b3c4d5e6f7a8b9c0d2"
    }),
    grossAmountGrams: z
      .number({ error: "grossAmountGrams must be a number" })
      .int("grossAmountGrams must be an integer")
      .positive("grossAmountGrams must be a positive integer")
      .openapi({
        description: "Offer amount in Grams (integer)",
        example: 500000000
      }),
    expiresAt: z
      .union([
        z.iso.datetime({ error: "expiresAt must be a valid ISO 8601 date string" }),
        z.date()
      ])
      .refine(
        (val) => {
          const date = val instanceof Date ? val : new Date(val);
          return !Number.isNaN(date.getTime()) && date.getTime() > Date.now();
        },
        { error: "expiresAt must be a future date and time" }
      )
      .openapi({
        type: "string",
        format: "date-time",
        description: "ISO 8601 future expiration date-time string",
        example: "2026-12-31T23:59:59.000Z"
      })
  })
  .openapi("CreateSingleItemOfferBody");

export const acceptOfferBodySchema = z
  .object({
    sellerId: objectIdSchema.openapi({
      description: "Seller user ObjectId accepting the offer",
      example: "65f1a2b3c4d5e6f7a8b9c0d3"
    })
  })
  .openapi("AcceptOfferBody");

export const offerFilterQuerySchema = z
  .object({
    buyerId: objectIdSchema.optional().openapi({
      param: {
        name: "buyerId",
        in: "query",
        description: "Filter by Buyer User ObjectId"
      }
    }),
    collectionId: objectIdSchema.optional().openapi({
      param: {
        name: "collectionId",
        in: "query",
        description: "Filter by Collection ObjectId"
      }
    }),
    nftId: objectIdSchema.optional().openapi({
      param: {
        name: "nftId",
        in: "query",
        description: "Filter by NFT ObjectId"
      }
    }),
    status: z
      .enum(OFFER_STATUSES)
      .optional()
      .openapi({
        param: {
          name: "status",
          in: "query",
          description: "Filter by Offer status"
        }
      })
  })
  .openapi("OfferFilterQuery");
