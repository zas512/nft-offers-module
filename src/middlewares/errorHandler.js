import { createAppError } from "../utils/appError.js";

export function notFoundHandler(req, res, next) {
  next(createAppError(`Cannot ${req.method} ${req.originalUrl} - Route not found`, 404));
}

export function errorHandler(err, _, res, _next) {
  let error = { ...err };
  error.message = err.message || "Internal Server Error";
  error.statusCode = err.statusCode || 500;
  if (err?.message?.includes("Document failed validation")) {
    error.statusCode = 400;
    error.message = "Schema validation failed.";
    error.details = err.errInfo?.details || null;
  }
  if (err.code === 11000) {
    error.statusCode = 409;
    const field = Object.keys(err.keyValue || {})[0] || "field";
    error.message = `Duplicate value entered for unique field: '${field}'.`;
  }
  if (err?.message?.includes("input must be a 24 character hex string")) {
    error.statusCode = 400;
    error.message = "Invalid identifier format (expected 24-character hexadecimal ObjectId).";
  }
  if (typeof err.message === "string" && err.message.startsWith("INVALID_")) {
    error.statusCode = 400;
    error.message = `Validation Error: ${err.message}`;
  }
  return res.status(error.statusCode).json({
    success: false,
    status: `${error.statusCode}`.startsWith("4") ? "fail" : "error",
    message: error.message,
    ...(error.details ? { details: error.details } : {})
  });
}
