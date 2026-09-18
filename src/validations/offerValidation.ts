import { z } from "zod";
import { objectIdSchema } from "./commonValidation.js";

export const createOfferSchema = z.object({
  buyerId: objectIdSchema,
  nftId: objectIdSchema,
  grossAmountGrams: z
    .number({ message: "grossAmountGrams must be a number" })
    .int("grossAmountGrams must be an integer")
    .positive("grossAmountGrams must be a positive integer"),
  expiresAt: z
    .union([
      z.iso.datetime({ message: "expiresAt must be a valid ISO 8601 date string" }),
      z.date()
    ])
    .refine(
      (val) => {
        const date = val instanceof Date ? val : new Date(val);
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
