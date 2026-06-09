import { Request, Response, NextFunction } from 'express';
import { AppError } from '@core/errors/AppError';

// Backward-compatible alias. Existing code throws `ApiError`; new modules throw
// `AppError`. Both share the same `statusCode` contract and are handled below.
export class ApiError extends AppError {}

// Global error handler middleware
export const errorHandler = (
  err: Error | AppError,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  console.error(`[Error Handler] ${err.name}: ${err.message}`);

  if (err instanceof AppError) {
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
