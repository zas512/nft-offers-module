import { Types } from "mongoose";
import { z } from "zod";

export const objectIdSchema = z
  .union([
    z
      .string()
      .trim()
      .refine((v) => Types.ObjectId.isValid(v), {
        message: "Invalid identifier format (expected 24-character hexadecimal ObjectId)."
      }),
    z.instanceof(Types.ObjectId)
  ])
  .transform((v) => (v instanceof Types.ObjectId ? v : new Types.ObjectId(v)));

export const idParamSchema = z.object({
  id: objectIdSchema
});
