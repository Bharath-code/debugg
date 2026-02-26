/**
 * Core type definitions for Debugg
 */

import { SEVERITY_LEVELS, PLATFORMS } from '../constants/defaults';

export type ErrorSeverity = typeof SEVERITY_LEVELS[number];
export type Platform = typeof PLATFORMS[number];

export type ErrorContext = Record<string, unknown>;

export type ErrorReporter = (error: UniversalError) => Promise<void>;

export interface ErrorHandlerConfig {
  /** Name of the service/application */
  serviceName?: string;
  /** Environment name (development, staging, production, etc.) */
  environment?: string;
  /** Default severity level for errors */
  defaultSeverity?: ErrorSeverity;
  /** Array of error reporters */
  reporters?: ErrorReporter[];
  /** Whether to log errors to console */
  logToConsole?: boolean;
  /** Whether to include stack traces */
  includeStackTrace?: boolean;
  /** Maximum depth for context objects */
  maxContextDepth?: number;
}

export interface UniversalError extends Error {
  /** Severity level of the error */
  severity: ErrorSeverity;
  /** Additional context data */
  context: ErrorContext;
  /** Timestamp when error occurred */
  timestamp: Date;
  /** Unique error identifier */
  errorId: string;
  /** Original error if available */
  originalError?: Error;
  /** Metadata about the error environment */
  metadata: {
    platform: Platform;
    userAgent?: string;
    serviceName: string;
    environment: string;
    [key: string]: unknown;
  };
}

export interface ErrorStorage {
  storeError(error: UniversalError): void;
  getError(errorId: string): UniversalError | undefined;
  getAllErrors(): UniversalError[];
  getErrorsBySeverity(severity: ErrorSeverity): UniversalError[];
  getRecentErrors(limit?: number): UniversalError[];
  clearAllErrors(): void;
  removeError(errorId: string): boolean;
  getStatistics(): ErrorStatistics;
}

export interface ErrorStatistics {
  total: number;
  bySeverity: Record<ErrorSeverity, number>;
  recentTimestamp?: Date;
}
