import { z } from "zod";
import { LEDGER_ACCOUNTS, LEDGER_DIRECTIONS, LEDGER_TYPES } from "../types/index.js";
import { objectIdSchema } from "./commonValidation.js";

export const ledgerFilterQuerySchema = z.object({
  referenceId: objectIdSchema.optional(),
  userId: objectIdSchema.optional(),
  account: z.enum(LEDGER_ACCOUNTS).optional(),
  type: z.enum(LEDGER_TYPES).optional(),
  direction: z.enum(LEDGER_DIRECTIONS).optional()
});
