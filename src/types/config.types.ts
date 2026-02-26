/**
 * Configuration-related type definitions
 */

import { ErrorSeverity } from '../types';

export interface SecurityConfig {
  /** Fields to redact from error context */
  redactFields?: string[];
  /** Maximum context size in bytes */
  maxContextSize?: number;
  /** Whether to enable rate limiting */
  enableRateLimiting?: boolean;
  /** Maximum errors per minute */
  maxErrorsPerMinute?: number;
  /** Whether to encrypt storage */
  encryptStorage?: boolean;
}

export interface PerformanceConfig {
  /** Whether performance monitoring is enabled */
  enabled?: boolean;
  /** Sample rate (0.0 to 1.0) */
  sampleRate?: number;
  /** Maximum metrics history to keep */
  maxHistory?: number;
}

export interface CIConfig {
  /** Maximum allowed critical errors */
  maxCriticalErrors?: number;
  /** Maximum allowed high severity errors */
  maxHighErrors?: number;
  /** Error rate threshold */
  errorRateThreshold?: number;
  /** Whether to compare against baseline */
  baselineComparison?: boolean;
  /** Whether to fail on regression */
  failOnRegression?: boolean;
}

export interface StorageConfig {
  /** Maximum errors to store */
  maxErrors?: number;
  /** Whether to persist errors */
  persist?: boolean;
  /** Storage key for localStorage */
  storageKey?: string;
}

export interface EnhancedErrorHandlerConfig {
  serviceName?: string;
  environment?: string;
  defaultSeverity?: ErrorSeverity;
  reporters?: unknown[];
  logToConsole?: boolean;
  includeStackTrace?: boolean;
  maxContextDepth?: number;
  performanceMonitoring?: boolean;
  analytics?: boolean;
  ciIntegration?: boolean;
  autoTrackErrors?: boolean;
  security?: SecurityConfig;
}
