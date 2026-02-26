/**
 * Error formatting utilities
 */

import { UniversalError, ErrorContext } from '../types';
import { DEFAULTS } from '../constants/defaults';

/**
 * Limit context depth to prevent large objects from slowing down error handling
 * @param context - The context object to limit
 * @param maxDepth - Maximum depth to traverse
 * @param depth - Current depth (internal use)
 * @returns Limited context object
 */
export const limitContextDepth = (
  context: ErrorContext,
  maxDepth: number = DEFAULTS.MAX_CONTEXT_DEPTH,
  depth = 0
): ErrorContext => {
  if (depth >= maxDepth) {
    return { ...context, [Symbol.for('__truncated__')]: true };
  }

  const limitedContext: ErrorContext = {};

  for (const [key, value] of Object.entries(context)) {
    if (value && typeof value === 'object' && !Array.isArray(value)) {
      limitedContext[key] = limitContextDepth(value as ErrorContext, maxDepth, depth + 1);
    } else if (Array.isArray(value)) {
      limitedContext[key] = value.map((item) =>
        item && typeof item === 'object'
          ? limitContextDepth(item as ErrorContext, maxDepth, depth + 1)
          : item
      );
    } else {
      limitedContext[key] = value;
    }
  }

  return limitedContext;
};

/**
 * Format error for console logging
 * @param error - The universal error to format
 * @returns Formatted string
 */
export const formatErrorForConsole = (error: UniversalError): string => {
  const { severity, errorId, message, timestamp, metadata } = error;

  return `[${severity.toUpperCase()}] ${timestamp.toISOString()} - ${message} (ID: ${errorId})
Service: ${metadata.serviceName}
Environment: ${metadata.environment}
Platform: ${metadata.platform}`;
};

/**
 * Generate a unique error ID
 * @returns Unique error identifier
 */
export const generateErrorId = (): string => {
  const array = new Uint8Array(8);

  if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
    crypto.getRandomValues(array);
  } else {
    for (let i = 0; i < array.length; i++) {
      array[i] = Math.floor(Math.random() * 256);
    }
  }

  const hex = Array.from(array)
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');

  return `err_${hex}_${Date.now()}`;
};

/**
 * Redact sensitive fields from an object
 * @param obj - The object to redact
 * @param fields - Fields to redact
 * @returns Redacted object
 */
export const redactSensitiveFields = (
  obj: Record<string, unknown>,
  fields: readonly string[] = DEFAULTS.DEFAULT_REDACT_FIELDS
): Record<string, unknown> => {
  const redacted = { ...obj };

  for (const field of fields) {
    if (field in redacted) {
      redacted[field] = '[REDACTED]';
    }
  }

  return redacted;
};

/**
 * Serialize error to JSON-safe object
 * @param error - The error to serialize
 * @returns JSON-safe object
 */
export const serializeError = (error: UniversalError): Record<string, unknown> => ({
  errorId: error.errorId,
  name: error.name,
  message: error.message,
  severity: error.severity,
  timestamp: error.timestamp.toISOString(),
  context: error.context,
  metadata: error.metadata,
  stack: error.stack,
});
