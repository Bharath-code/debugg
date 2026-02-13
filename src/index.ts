/**
 * Universal Error Handler - A comprehensive error handling and monitoring library
 *
 * Features:
 * - Cross-platform error handling (browser, Node.js, mobile)
 * - Automatic error classification and severity levels
 * - Built-in error reporting to multiple services
 * - Type-safe error handling
 * - Extensible architecture
 * - Modular design with core components
 */

// Export types from types module
export * from './types/error';

// Export utilities
export * from './utils/classify';

// Export core functionality
export * from './core/capture';
export { ErrorHandler } from './core/ErrorHandler';

// Export storage system
export * from './storage/index';

// Export enhanced modules
export * from './performance/index';
export * from './analytics/index';
export * from './ci/index';
export * from './enhanced/index';

// Import types and utilities for reporters and convenience functions
import { UniversalError, ErrorSeverity, ErrorContext, ErrorReporter, ErrorHandlerConfig } from './types/error';
import { ErrorHandler } from './core/ErrorHandler';

// Built-in reporters
export const createConsoleReporter = (): ErrorReporter => {
  return async (error: UniversalError) => {
    console.error('[UniversalErrorHandler]', error);
  };
};

export interface SentryReporterOptions {
  /** Whether to include error context as extra data */
  includeContext?: boolean;
  /** Whether to include stack trace */
  includeStackTrace?: boolean;
  /** Custom tags to add to all errors */
  tags?: Record<string, string>;
  /** Log to console if Sentry is not installed (default: true) */
  logWarning?: boolean;
}

export const createSentryReporter = (dsn: string, options: SentryReporterOptions = {}): ErrorReporter => {
  const {
    includeContext = true,
    includeStackTrace = true,
    tags = {},
    logWarning = true
  } = options;

  let sentryInitialized = false;
  let Sentry: any = null;

  return async (error: UniversalError) => {
    // Try to dynamically import Sentry if not already done
    if (!sentryInitialized) {
      try {
        Sentry = await import('@sentry/node');
        Sentry.init({ dsn });
        sentryInitialized = true;
      } catch (importError) {
        // Sentry not installed - log warning once and continue
        if (logWarning) {
          console.warn(
            `[Sentry Reporter] @sentry/node is not installed. ` +
            `Install it with: bun add @sentry/node`
          );
          console.log(`[Sentry Reporter] Would send error ${error.errorId} to Sentry with DSN: ${dsn}`);
        }
        return;
      }
    }

    if (!Sentry) return;

    // Capture the exception with Sentry
    Sentry.withScope((scope: any) => {
      // Set severity level
      const sentryLevel = error.severity === 'critical' ? 'fatal' :
        error.severity === 'high' ? 'error' :
          error.severity === 'medium' ? 'warning' :
            error.severity === 'low' ? 'info' : 'debug';
      scope.setLevel(sentryLevel);

      // Add error metadata as tags
      scope.setTag('errorId', error.errorId);
      scope.setTag('severity', error.severity);
      scope.setTag('platform', error.metadata.platform);
      scope.setTag('serviceName', error.metadata.serviceName);
      scope.setTag('environment', error.metadata.environment);

      // Add custom tags
      Object.entries(tags).forEach(([key, value]) => {
        scope.setTag(key, value);
      });

      // Add context as extra data
      if (includeContext && Object.keys(error.context).length > 0) {
        scope.setExtras(error.context);
      }

      // Capture the error
      if (error.originalError instanceof Error) {
        Sentry!.captureException(error.originalError);
      } else {
        Sentry!.captureMessage(error.message, sentryLevel);
      }
    });
  };
};

export interface WebhookReporterOptions {
  /** Custom headers to include with the request */
  headers?: Record<string, string>;
  /** Number of retry attempts (default: 3) */
  retries?: number;
  /** Timeout in milliseconds (default: 5000) */
  timeout?: number;
  /** Whether to log failures to console (default: true) */
  logFailures?: boolean;
}

export const createWebhookReporter = (
  webhookUrl: string,
  options: WebhookReporterOptions = {}
): ErrorReporter => {
  // Validate webhook URL
  if (!webhookUrl || typeof webhookUrl !== 'string') {
    throw new Error('Webhook URL is required and must be a string');
  }

  try {
    const url = new URL(webhookUrl);
    if (!['http:', 'https:'].includes(url.protocol)) {
      throw new Error('Webhook URL must use http or https protocol');
    }
  } catch {
    throw new Error('Invalid webhook URL format');
  }

  const {
    headers = {},
    retries = 3,
    timeout = 5000,
    logFailures = true
  } = options;

  // Validate options
  if (retries < 0 || retries > 10) {
    throw new Error('Retries must be between 0 and 10');
  }
  if (timeout < 100 || timeout > 60000) {
    throw new Error('Timeout must be between 100ms and 60000ms');
  }

  return async (error: UniversalError) => {
    // Serialize the error, handling circular references
    const payload = JSON.stringify({
      errorId: error.errorId,
      name: error.name,
      message: error.message,
      severity: error.severity,
      timestamp: error.timestamp,
      context: error.context,
      metadata: error.metadata,
      stack: error.stack
    });

    let lastError: Error | null = null;

    for (let attempt = 1; attempt <= retries; attempt++) {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), timeout);

        const response = await fetch(webhookUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-Error-Id': error.errorId,
            'X-Error-Severity': error.severity,
            ...headers
          },
          body: payload,
          signal: controller.signal
        });

        clearTimeout(timeoutId);

        if (!response.ok) {
          throw new Error(`Webhook returned ${response.status}: ${response.statusText}`);
        }

        // Success - exit the retry loop
        return;
      } catch (fetchError) {
        lastError = fetchError as Error;

        // Don't retry on abort (timeout)
        if ((fetchError as Error).name === 'AbortError') {
          if (logFailures) {
            console.error(`[Webhook Reporter] Request timed out after ${timeout}ms for error ${error.errorId}`);
          }
          break;
        }

        // Wait before retrying (exponential backoff)
        if (attempt < retries) {
          await new Promise(resolve => setTimeout(resolve, Math.pow(2, attempt) * 100));
        }
      }
    }

    // All retries failed
    if (logFailures && lastError) {
      console.error(`[Webhook Reporter] Failed to send error ${error.errorId} to ${webhookUrl}:`, lastError.message);
    }
  };
};

// Import EnhancedErrorHandler for the debugg singleton
import { EnhancedErrorHandler } from './enhanced/index';

// Enhanced singleton instance for investor metrics and reports
export const debugg = new EnhancedErrorHandler();

// Singleton instance for convenience
let defaultInstance: ErrorHandler | null = null;

export const getDefaultErrorHandler = (config?: ErrorHandlerConfig): ErrorHandler => {
  if (!defaultInstance) {
    defaultInstance = new ErrorHandler(config);
  }
  return defaultInstance;
};

// Convenience functions
export const handleError = async (error: any, context?: ErrorContext, severity?: ErrorSeverity): Promise<void> => {
  const handler = getDefaultErrorHandler();
  await handler.handle(error, context, severity);
};

export const createError = (error: any, context?: ErrorContext, severity?: ErrorSeverity): UniversalError => {
  const handler = getDefaultErrorHandler();
  return handler.createError(error, context, severity);
};