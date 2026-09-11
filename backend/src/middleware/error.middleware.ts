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
  // Handle payload too large (413) error from express.json
  if (err.name === 'PayloadTooLargeError' || (err as any).type === 'entity.too.large' || (err as any).status === 413) {
    res.status(413).json({
      success: false,
      error: {
        code: 'PAYLOAD_TOO_LARGE',
        message: 'Request payload exceeds maximum allowed limit of 100KB.'
      }
    });
    return;
  }

  // Handle invalid JSON body syntax (400)
  if (err instanceof SyntaxError && 'status' in err && (err as any).status === 400 && 'body' in err) {
    res.status(400).json({
      success: false,
      error: {
        code: 'INVALID_REQUEST_BODY',
        message: 'Invalid JSON syntax in request body.'
      }
    });
    return;
  }

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
