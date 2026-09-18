import type { RequestHandler } from "express";
import { Router } from "express";
import type { ZodType } from "zod";
import { registry } from "../config/swagger.js";
import { validate } from "../middlewares/validateMiddleware.js";

export interface RouteOptions {
  summary?: string;
  description?: string;
  validate?: {
    body?: ZodType;
    params?: ZodType;
    query?: ZodType;
  };
}

export function createApiRouter(basePath: string, tag: string) {
  const router = Router();

  function route(
    method: "get" | "post" | "put" | "delete" | "patch",
    subPath: string,
    options: RouteOptions,
    handler: RequestHandler
  ) {
    const fullPath = (basePath + (subPath === "/" ? "" : subPath)).replace(/:(\w+)/g, "{$1}");

    registry.registerPath({
      method,
      path: fullPath,
      summary: options.summary || `${method.toUpperCase()} ${fullPath}`,
      description: options.description,
      tags: [tag],
      request: {
        params: options.validate?.params as any,
        query: options.validate?.query as any,
        body:
          options.validate?.body ?
            {
              content: {
                "application/json": {
                  schema: options.validate.body as any
                }
              }
            }
          : undefined
      },
      responses: {
        [method === "post" ? 201 : 200]: {
          description: method === "post" ? "Created" : "Success"
        }
      }
    });

    if (options.validate) {
      router[method](subPath, validate(options.validate), handler);
    } else {
      router[method](subPath, handler);
    }
  }

  return {
    router,
    get: (
      subPath: string,
      optionsOrHandler: RouteOptions | RequestHandler,
      handler?: RequestHandler
    ) => {
      if (typeof optionsOrHandler === "function") {
        route("get", subPath, {}, optionsOrHandler);
      } else {
        route("get", subPath, optionsOrHandler, handler!);
      }
    },
    post: (
      subPath: string,
      optionsOrHandler: RouteOptions | RequestHandler,
      handler?: RequestHandler
    ) => {
      if (typeof optionsOrHandler === "function") {
        route("post", subPath, {}, optionsOrHandler);
      } else {
        route("post", subPath, optionsOrHandler, handler!);
      }
    },
    put: (
      subPath: string,
      optionsOrHandler: RouteOptions | RequestHandler,
      handler?: RequestHandler
    ) => {
      if (typeof optionsOrHandler === "function") {
        route("put", subPath, {}, optionsOrHandler);
      } else {
        route("put", subPath, optionsOrHandler, handler!);
      }
    },
    delete: (
      subPath: string,
      optionsOrHandler: RouteOptions | RequestHandler,
      handler?: RequestHandler
    ) => {
      if (typeof optionsOrHandler === "function") {
        route("delete", subPath, {}, optionsOrHandler);
      } else {
        route("delete", subPath, optionsOrHandler, handler!);
      }
    },
    patch: (
      subPath: string,
      optionsOrHandler: RouteOptions | RequestHandler,
      handler?: RequestHandler
    ) => {
      if (typeof optionsOrHandler === "function") {
        route("patch", subPath, {}, optionsOrHandler);
      } else {
        route("patch", subPath, optionsOrHandler, handler!);
      }
    }
  };
}
