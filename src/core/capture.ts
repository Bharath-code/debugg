/**
 * Core error capture and processing logic
 */

import { UniversalError, ErrorContext, ErrorSeverity } from '../types/error';
import { classifyError } from '../utils/classify';

// Generate unique error IDs
const generateErrorId = (): string => {
  return 'err_' + Math.random().toString(36).substr(2, 9) + '_' + Date.now();
};

// Detect the current platform
const detectPlatform = (): 'browser' | 'node' | 'mobile' | 'unknown' => {
  if (typeof window !== 'undefined' && typeof window.document !== 'undefined') {
    return 'browser';
  }
  if (typeof process !== 'undefined' && process.versions && process.versions.node) {
    return 'node';
  }
  if (typeof navigator !== 'undefined' && /Mobile|Android|iPhone|iPad|iPod/i.test(navigator.userAgent)) {
    return 'mobile';
  }
  return 'unknown';
};

/**
 * Create a universal error object from any input
 */
export const createUniversalError = (
  error: any,
  context: ErrorContext = {},
  config: {
    serviceName: string;
    environment: string;
    includeStackTrace: boolean;
    maxContextDepth: number;
  },
  severity?: ErrorSeverity
): UniversalError => {
  const timestamp = new Date();
  const errorId = generateErrorId();
  const detectedSeverity = severity || classifyError(error);
  const platform = detectPlatform();

  // Create the universal error object
  const universalError: UniversalError = {
    name: error.name || 'Error',
    message: error.message || String(error),
    stack: config.includeStackTrace ? error.stack : undefined,
    severity: detectedSeverity,
    context: limitContextDepth(context, config.maxContextDepth),
    timestamp,
    errorId,
    metadata: {
      platform,
      serviceName: config.serviceName,
      environment: config.environment,
    },
  };

  // Add original error if available
  if (error instanceof Error) {
    universalError.originalError = error;
  }

  // Add user agent for browser environments
  if (platform === 'browser' && typeof navigator !== 'undefined') {
    universalError.metadata.userAgent = navigator.userAgent;
  }

  return universalError;
};

/**
 * Limit context depth to prevent large objects from slowing down error handling
 */
export const limitContextDepth = (context: ErrorContext, maxDepth: number, depth = 0): ErrorContext => {
  if (depth >= maxDepth) {
    return { ...context, [Symbol.for('__truncated__')]: true };
  }

  const limitedContext: ErrorContext = {};

  for (const [key, value] of Object.entries(context)) {
    if (value && typeof value === 'object' && !Array.isArray(value)) {
      limitedContext[key] = limitContextDepth(value as ErrorContext, maxDepth, depth + 1);
    } else if (Array.isArray(value)) {
      limitedContext[key] = value.map(item =>
        item && typeof item === 'object' ? limitContextDepth(item as ErrorContext, maxDepth, depth + 1) : item
      );
    } else {
      limitedContext[key] = value;
    }
  }

  return limitedContext;
};

/**
 * Format error for console logging
 */
export const formatErrorForConsole = (error: UniversalError): string => {
  const { severity, errorId, message, timestamp, metadata } = error;

  return `[${severity.toUpperCase()}] ${timestamp.toISOString()} - ${message} (ID: ${errorId})
Service: ${metadata.serviceName}
Environment: ${metadata.environment}
Platform: ${metadata.platform}`;
};