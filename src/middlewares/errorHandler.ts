import type { NextFunction, Request, Response } from "express";
import mongoose from "mongoose";
import { ZodError } from "zod";
import { AppError } from "../utils/appError.js";

export function notFoundHandler(req: Request, _res: Response, next: NextFunction): void {
  next(AppError.notFound(`Cannot ${req.method} ${req.originalUrl} - Route not found`));
}

interface MongoError extends Error {
  code?: number;
  keyValue?: Record<string, unknown>;
  errInfo?: {
    details?: unknown;
  };
}

export function errorHandler(
  err: Error | AppError | MongoError | ZodError,
  _req: Request,
  res: Response,
  _next: NextFunction
): Response {
  let statusCode = 500;
  let message = err.message || "Internal Server Error";
  let details: unknown = null;
  if (err instanceof AppError) {
    statusCode = err.statusCode;
    message = err.message;
    details = err.details;
  } else if (err instanceof ZodError) {
    statusCode = 400;
    message = "Request validation failed.";
    const issues = err.issues || [];
    details = issues.map((e) => ({
      field: e.path.map(String).join("."),
      message: e.message
    }));
  } else if (err instanceof mongoose.Error.ValidationError) {
    statusCode = 400;
    message = "Mongoose validation error.";
    details = Object.values(err.errors).map((e) => ({
      field: e.path,
      message: e.message
    }));
  } else if (err instanceof mongoose.Error.CastError) {
    statusCode = 400;
    message = `Invalid ${err.path}: ${err.value}`;
  } else {
    const mongoErr = err as MongoError;
    if (mongoErr.message?.includes("Document failed validation")) {
      statusCode = 400;
      message = "Schema validation failed.";
      details = mongoErr.errInfo?.details || null;
    }
    if (mongoErr.code === 11000) {
      statusCode = 409;
      const field = Object.keys(mongoErr.keyValue || {})[0] || "field";
      message = `Duplicate value entered for unique field: '${field}'.`;
    }
    if (mongoErr.message?.includes("input must be a 24 character hex string")) {
      statusCode = 400;
      message = "Invalid identifier format (expected 24-character hexadecimal ObjectId).";
    }
    if (typeof mongoErr.message === "string" && mongoErr.message.startsWith("INVALID_")) {
      statusCode = 400;
      message = `Validation Error: ${mongoErr.message}`;
    }
  }
  const status = String(statusCode).startsWith("4") ? "fail" : "error";
  return res.status(statusCode).json({
    success: false,
    status,
    message,
    ...(details ? { details } : {})
  });
}
