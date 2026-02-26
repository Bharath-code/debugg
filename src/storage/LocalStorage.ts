/**
 * LocalStorage - Browser localStorage error storage implementation
 */

import { UniversalError } from '../types';
import { MemoryStorage } from './MemoryStorage';
import { DEFAULTS } from '../constants/defaults';

export interface LocalStorageOptions {
  /** Storage key for localStorage */
  storageKey?: string;
  /** Maximum errors to store */
  maxErrors?: number;
  /** Whether to sync with localStorage on every write */
  autoSync?: boolean;
}

export class LocalStorage extends MemoryStorage {
  private storageKey: string;
  private autoSync: boolean;

  constructor(options: LocalStorageOptions = {}) {
    super(options.maxErrors ?? DEFAULTS.DEFAULT_MAX_STORAGE);
    this.storageKey = options.storageKey ?? DEFAULTS.STORAGE_KEY;
    this.autoSync = options.autoSync ?? true;

    // Load from localStorage on initialization
    if (typeof localStorage !== 'undefined') {
      this.loadFromStorage();
    }
  }

  /**
   * Store an error and sync to localStorage
   */
  override storeError(error: UniversalError): void {
    super.storeError(error);

    if (this.autoSync && typeof localStorage !== 'undefined') {
      this.saveToStorage();
    }
  }

  /**
   * Clear all errors and clear localStorage
   */
  override clearAllErrors(): void {
    super.clearAllErrors();

    if (typeof localStorage !== 'undefined') {
      localStorage.removeItem(this.storageKey);
    }
  }

  /**
   * Remove a specific error and sync to localStorage
   */
  override removeError(errorId: string): boolean {
    const removed = super.removeError(errorId);

    if (removed && this.autoSync && typeof localStorage !== 'undefined') {
      this.saveToStorage();
    }

    return removed;
  }

  /**
   * Save errors to localStorage
   */
  private saveToStorage(): void {
    try {
      const serializableErrors = this.getAllErrors().map((error) => ({
        ...error,
        timestamp: error.timestamp.toISOString(),
      }));

      localStorage.setItem(this.storageKey, JSON.stringify(serializableErrors));
    } catch (error) {
      console.error('Failed to persist errors to localStorage:', error);
    }
  }

  /**
   * Load errors from localStorage
   */
  private loadFromStorage(): void {
    try {
      const storedData = localStorage.getItem(this.storageKey);

      if (storedData) {
        const parsedErrors = JSON.parse(storedData) as Array<Record<string, unknown>>;

        parsedErrors.forEach((error) => {
          const metadata = (error.metadata as Record<string, unknown>) || {};
          let platform = String(metadata.platform ?? 'unknown');
          
          // Validate platform
          if (!['browser', 'node', 'mobile', 'unknown'].includes(platform)) {
            platform = 'unknown';
          }

          const universalError: UniversalError = {
            ...error,
            timestamp: new Date(String(error.timestamp)),
            metadata: {
              platform: platform as 'browser' | 'node' | 'mobile' | 'unknown',
              serviceName: String(metadata.serviceName ?? ''),
              environment: String(metadata.environment ?? ''),
            },
          } as UniversalError;

          super.storeError(universalError);
        });
      }
    } catch (error) {
      console.error('Failed to load errors from localStorage:', error);
    }
  }

  /**
   * Manually sync to localStorage
   */
  sync(): void {
    this.saveToStorage();
  }
}
