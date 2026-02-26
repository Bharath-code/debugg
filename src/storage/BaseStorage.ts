/**
 * BaseStorage - Abstract base class for error storage
 */

import { UniversalError, ErrorStorage, ErrorStatistics, ErrorSeverity } from '../types';

export abstract class BaseStorage implements ErrorStorage {
  protected maxErrors: number;

  constructor(maxErrors: number = 1000) {
    this.maxErrors = maxErrors;
  }

  /**
   * Store an error
   */
  abstract storeError(error: UniversalError): void;

  /**
   * Retrieve an error by ID
   */
  abstract getError(errorId: string): UniversalError | undefined;

  /**
   * Get all stored errors
   */
  abstract getAllErrors(): UniversalError[];

  /**
   * Get errors filtered by severity
   */
  abstract getErrorsBySeverity(severity: ErrorSeverity): UniversalError[];

  /**
   * Get recent errors (most recent first)
   */
  abstract getRecentErrors(limit?: number): UniversalError[];

  /**
   * Clear all stored errors
   */
  abstract clearAllErrors(): void;

  /**
   * Remove a specific error
   */
  abstract removeError(errorId: string): boolean;

  /**
   * Get error statistics
   */
  abstract getStatistics(): ErrorStatistics;

  /**
   * Check if storage is at capacity
   */
  protected isAtCapacity(currentCount: number): boolean {
    return currentCount >= this.maxErrors;
  }

  /**
   * Get number of errors to remove when at capacity
   */
  protected getCleanupCount(currentCount: number): number {
    return Math.max(1, Math.floor(currentCount * 0.1)); // Remove oldest 10%
  }
}
