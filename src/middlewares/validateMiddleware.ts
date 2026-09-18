import type { NextFunction, Request, Response } from "express";
import type { ZodType } from "zod";

export interface ValidationSchemas {
  body?: ZodType;
  query?: ZodType;
  params?: ZodType;
}

export function validate(schemas: ValidationSchemas) {
  return async (req: Request, _res: Response, next: NextFunction): Promise<void> => {
    try {
      if (schemas.params) {
        const parsedParams = await schemas.params.parseAsync(req.params);
        Object.defineProperty(req, "params", {
          value: parsedParams,
          writable: true,
          configurable: true,
          enumerable: true
        });
      }
      if (schemas.query) {
        const parsedQuery = await schemas.query.parseAsync(req.query);
        Object.defineProperty(req, "query", {
          value: parsedQuery,
          writable: true,
          configurable: true,
          enumerable: true
        });
      }
      if (schemas.body) {
        req.body = await schemas.body.parseAsync(req.body);
      }
      next();
    } catch (error) {
      next(error);
    }
  };
}
