/**
 * Error classification utility
 * Automatically determines error severity based on error type and characteristics
 */

import { ErrorSeverity } from '../types';

/**
 * Classify an error and determine its severity level
 * @param error - The error to classify
 * @returns ErrorSeverity level
 */
export const classifyError = (error: unknown): ErrorSeverity => {
  // Native JavaScript error types
  if (error instanceof TypeError) return 'high';
  if (error instanceof ReferenceError) return 'high';
  if (error instanceof SyntaxError) return 'critical';
  if (error instanceof RangeError) return 'medium';

  // Check for error-like objects
  if (error && typeof error === 'object') {
    const err = error as Record<string, unknown>;

    // Network-related errors
    if (typeof err.message === 'string' && err.message.includes('NetworkError')) return 'high';
    if (typeof err.code === 'string' && err.code === 'ECONNREFUSED') return 'high';
    if (typeof err.code === 'string' && err.code === 'ETIMEDOUT') return 'high';

    // HTTP status codes
    if (typeof err.status === 'number') {
      if (err.status >= 500) return 'critical';
      if (err.status >= 400 && err.status < 500) return 'medium';
    }

    // Database and storage errors
    if (typeof err.code === 'string') {
      if (err.code.includes('SQLITE_')) return 'high';
      if (err.code.includes('ECONNRESET')) return 'high';
    }

    // Security-related errors
    if (typeof err.message === 'string') {
      const message = err.message.toLowerCase();
      if (message.includes('authentication')) return 'high';
      if (message.includes('authorization')) return 'high';
      if (message.includes('permission')) return 'high';
    }
  }

  // Default severity for unknown errors
  return 'medium';
};

/**
 * Get detailed error classification information
 * @param error - The error to analyze
 * @returns Object with classification details
 */
export const getErrorClassification = (error: unknown) => {
  const severity = classifyError(error);
  const name = error && typeof error === 'object' && 'name' in error ? String(error.name) : 'Error';

  return {
    severity,
    type: name,
    isCritical: severity === 'critical',
    isHighPriority: ['critical', 'high'].includes(severity),
    description: getErrorDescription(severity),
  };
};

/**
 * Get human-readable description for error classification
 * @param severity - The severity level
 * @returns Human-readable description
 */
const getErrorDescription = (severity: ErrorSeverity): string => {
  const descriptions: Record<ErrorSeverity, string> = {
    critical: 'Critical error that requires immediate attention',
    high: 'High severity error that should be addressed promptly',
    medium: 'Medium severity error that needs investigation',
    low: 'Low severity error that can be addressed later',
    info: 'Informational message or non-critical issue',
  };

  return descriptions[severity] || descriptions.medium;
};
