/**
 * Debugg - Smart Error Handling for Developers
 *
 * A comprehensive, cross-platform error handling and monitoring library
 * that makes debugging enjoyable.
 *
 * @packageDocumentation
 */

// Export types
export * from './types';

// Export core functionality
export * from './core';

// Export reporters
export * from './reporters';

// Export storage
export * from './storage';

// Export utilities
export * from './utils';

// Export constants
export * from './constants/defaults';

// Export middleware
export * from './middleware/express';

// Export enhanced handler
export { EnhancedErrorHandler, type EnhancedErrorHandlerConfig } from './enhanced';

// Export performance monitoring
export { PerformanceMonitor, type PerformanceMetrics, type PerformanceMonitorConfig } from './performance';

// Export analytics
export { ErrorAnalytics, type ErrorMetrics, type IncidentTimeline } from './analytics';

// Export CI integration
export { CIIntegration, type CIConfig, type CIReport } from './ci';

// Convenience functions
import { ErrorHandler } from './core/ErrorHandler';
import type { ErrorHandlerConfig, UniversalError, ErrorContext, ErrorSeverity } from './types';
import { EnhancedErrorHandler } from './enhanced';

// Singleton instance for convenience
let defaultInstance: ErrorHandler | null = null;

/**
 * Get or create the default error handler
 */
export const getDefaultErrorHandler = (config?: ErrorHandlerConfig): ErrorHandler => {
  if (!defaultInstance) {
    defaultInstance = new ErrorHandler(config);
  }
  return defaultInstance;
};

/**
 * Handle an error using the default error handler
 */
export const handleError = async (
  error: unknown,
  context?: ErrorContext,
  severity?: ErrorSeverity
): Promise<void> => {
  const handler = getDefaultErrorHandler();
  await handler.handle(error, context, severity);
};

/**
 * Create a UniversalError using the default error handler
 */
export const createError = (
  error: unknown,
  context?: ErrorContext,
  severity?: ErrorSeverity
): UniversalError => {
  const handler = getDefaultErrorHandler();
  return handler.createError(error, context, severity);
};

// Enhanced singleton for advanced features
export const debugg = new EnhancedErrorHandler();
