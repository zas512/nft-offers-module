import { z } from "zod";
import { ESCROW_STATUSES } from "../types/index.js";
import { objectIdSchema } from "./commonValidation.js";

export const escrowFilterQuerySchema = z.object({
  offerId: objectIdSchema.optional(),
  buyerId: objectIdSchema.optional(),
  sellerId: objectIdSchema.optional(),
  status: z.enum(ESCROW_STATUSES).optional()
});
