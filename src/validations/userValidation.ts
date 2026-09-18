import { z } from "zod";
import { objectIdSchema } from "./commonValidation.js";

export const createUserSchema = z
  .object({
    name: z
      .string()
      .trim()
      .min(1, "Name is required")
      .max(60, "Name must not exceed 60 characters")
      .openapi({ example: "Alice Trader" }),
    walletAddress: z.string().trim().nullable().optional().openapi({ example: "0x71C...3a9" }),
    telegramId: z.string().trim().nullable().optional().openapi({ example: "@alicetrader" }),
    initialBalanceGrams: z
      .number()
      .int("Initial balance must be an integer")
      .nonnegative("Initial balance cannot be negative")
      .default(0)
      .openapi({ example: 1000000000 })
  })
  .openapi("CreateUser");

export const userParamSchema = z
  .object({
    id: objectIdSchema
  })
  .openapi("UserParam");
