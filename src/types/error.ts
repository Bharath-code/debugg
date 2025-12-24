/**
 * Type definitions for Universal Error Handler
 */

export type ErrorSeverity = 'critical' | 'high' | 'medium' | 'low' | 'info';
export type ErrorContext = Record<string, any>;
export type ErrorReporter = (error: UniversalError) => Promise<void>;

export interface ErrorHandlerConfig {
  serviceName?: string;
  environment?: 'development' | 'staging' | 'production' | string;
  defaultSeverity?: ErrorSeverity;
  reporters?: ErrorReporter[];
  logToConsole?: boolean;
  includeStackTrace?: boolean;
  maxContextDepth?: number;
}

export interface UniversalError extends Error {
  severity: ErrorSeverity;
  context: ErrorContext;
  timestamp: Date;
  errorId: string;
  originalError?: Error;
  metadata: {
    platform: 'browser' | 'node' | 'mobile' | 'unknown';
    userAgent?: string;
    [key: string]: any;
  };
}