/**
 * Error classification utility
 * Automatically determines error severity based on error type and characteristics
 */

import { ErrorSeverity } from '../types/error';

/**
 * Classify an error and determine its severity level
 * @param error - The error to classify
 * @returns ErrorSeverity level
 */
export const classifyError = (error: any): ErrorSeverity => {
  // Native JavaScript error types
  if (error instanceof TypeError) return 'high';
  if (error instanceof ReferenceError) return 'high';
  if (error instanceof SyntaxError) return 'critical';
  if (error instanceof RangeError) return 'medium';

  // Network-related errors
  if (error && error.message && error.message.includes('NetworkError')) return 'high';
  if (error && error.code && error.code === 'ECONNREFUSED') return 'high';
  if (error && error.code && error.code === 'ETIMEDOUT') return 'high';

  // HTTP status codes
  if (error && error.status && error.status >= 500) return 'critical';
  if (error && error.status && error.status >= 400 && error.status < 500) return 'medium';

  // Database and storage errors
  if (error && error.code && error.code.includes('SQLITE_')) return 'high';
  if (error && error.code && error.code.includes('ECONNRESET')) return 'high';

  // Security-related errors
  if (error && error.message && error.message.includes('authentication')) return 'high';
  if (error && error.message && error.message.includes('authorization')) return 'high';
  if (error && error.message && error.message.includes('permission')) return 'high';

  // Default severity for unknown errors
  return 'medium';
};

/**
 * Get detailed error classification information
 * @param error - The error to analyze
 * @returns Object with classification details
 */
export const getErrorClassification = (error: any) => {
  const severity = classifyError(error);

  return {
    severity,
    type: error.name || 'Error',
    isCritical: severity === 'critical',
    isHighPriority: ['critical', 'high'].includes(severity),
    description: getErrorDescription(error, severity)
  };
};

/**
 * Get human-readable description for error classification
 */
const getErrorDescription = (error: any, severity: ErrorSeverity): string => {
  const descriptions: Record<string, string> = {
    critical: 'Critical error that requires immediate attention',
    high: 'High severity error that should be addressed promptly',
    medium: 'Medium severity error that needs investigation',
    low: 'Low severity error that can be addressed later',
    info: 'Informational message or non-critical issue'
  };

  return descriptions[severity] || descriptions.medium;
};