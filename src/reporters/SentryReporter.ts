/**
 * SentryReporter - Reports errors to Sentry
 */

import { UniversalError, ErrorReporter } from '../types';
import { SentryReporterOptions } from '../types/reporter.types';

/**
 * Factory function to create Sentry reporter
 * Returns a function that can be called with an error
 */
export const createSentryReporter = (dsn: string, options: SentryReporterOptions = {}): ErrorReporter => {
  if (!dsn || typeof dsn !== 'string') {
    throw new Error('Sentry DSN is required and must be a string');
  }

  const reporterOptions = {
    includeContext: options.includeContext ?? true,
    includeStackTrace: options.includeStackTrace ?? true,
    tags: options.tags ?? {},
    logWarning: options.logWarning ?? true,
    logFailures: options.logFailures ?? true,
  };

  let sentryInitialized = false;
  let Sentry: unknown = null;

  const report = async (error: UniversalError): Promise<void> => {
    // Try to dynamically import Sentry if not already initialized
    if (!sentryInitialized) {
      try {
        // Try Node.js first
        try {
          Sentry = await import('@sentry/node');
        } catch {
          // Sentry browser not available
          if (reporterOptions.logWarning) {
            console.warn(`[Sentry Reporter] @sentry/node is not installed.`);
          }
          return;
        }

        const sentry = Sentry as { init: (options: { dsn: string }) => void };
        sentry.init({ dsn });
        sentryInitialized = true;
      } catch (importError) {
        if (reporterOptions.logWarning) {
          console.warn(`[Sentry Reporter] Failed to initialize Sentry`);
          console.log(`[Sentry Reporter] Would send error ${error.errorId} to Sentry with DSN: ${dsn}`);
        }
        return;
      }
    }

    if (!Sentry) return;

    const sentry = Sentry as Record<string, unknown>;

    // Capture the exception with Sentry
    const withScope = sentry['withScope'] as ((callback: (scope: unknown) => void) => void) | undefined;

    if (!withScope) return;

    withScope((scope: unknown) => {
      const typedScope = scope as Record<string, unknown>;

      // Set severity level
      const sentryLevel = getSentryLevel(error.severity);
      const setLevel = typedScope['setLevel'] as ((level: string) => void) | undefined;
      if (setLevel) setLevel(sentryLevel);

      // Add error metadata as tags
      const setTag = typedScope['setTag'] as ((key: string, value: string) => void) | undefined;
      if (setTag) {
        setTag('errorId', error.errorId);
        setTag('severity', error.severity);
        setTag('platform', String(error.metadata.platform));
        setTag('serviceName', String(error.metadata.serviceName));
        setTag('environment', String(error.metadata.environment));

        // Add custom tags
        Object.entries(reporterOptions.tags).forEach(([key, value]) => {
          setTag(key, value);
        });
      }

      // Add context as extra data
      if (reporterOptions.includeContext && Object.keys(error.context).length > 0) {
        const setExtras = typedScope['setExtras'] as ((extras: Record<string, unknown>) => void) | undefined;
        if (setExtras) setExtras(error.context);
      }

      // Capture the error
      const captureException = sentry['captureException'] as ((error: Error) => void) | undefined;
      const captureMessage = sentry['captureMessage'] as ((message: string, level: string) => void) | undefined;

      if (error.originalError instanceof Error && captureException) {
        captureException(error.originalError);
      } else if (captureMessage) {
        captureMessage(error.message, sentryLevel);
      }
    });
  };

  // Return a function that calls the reporter
  const reporterFn: ErrorReporter = async (error: UniversalError) => {
    report(error).catch((err) => {
      if (reporterOptions.logFailures) {
        console.error(`[Sentry Reporter] Failed to report error ${error.errorId}:`, err);
      }
    });
  };

  return reporterFn;
};

/**
 * Convert Debugg severity to Sentry level
 */
function getSentryLevel(severity: string): string {
  switch (severity) {
    case 'critical':
      return 'fatal';
    case 'high':
      return 'error';
    case 'medium':
      return 'warning';
    case 'low':
      return 'info';
    case 'info':
      return 'debug';
    default:
      return 'error';
  }
}
