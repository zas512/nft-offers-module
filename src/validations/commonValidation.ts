import { ObjectId } from "mongodb";
import mongoose from "mongoose";
import { z } from "zod";

export const objectIdSchema = z
  .union([
    z
      .string()
      .trim()
      .refine((v) => ObjectId.isValid(v), {
        message: "Invalid identifier format (expected 24-character hexadecimal ObjectId)."
      }),
    z.instanceof(mongoose.Types.ObjectId)
  ])
  .transform((v) => (v instanceof mongoose.Types.ObjectId ? v : new mongoose.Types.ObjectId(v)));

export const idParamSchema = z.object({
  id: objectIdSchema
});
