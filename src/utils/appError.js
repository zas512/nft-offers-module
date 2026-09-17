export function createAppError(message, statusCode = 500, details = null) {
  const error = new Error(message);
  error.statusCode = statusCode;
  error.status = String(statusCode).startsWith("4") ? "fail" : "error";
  error.isOperational = true;
  error.details = details;
  Error.captureStackTrace(error, createAppError);
  return error;
}
