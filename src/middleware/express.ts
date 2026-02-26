/**
 * Express middleware for Debugg
 * Provides automatic error handling for Express applications
 */

import type { Request, Response, NextFunction } from 'express';
import { ErrorHandler } from '../core/ErrorHandler';
import { ErrorContext } from '../types';

export interface ExpressMiddlewareOptions {
  /** Whether to log errors to console */
  logErrors?: boolean;
  /** Whether to include request details in context */
  includeRequestDetails?: boolean;
  /** Custom context builder */
  buildContext?: (req: Request, error: Error) => ErrorContext;
  /** Whether to send error response to client */
  sendErrorResponse?: boolean;
  /** Custom error response builder */
  buildErrorResponse?: (error: Error) => Record<string, unknown>;
}

/**
 * Create Express error handling middleware
 */
export const createExpressErrorHandler = (
  errorHandler: ErrorHandler,
  options: ExpressMiddlewareOptions = {}
) => {
  const {
    logErrors = true,
    includeRequestDetails = true,
    buildContext,
    sendErrorResponse = true,
    buildErrorResponse,
  } = options;

  return (error: Error, req: Request, res: Response, _next: NextFunction) => {
    // Build context
    const context: ErrorContext = buildContext
      ? buildContext(req, error)
      : includeRequestDetails
        ? {
            endpoint: req.path,
            method: req.method,
            headers: req.headers,
            query: req.query,
            body: req.body,
            userAgent: req.get('user-agent'),
            ip: req.ip,
          }
        : {};

    // Handle the error
    if (logErrors) {
      errorHandler.handle(error, context).catch(console.error);
    } else {
      errorHandler.createError(error, context);
    }

    // Send error response if enabled
    if (sendErrorResponse) {
      const errorResponse = buildErrorResponse
        ? buildErrorResponse(error)
        : {
            error: error.name,
            message: process.env.NODE_ENV === 'production' ? 'Internal server error' : error.message,
          };

      res.status(500).json(errorResponse);
    }
  };
};

/**
 * Async handler wrapper for Express routes
 * Automatically catches and handles errors from async route handlers
 */
export const asyncHandler =
  (handler: (req: Request, res: Response, next: NextFunction) => Promise<void>) =>
  (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(handler(req, res, next)).catch(next);
  };
