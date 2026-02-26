/**
 * MemoryStorage - In-memory error storage implementation
 */

import { UniversalError, ErrorStatistics, ErrorSeverity } from '../types';
import { BaseStorage } from './BaseStorage';

export class MemoryStorage extends BaseStorage {
  private errors: Map<string, UniversalError>;

  constructor(maxErrors: number = 1000) {
    super(maxErrors);
    this.errors = new Map();
  }

  /**
   * Store an error
   */
  storeError(error: UniversalError): void {
    // Check if we need to clean up old errors
    if (this.isAtCapacity(this.errors.size)) {
      this.cleanupOldErrors();
    }

    this.errors.set(error.errorId, error);
  }

  /**
   * Retrieve an error by ID
   */
  getError(errorId: string): UniversalError | undefined {
    return this.errors.get(errorId);
  }

  /**
   * Get all stored errors
   */
  getAllErrors(): UniversalError[] {
    return Array.from(this.errors.values());
  }

  /**
   * Get errors filtered by severity
   */
  getErrorsBySeverity(severity: ErrorSeverity): UniversalError[] {
    return Array.from(this.errors.values()).filter((error) => error.severity === severity);
  }

  /**
   * Get recent errors (most recent first)
   */
  getRecentErrors(limit = 10): UniversalError[] {
    return Array.from(this.errors.values())
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
      .slice(0, limit);
  }

  /**
   * Clear all stored errors
   */
  clearAllErrors(): void {
    this.errors.clear();
  }

  /**
   * Remove a specific error
   */
  removeError(errorId: string): boolean {
    return this.errors.delete(errorId);
  }

  /**
   * Get error statistics
   */
  getStatistics(): ErrorStatistics {
    const bySeverity: Record<ErrorSeverity, number> = {
      critical: 0,
      high: 0,
      medium: 0,
      low: 0,
      info: 0,
    };

    let recentTimestamp: Date | undefined;

    this.errors.forEach((error) => {
      bySeverity[error.severity]++;
      if (!recentTimestamp || error.timestamp > recentTimestamp) {
        recentTimestamp = error.timestamp;
      }
    });

    return {
      total: this.errors.size,
      bySeverity,
      ...(recentTimestamp && { recentTimestamp }),
    } as ErrorStatistics;
  }

  /**
   * Clean up old errors when at capacity
   */
  private cleanupOldErrors(): void {
    const entries = Array.from(this.errors.entries()).sort(
      (a, b) => a[1].timestamp.getTime() - b[1].timestamp.getTime()
    );

    const removeCount = this.getCleanupCount(this.errors.size);
    const idsToRemove = entries.slice(0, removeCount).map(([id]) => id);

    idsToRemove.forEach((id) => this.errors.delete(id));
  }

  /**
   * Get current error count
   */
  getCount(): number {
    return this.errors.size;
  }
}
