/**
 * Error Debouncer - Debounces rapid-fire errors
 * Prevents flooding from errors that occur in quick succession
 */

import { UniversalError } from '../types';

export interface DebouncerConfig {
  /** Debounce interval in milliseconds */
  intervalMs: number;
  /** Whether to enable debouncing */
  enabled: boolean;
  /** Maximum errors to buffer during debounce */
  maxBuffered: number;
}

export interface DebounceResult {
  /** Whether the error was allowed through */
  allowed: boolean;
  /** Whether the error was buffered */
  buffered: boolean;
  /** Time until next error will be allowed (ms) */
  nextAllowedIn?: number;
  /** Buffered errors count */
  bufferedCount?: number;
}

export type DebounceCallback = (error: UniversalError, result: DebounceResult) => void;

export class ErrorDebouncer {
  private config: DebouncerConfig;
  private lastErrorTime: number = 0;
  private buffer: UniversalError[] = [];
  private callback?: DebounceCallback;
  private totalBlocked: number = 0;
  private totalAllowed: number = 0;
  private totalBuffered: number = 0;

  constructor(config: Partial<DebouncerConfig> = {}) {
    this.config = {
      intervalMs: config.intervalMs ?? 1000,
      enabled: config.enabled ?? true,
      maxBuffered: config.maxBuffered ?? 10,
    };
  }

  /**
   * Set the debounce callback
   */
  onDebounce(callback: DebounceCallback): void {
    this.callback = callback;
  }

  /**
   * Process an error through the debouncer
   */
  process(error: UniversalError): DebounceResult {
    if (!this.config.enabled) {
      this.totalAllowed++;
      this.callback?.(error, { allowed: true, buffered: false });
      return { allowed: true, buffered: false };
    }

    const now = Date.now();
    const timeSinceLastError = now - this.lastErrorTime;
    const isWithinDebounceWindow = timeSinceLastError < this.config.intervalMs;

    if (isWithinDebounceWindow) {
      // Within debounce window
      this.totalBlocked++;

      // Buffer if space available
      if (this.buffer.length < this.config.maxBuffered) {
        this.buffer.push(error);
        this.totalBuffered++;

        const result: DebounceResult = {
          allowed: false,
          buffered: true,
          nextAllowedIn: this.config.intervalMs - timeSinceLastError,
          bufferedCount: this.buffer.length,
        };

        this.callback?.(error, result);
        return result;
      }

      // Buffer full, drop the error
      const result: DebounceResult = {
        allowed: false,
        buffered: false,
        nextAllowedIn: this.config.intervalMs - timeSinceLastError,
        bufferedCount: this.buffer.length,
      };

      this.callback?.(error, result);
      return result;
    }

    // Outside debounce window, allow the error
    this.lastErrorTime = now;
    this.totalAllowed++;

    const result: DebounceResult = {
      allowed: true,
      buffered: false,
    };

    this.callback?.(error, result);

    // Process buffered errors
    this.processBuffer();

    return result;
  }

  /**
   * Process buffered errors
   */
  private processBuffer(): void {
    if (this.buffer.length === 0) return;

    const bufferedError = this.buffer.shift()!;

    // Schedule the buffered error after a small delay
    setTimeout(() => {
      this.lastErrorTime = Date.now();
      this.totalAllowed++;
      this.callback?.(bufferedError, { allowed: true, buffered: false });

      // Continue processing buffer
      this.processBuffer();
    }, this.config.intervalMs);
  }

  /**
   * Enable debouncing
   */
  enable(): void {
    this.config.enabled = true;
  }

  /**
   * Disable debouncing and clear buffer
   */
  disable(): void {
    this.config.enabled = false;
    this.buffer = [];
  }

  /**
   * Update debouncer configuration
   */
  updateConfig(config: Partial<DebouncerConfig>): void {
    this.config = {
      ...this.config,
      ...config,
    };
  }

  /**
   * Clear the buffer
   */
  clearBuffer(): number {
    const clearedCount = this.buffer.length;
    this.buffer = [];
    return clearedCount;
  }

  /**
   * Get debouncer statistics
   */
  getStatistics(): DebouncerStatistics {
    return {
      enabled: this.config.enabled,
      intervalMs: this.config.intervalMs,
      maxBuffered: this.config.maxBuffered,
      currentBuffered: this.buffer.length,
      totalAllowed: this.totalAllowed,
      totalBlocked: this.totalBlocked,
      totalBuffered: this.totalBuffered,
      blockRate: this.totalAllowed + this.totalBlocked > 0
        ? Math.round((this.totalBlocked / (this.totalAllowed + this.totalBlocked)) * 100)
        : 0,
    };
  }

  /**
   * Reset statistics
   */
  resetStats(): void {
    this.totalBlocked = 0;
    this.totalAllowed = 0;
    this.totalBuffered = 0;
  }
}

export interface DebouncerStatistics {
  enabled: boolean;
  intervalMs: number;
  maxBuffered: number;
  currentBuffered: number;
  totalAllowed: number;
  totalBlocked: number;
  totalBuffered: number;
  blockRate: number;
}
