/**
 * Reporter-related type definitions
 */

import { UniversalError, ErrorReporter } from '../types';

export interface BaseReporterOptions {
  /** Whether to log failures to console */
  logFailures?: boolean;
}

export interface ConsoleReporterOptions extends BaseReporterOptions {
  /** Whether to use grouped console output */
  useGroups?: boolean;
  /** Custom formatter for error output */
  formatter?: (error: UniversalError) => string;
}

export interface SentryReporterOptions extends BaseReporterOptions {
  /** Whether to include error context as extra data */
  includeContext?: boolean;
  /** Whether to include stack trace */
  includeStackTrace?: boolean;
  /** Custom tags to add to all errors */
  tags?: Record<string, string>;
  /** Log to console if Sentry is not installed */
  logWarning?: boolean;
}

export interface WebhookReporterOptions extends BaseReporterOptions {
  /** Custom headers to include with the request */
  headers?: Record<string, string>;
  /** Number of retry attempts */
  retries?: number;
  /** Timeout in milliseconds */
  timeout?: number;
  /** Whether to log failures to console */
  logFailures?: boolean;
}

export interface ReporterFactory<TOptions = unknown> {
  (options?: TOptions): ErrorReporter;
}
