/**
 * Basic error storage system
 * Provides in-memory storage for errors with optional persistence
 */

import { UniversalError } from '../types/error';

interface StorageConfig {
  maxErrors?: number;
  persist?: boolean;
  storageKey?: string;
}

interface ErrorStorage {
  [key: string]: UniversalError;
}

export class ErrorStorageSystem {
  private errors: ErrorStorage = {};
  private config: Required<StorageConfig>;

  constructor(config: StorageConfig = {}) {
    this.config = {
      maxErrors: config.maxErrors || 1000,
      persist: config.persist || false,
      storageKey: config.storageKey || 'debugg_errors'
    };

    if (this.config.persist && typeof localStorage !== 'undefined') {
      this.loadFromStorage();
    }
  }

  /**
   * Store an error
   */
  public storeError(error: UniversalError): void {
    // Check if we need to clean up old errors
    if (Object.keys(this.errors).length >= this.config.maxErrors) {
      this.cleanupOldErrors();
    }

    // Store the error
    this.errors[error.errorId] = error;

    // Persist if configured
    if (this.config.persist && typeof localStorage !== 'undefined') {
      this.saveToStorage();
    }
  }

  /**
   * Retrieve an error by ID
   */
  public getError(errorId: string): UniversalError | undefined {
    return this.errors[errorId];
  }

  /**
   * Get all stored errors
   */
  public getAllErrors(): UniversalError[] {
    return Object.values(this.errors);
  }

  /**
   * Get errors filtered by severity
   */
  public getErrorsBySeverity(severity: string): UniversalError[] {
    return Object.values(this.errors).filter(error => error.severity === severity);
  }

  /**
   * Get recent errors (most recent first)
   */
  public getRecentErrors(limit = 10): UniversalError[] {
    return Object.values(this.errors)
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
      .slice(0, limit);
  }

  /**
   * Clear all stored errors
   */
  public clearAllErrors(): void {
    this.errors = {};
    if (this.config.persist && typeof localStorage !== 'undefined') {
      localStorage.removeItem(this.config.storageKey);
    }
  }

  /**
   * Remove a specific error
   */
  public removeError(errorId: string): boolean {
    if (this.errors[errorId]) {
      delete this.errors[errorId];
      if (this.config.persist && typeof localStorage !== 'undefined') {
        this.saveToStorage();
      }
      return true;
    }
    return false;
  }

  /**
   * Get error statistics
   */
  public getStatistics(): {
    total: number;
    bySeverity: Record<string, number>;
    recentTimestamp?: Date;
  } {
    const bySeverity: Record<string, number> = {
      critical: 0,
      high: 0,
      medium: 0,
      low: 0,
      info: 0
    };

    let recentTimestamp: Date | undefined;

    Object.values(this.errors).forEach(error => {
      bySeverity[error.severity] = (bySeverity[error.severity] || 0) + 1;
      if (!recentTimestamp || error.timestamp > recentTimestamp) {
        recentTimestamp = error.timestamp;
      }
    });

    return {
      total: Object.keys(this.errors).length,
      bySeverity,
      recentTimestamp
    };
  }

  /**
   * Clean up old errors when storage limit is reached
   */
  private cleanupOldErrors(): void {
    const errorIds = Object.keys(this.errors)
      .sort((a, b) => this.errors[a].timestamp.getTime() - this.errors[b].timestamp.getTime());

    // Remove oldest 10% of errors
    const removeCount = Math.max(1, Math.floor(errorIds.length * 0.1));
    const idsToRemove = errorIds.slice(0, removeCount);

    idsToRemove.forEach(id => delete this.errors[id]);
  }

  /**
   * Save errors to localStorage
   */
  private saveToStorage(): void {
    try {
      const serializableErrors = Object.values(this.errors).map(error => ({
        ...error,
        timestamp: error.timestamp.toISOString()
      }));
      localStorage.setItem(this.config.storageKey, JSON.stringify(serializableErrors));
    } catch (error) {
      console.error('Failed to persist errors:', error);
    }
  }

  /**
   * Load errors from localStorage
   */
  private loadFromStorage(): void {
    try {
      const storedData = localStorage.getItem(this.config.storageKey);
      if (storedData) {
        const parsedErrors = JSON.parse(storedData);
        this.errors = parsedErrors.reduce((acc: ErrorStorage, error: any) => {
          acc[error.errorId] = {
            ...error,
            timestamp: new Date(error.timestamp)
          };
          return acc;
        }, {});
      }
    } catch (error) {
      console.error('Failed to load persisted errors:', error);
    }
  }
}

// Singleton instance for convenience
let defaultStorage: ErrorStorageSystem | null = null;

export const getDefaultErrorStorage = (config?: StorageConfig): ErrorStorageSystem => {
  if (!defaultStorage) {
    defaultStorage = new ErrorStorageSystem(config);
  }
  return defaultStorage;
};