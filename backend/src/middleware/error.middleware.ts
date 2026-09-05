import { Request, Response, NextFunction } from 'express';

/**
 * Centralized error handling middleware.
 * Catches uncaught backend errors and returns a structured JSON error response.
 */
export const errorHandler = (
  err: Error,
  req: Request,
  res: Response,
  _next: NextFunction
): void => {
  console.error('[Error]', err.stack || err.message);

  res.status(500).json({
    status: 'error',
    message: err.message || 'Internal Server Error'
  });
};

/**
 * Middleware for handling requests to routes that do not exist (404 Not Found).
 */
export const notFoundHandler = (req: Request, res: Response): void => {
  res.status(404).json({
    status: 'fail',
    message: `Cannot ${req.method} ${req.originalUrl} on this server`
  });
};
