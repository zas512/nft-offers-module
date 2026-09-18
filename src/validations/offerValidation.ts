import { z } from "zod";
import { OFFER_STATUSES } from "../types/index.js";
import { objectIdSchema } from "./commonValidation.js";

export const createOfferSchema = z.object({
  buyerId: objectIdSchema,
  nftId: objectIdSchema,
  grossAmountGrams: z
    .union([
      z.number().int().positive("grossAmountGrams must be a positive integer"),
      z.string().regex(/^[1-9]\d*$/, "grossAmountGrams must be a positive integer string"),
      z.bigint().positive("grossAmountGrams must be a positive integer")
    ])
    .transform((val) => val.toString()),
  expiresAt: z
    .union([
      z.iso.datetime({ message: "expiresAt must be a valid ISO 8601 date string" }),
      z.date()
    ])
    .transform((val) => (val instanceof Date ? val : new Date(val)))
    .refine(
      (date) => {
        const time = date.getTime();
        if (Number.isNaN(time)) return false;
        const now = Date.now();
        const oneHourLater = now + 60 * 60 * 1000;
        const thirtyDaysLater = now + 30 * 24 * 60 * 60 * 1000;
        return time >= oneHourLater && time <= thirtyDaysLater;
      },
      { message: "expiresAt must be at least 1 hour and at most 30 days in the future" }
    )
});

export const acceptOfferBodySchema = z.object({
  sellerId: objectIdSchema,
  nftId: objectIdSchema.optional()
});

export const rejectOfferBodySchema = z.object({
  sellerId: objectIdSchema,
  nftId: objectIdSchema.optional()
});

export const offerFilterQuerySchema = z.object({
  buyerId: objectIdSchema.optional(),
  collectionId: objectIdSchema.optional(),
  nftId: objectIdSchema.optional(),
  status: z.enum(OFFER_STATUSES).optional()
});
