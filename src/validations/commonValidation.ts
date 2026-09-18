import { ObjectId } from "mongodb";
import { z } from "zod";

export const objectIdSchema = z
  .string()
  .trim()
  .refine((val) => ObjectId.isValid(val), {
    message: "Invalid identifier format (expected 24-character hexadecimal ObjectId)."
  });

export const idParamSchema = z.object({
  id: objectIdSchema
});
