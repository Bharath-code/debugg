/**
 * ErrorClassifier - Classifies errors and determines severity
 */

import { ErrorSeverity } from '../types';
import { classifyError as classifyErrorUtil } from '../utils/classify';

export interface ClassificationResult {
  severity: ErrorSeverity;
  type: string;
  isCritical: boolean;
  isHighPriority: boolean;
  description: string;
}

export class ErrorClassifier {
  /**
   * Classify an error and return detailed classification
   */
  classify(error: unknown): ClassificationResult {
    const severity = classifyErrorUtil(error);
    const type = error && typeof error === 'object' && 'name' in error ? String(error.name) : 'Error';

    return {
      severity,
      type,
      isCritical: severity === 'critical',
      isHighPriority: ['critical', 'high'].includes(severity),
      description: this.getDescription(severity),
    };
  }

  /**
   * Get severity level for an error
   */
  getSeverity(error: unknown): ErrorSeverity {
    return classifyErrorUtil(error);
  }

  /**
   * Check if error is critical
   */
  isCritical(error: unknown): boolean {
    return this.getSeverity(error) === 'critical';
  }

  /**
   * Check if error is high priority
   */
  isHighPriority(error: unknown): boolean {
    const severity = this.getSeverity(error);
    return severity === 'critical' || severity === 'high';
  }

  /**
   * Get human-readable description for severity
   */
  private getDescription(severity: ErrorSeverity): string {
    const descriptions: Record<ErrorSeverity, string> = {
      critical: 'Critical error that requires immediate attention',
      high: 'High severity error that should be addressed promptly',
      medium: 'Medium severity error that needs investigation',
      low: 'Low severity error that can be addressed later',
      info: 'Informational message or non-critical issue',
    };

    return descriptions[severity] || descriptions.medium;
  }
}
