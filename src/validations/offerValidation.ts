import { z } from "zod";
import { OFFER_STATUSES } from "../types/index.js";
import { objectIdSchema } from "./commonValidation.js";

export const createSingleItemOfferBodySchema = z.object({
  buyerId: objectIdSchema,
  nftId: objectIdSchema,
  grossAmountGrams: z
    .number({ error: "grossAmountGrams must be a number" })
    .int("grossAmountGrams must be an integer")
    .positive("grossAmountGrams must be a positive integer"),
  expiresAt: z
    .union([z.iso.datetime({ error: "expiresAt must be a valid ISO 8601 date string" }), z.date()])
    .refine(
      (val) => {
        const date = val instanceof Date ? val : new Date(val);
        return !Number.isNaN(date.getTime()) && date.getTime() > Date.now();
      },
      { error: "expiresAt must be a future date and time" }
    )
});

export const acceptOfferBodySchema = z.object({
  sellerId: objectIdSchema
});

export const offerFilterQuerySchema = z.object({
  buyerId: objectIdSchema.optional(),
  collectionId: objectIdSchema.optional(),
  nftId: objectIdSchema.optional(),
  status: z.enum(OFFER_STATUSES).optional()
});
