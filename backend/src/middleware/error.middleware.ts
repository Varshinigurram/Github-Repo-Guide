import { Request, Response, NextFunction } from 'express';
import { GitHubServiceError } from '../services/github.service.js';

/**
 * Centralized error handling middleware.
 * Catches uncaught backend errors and returns a structured JSON error response without exposing internal stack traces or secrets.
 */
export const errorHandler = (
  err: Error,
  req: Request,
  res: Response,
  _next: NextFunction
): void => {
  if (err instanceof GitHubServiceError) {
    res.status(err.statusCode).json({
      success: false,
      error: {
        code: err.code,
        message: err.message
      }
    });
    return;
  }

  console.error('[Error]', err.message);

  res.status(500).json({
    success: false,
    error: {
      code: 'INTERNAL_SERVER_ERROR',
      message: 'An internal server error occurred.'
    }
  });
};

/**
 * Middleware for handling requests to routes that do not exist (404 Not Found).
 */
export const notFoundHandler = (req: Request, res: Response): void => {
  res.status(404).json({
    success: false,
    error: {
      code: 'NOT_FOUND',
      message: `Cannot ${req.method} ${req.originalUrl} on this server`
    }
  });
};
