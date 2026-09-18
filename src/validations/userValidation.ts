import { z } from "zod";
import { objectIdSchema } from "./commonValidation.js";

export const createUserBodySchema = z.object({
  name: z.string().trim().min(1, "Name is required").max(60, "Name must not exceed 60 characters"),
  walletAddress: z.string().trim().nullable().optional(),
  telegramId: z.string().trim().nullable().optional(),
  initialBalanceGrams: z
    .number()
    .int("Initial balance must be an integer")
    .nonnegative("Initial balance cannot be negative")
    .default(0)
});

export const userParamSchema = z.object({
  id: objectIdSchema
});
