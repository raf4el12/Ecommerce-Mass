import { Request, Response, NextFunction } from 'express';

// Define a custom error class for known API errors
export class ApiError extends Error {
  public readonly statusCode: number;

  constructor(message: string, statusCode: number = 500) {
    super(message);
    this.statusCode = statusCode;
    Object.setPrototypeOf(this, new.target.prototype);
    Error.captureStackTrace(this);
  }
}

// Global error handler middleware
export const errorHandler = (
  err: Error | ApiError,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  console.error(`[Error Handler] ${err.name}: ${err.message}`);
  
  if (err instanceof ApiError) {
    res.status(err.statusCode).json({
      status: 'error',
      message: err.message,
    });
    return;
  }

  // Fallback for unhandled errors
  res.status(500).json({
    status: 'error',
    message: err.message || 'Error interno del servidor',
  });
};
