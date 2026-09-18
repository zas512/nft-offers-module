import { extendZodWithOpenApi } from "@asteasolutions/zod-to-openapi";
import { ObjectId } from "mongodb";
import { z } from "zod";

extendZodWithOpenApi(z);

export const objectIdSchema = z
  .string()
  .trim()
  .refine((val) => ObjectId.isValid(val), {
    error: "Invalid identifier format (expected 24-character hexadecimal ObjectId)."
  })
  .openapi({
    type: "string",
    description: "24-character hexadecimal MongoDB ObjectId",
    example: "65f1a2b3c4d5e6f7a8b9c0d1"
  });

export const idParamSchema = z
  .object({
    id: objectIdSchema
  })
  .openapi("IdParam");
