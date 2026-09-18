export class AppError extends Error {
  public readonly statusCode: number;
  public readonly status: "fail" | "error";
  public readonly isOperational: boolean;
  public readonly details: unknown;
  constructor(message: string, statusCode = 500, details: unknown = null) {
    super(message);
    this.name = this.constructor.name;
    this.statusCode = statusCode;
    this.status = String(statusCode).startsWith("4") ? "fail" : "error";
    this.isOperational = true;
    this.details = details;
    Error.captureStackTrace(this, this.constructor);
  }
  static badRequest(message: string, details: unknown = null): AppError {
    return new AppError(message, 400, details);
  }
  static forbidden(message = "Forbidden", details: unknown = null): AppError {
    return new AppError(message, 403, details);
  }
  static notFound(message = "Resource not found", details: unknown = null): AppError {
    return new AppError(message, 404, details);
  }
}
