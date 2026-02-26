/**
 * Error Batcher - Batches multiple errors for efficient reporting
 * Useful for high-traffic scenarios to reduce reporter overhead
 */

import { UniversalError } from '../types';

export interface BatcherConfig {
  /** Maximum batch size before flushing */
  maxBatchSize: number;
  /** Maximum time to wait before flushing (ms) */
  flushIntervalMs: number;
  /** Whether to enable batching */
  enabled: boolean;
}

export interface BatchedError {
  error: UniversalError;
  timestamp: number;
  count: number;
}

export interface BatchFlushResult {
  errors: BatchedError[];
  reason: 'size_limit' | 'time_limit' | 'manual' | 'disabled';
  timestamp: Date;
}

export type BatchFlushCallback = (batch: BatchedError[], result: BatchFlushResult) => Promise<void>;

export class ErrorBatcher {
  private config: BatcherConfig;
  private batch: Map<string, BatchedError>;
  private flushTimer?: ReturnType<typeof setTimeout>;
  private callback?: BatchFlushCallback;
  private isFlushing = false;
  private totalBatchesFlushed = 0;
  private totalErrorsBatched = 0;

  constructor(config: Partial<BatcherConfig> = {}) {
    this.config = {
      maxBatchSize: config.maxBatchSize ?? 10,
      flushIntervalMs: config.flushIntervalMs ?? 5000,
      enabled: config.enabled ?? true,
    };

    this.batch = new Map();
  }

  /**
   * Set the flush callback
   */
  onFlush(callback: BatchFlushCallback): void {
    this.callback = callback;
  }

  /**
   * Add an error to the batch
   */
  add(error: UniversalError): void {
    if (!this.config.enabled) {
      // Batching disabled, flush immediately if callback exists
      this.callback?.([{ error, timestamp: Date.now(), count: 1 }], {
        errors: [{ error, timestamp: Date.now(), count: 1 }],
        reason: 'disabled',
        timestamp: new Date(),
      });
      return;
    }

    // Create a deduplication key
    const key = this.createDedupKey(error);

    const existing = this.batch.get(key);
    if (existing) {
      existing.count++;
      existing.timestamp = Date.now();
    } else {
      this.batch.set(key, {
        error,
        timestamp: Date.now(),
        count: 1,
      });
    }

    this.totalErrorsBatched++;

    // Check if we should flush
    if (this.batch.size >= this.config.maxBatchSize) {
      this.flush('size_limit');
    } else if (!this.flushTimer) {
      // Start timer if not already running
      this.startFlushTimer();
    }
  }

  /**
   * Manually flush the batch
   */
  async flush(reason: 'manual' | 'size_limit' | 'time_limit' = 'manual'): Promise<BatchFlushResult> {
    if (this.isFlushing || this.batch.size === 0) {
      return {
        errors: [],
        reason,
        timestamp: new Date(),
      };
    }

    this.isFlushing = true;

    const errors = Array.from(this.batch.values());
    this.batch.clear();

    if (this.flushTimer) {
      clearTimeout(this.flushTimer);
      this.flushTimer = undefined;
    }

    const result: BatchFlushResult = {
      errors,
      reason,
      timestamp: new Date(),
    };

    // Call the callback
    try {
      await this.callback?.(errors, result);
      this.totalBatchesFlushed++;
    } catch (error) {
      console.error('[ErrorBatcher] Flush callback failed:', error);
    } finally {
      this.isFlushing = false;
    }

    return result;
  }

  /**
   * Start the flush timer
   */
  private startFlushTimer(): void {
    if (this.flushTimer) {
      return;
    }

    this.flushTimer = setTimeout(() => {
      this.flush('time_limit');
    }, this.config.flushIntervalMs);

    // Don't let the timer prevent Node.js from exiting
    if (typeof this.flushTimer.unref === 'function') {
      this.flushTimer.unref();
    }
  }

  /**
   * Create a deduplication key for an error
   */
  private createDedupKey(error: UniversalError): string {
    // Use error name, message, and severity for deduplication
    return `${error.name}|${error.message}|${error.severity}`;
  }

  /**
   * Enable batching
   */
  enable(): void {
    this.config.enabled = true;
  }

  /**
   * Disable batching and flush immediately
   */
  async disable(): Promise<void> {
    this.config.enabled = false;
    await this.flush('manual');

    if (this.flushTimer) {
      clearTimeout(this.flushTimer);
      this.flushTimer = undefined;
    }
  }

  /**
   * Update batcher configuration
   */
  updateConfig(config: Partial<BatcherConfig>): void {
    const wasEnabled = this.config.enabled;

    this.config = {
      ...this.config,
      ...config,
    };

    // If interval changed and we have pending batch, restart timer
    if (config.flushIntervalMs !== undefined && this.batch.size > 0) {
      if (this.flushTimer) {
        clearTimeout(this.flushTimer);
        this.flushTimer = undefined;
      }
      this.startFlushTimer();
    }

    // If disabled, flush immediately
    if (wasEnabled && !this.config.enabled) {
      this.disable();
    }
  }

  /**
   * Get current batch size
   */
  getBatchSize(): number {
    return this.batch.size;
  }

  /**
   * Get batcher statistics
   */
  getStatistics(): BatcherStatistics {
    return {
      currentBatchSize: this.batch.size,
      totalBatchesFlushed: this.totalBatchesFlushed,
      totalErrorsBatched: this.totalErrorsBatched,
      averageBatchSize:
        this.totalBatchesFlushed > 0 ? Math.round(this.totalErrorsBatched / this.totalBatchesFlushed) : 0,
      enabled: this.config.enabled,
      maxBatchSize: this.config.maxBatchSize,
      flushIntervalMs: this.config.flushIntervalMs,
    };
  }

  /**
   * Clear the batch without flushing
   */
  clear(): void {
    this.batch.clear();

    if (this.flushTimer) {
      clearTimeout(this.flushTimer);
      this.flushTimer = undefined;
    }
  }
}

export interface BatcherStatistics {
  currentBatchSize: number;
  totalBatchesFlushed: number;
  totalErrorsBatched: number;
  averageBatchSize: number;
  enabled: boolean;
  maxBatchSize: number;
  flushIntervalMs: number;
}
