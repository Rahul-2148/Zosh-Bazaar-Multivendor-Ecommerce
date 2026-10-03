/**
 * Centralized error handling middleware for Express.
 * Catches all errors thrown in routes/controllers and returns standardized responses.
 */

class AppError extends Error {
  constructor(message, statusCode = 500) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = true;
    Error.captureStackTrace(this, this.constructor);
  }
}

const errorHandler = (err, req, res, _next) => {
  // Default values
  let statusCode = err.statusCode || 500;
  let message = err.message || "Internal Server Error";

  // Mongoose validation error
  if (err.name === "ValidationError") {
    statusCode = 400;
    const errors = Object.values(err.errors).map((e) => e.message);
    message = errors.join(", ");
  }

  // Mongoose cast error (invalid ObjectId)
  if (err.name === "CastError") {
    statusCode = 400;
    message = `Invalid ${err.path}: ${err.value}`;
  }

  // Mongoose duplicate key error
  if (err.code === 11000) {
    statusCode = 409;
    const field = Object.keys(err.keyValue).join(", ");
    message = `Duplicate value for field: ${field}`;
  }

  // JWT errors
  if (err.name === "JsonWebTokenError") {
    statusCode = 401;
    message = "Invalid authentication token";
  }

  if (err.name === "TokenExpiredError") {
    statusCode = 401;
    message = "Authentication token has expired";
  }

  // Multer & Media upload errors
  if (err.name === "MulterError") {
    statusCode = 400;
    if (err.code === "LIMIT_FILE_SIZE") {
      message = "File size exceeds the 25MB marketplace limit.";
    } else if (err.code === "LIMIT_FILE_COUNT") {
      message = "Too many files uploaded at once (maximum 12).";
    } else if (err.code === "LIMIT_UNEXPECTED_FILE") {
      message = `Unexpected upload field: ${err.field || "unknown"}`;
    } else {
      message = `Upload error: ${err.message}`;
    }
  }

  if (err.message && err.message.includes("Unsupported file format")) {
    statusCode = 400;
  }

  // Log error in development
  if (process.env.NODE_ENV !== "production") {
    console.error(`[ERROR] ${statusCode} - ${message}`);
    if (statusCode === 500) {
      console.error(err.stack);
    }
  }

  res.status(statusCode).json({
    message,
    error: true,
    success: false,
    ...(process.env.NODE_ENV !== "production" && { stack: err.stack }),
  });
};

// Async handler wrapper to avoid try-catch in every controller
const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

export { AppError, errorHandler, asyncHandler };
