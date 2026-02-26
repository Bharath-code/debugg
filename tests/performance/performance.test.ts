/**
 * Performance Tests for Debugg
 * Benchmarks and performance regression tests
 */

import { describe, test, expect } from 'bun:test';
import { ErrorHandler } from '../../src/core/ErrorHandler';
import { EnhancedErrorHandler } from '../../src/enhanced';
import { ErrorBatcher } from '../../src/core/ErrorBatcher';
import { ErrorDebouncer } from '../../src/core/ErrorDebouncer';
import { createConsoleReporter } from '../../src/reporters/ConsoleReporter';
import { suppressConsole, measureTime, sleep } from '../../tests/utils/test-utils';

// Performance thresholds
const THRESHOLDS = {
  errorCreation: 0.1, // ms per error
  errorHandling: 1.0, // ms per error
  batchFlush: 10, // ms for batch flush
  memoryPerError: 1, // KB per error
};

describe('Performance Tests', () => {
  describe('Error Creation Performance', () => {
    test('should create errors within performance threshold', async () => {
      const handler = new ErrorHandler({
        serviceName: 'perf-test',
        environment: 'test',
        logToConsole: false,
      });

      const iterations = 1000;
      const errors: any[] = [];

      const { duration } = await measureTime(async () => {
        for (let i = 0; i < iterations; i++) {
          errors.push(handler.createError(new Error(`Error ${i}`), { index: i }));
        }
      });

      const avgTimePerError = duration / iterations;

      console.log(`Error Creation: ${avgTimePerError.toFixed(3)}ms per error (${iterations} iterations)`);

      expect(avgTimePerError).toBeLessThan(THRESHOLDS.errorCreation);
    });

    test('should create errors with large context efficiently', async () => {
      const handler = new ErrorHandler({
        serviceName: 'perf-test',
        environment: 'test',
        logToConsole: false,
      });

      const largeContext = {
        data: 'x'.repeat(10000),
        array: Array(100).fill({ item: 'value' }),
        nested: {
          level1: {
            level2: {
              level3: {
                data: 'deep value',
              },
            },
          },
        },
      };

      const iterations = 100;
      const { duration } = await measureTime(async () => {
        for (let i = 0; i < iterations; i++) {
          handler.createError(new Error(`Error ${i}`), largeContext);
        }
      });

      const avgTimePerError = duration / iterations;

      console.log(`Large Context Error Creation: ${avgTimePerError.toFixed(3)}ms per error`);

      // Large context should still be reasonably fast
      expect(avgTimePerError).toBeLessThan(THRESHOLDS.errorCreation * 10);
    });
  });

  describe('Error Handling Performance', () => {
    test('should handle errors within performance threshold', async () => {
      const handler = new ErrorHandler({
        serviceName: 'perf-test',
        environment: 'test',
        logToConsole: false,
      });

      // Add a fast reporter
      handler.addReporter(async () => {
        // Fast no-op reporter
      });

      const iterations = 100;
      const { duration } = await measureTime(async () => {
        for (let i = 0; i < iterations; i++) {
          await handler.handle(new Error(`Error ${i}`), { index: i });
        }
      });

      const avgTimePerError = duration / iterations;

      console.log(`Error Handling: ${avgTimePerError.toFixed(3)}ms per error (${iterations} iterations)`);

      expect(avgTimePerError).toBeLessThan(THRESHOLDS.errorHandling);
    });

    test('should handle concurrent errors efficiently', async () => {
      const handler = new ErrorHandler({
        serviceName: 'perf-test',
        environment: 'test',
        logToConsole: false,
      });

      const concurrentErrors = 100;
      const promises: Promise<any>[] = [];

      const { duration } = await measureTime(async () => {
        for (let i = 0; i < concurrentErrors; i++) {
          promises.push(handler.handle(new Error(`Concurrent error ${i}`), {}));
        }

        await Promise.all(promises);
      });

      const avgTimePerError = duration / concurrentErrors;

      console.log(`Concurrent Error Handling: ${avgTimePerError.toFixed(3)}ms per error (${concurrentErrors} concurrent)`);

      // Concurrent handling should be efficient
      expect(avgTimePerError).toBeLessThan(THRESHOLDS.errorHandling * 2);
    });
  });

  describe('Batching Performance', () => {
    test('should batch errors efficiently', async () => {
      const batcher = new ErrorBatcher({
        maxBatchSize: 10,
        flushIntervalMs: 100,
        enabled: true,
      });

      const flushedBatches: any[] = [];

      batcher.onFlush(async (batch) => {
        flushedBatches.push(batch);
      });

      const iterations = 100;
      const handler = new ErrorHandler({
        serviceName: 'perf-test',
        environment: 'test',
        logToConsole: false,
      });

      const { duration } = await measureTime(async () => {
        for (let i = 0; i < iterations; i++) {
          const error = handler.createError(new Error(`Error ${i}`), {});
          batcher.add(error);
        }

        // Wait for final flush
        await sleep(150);
      });

      console.log(`Batching: ${flushedBatches.length} batches for ${iterations} errors in ${duration.toFixed(2)}ms`);

      // Should have flushed approximately 10 times (100 errors / 10 batch size)
      expect(flushedBatches.length).toBeGreaterThanOrEqual(8);
      expect(flushedBatches.length).toBeLessThanOrEqual(12);
    });

    test('should flush batch on size limit', async () => {
      const batcher = new ErrorBatcher({
        maxBatchSize: 5,
        flushIntervalMs: 10000, // Long interval to test size limit
        enabled: true,
      });

      let flushCount = 0;
      batcher.onFlush(async () => {
        flushCount++;
      });

      const handler = new ErrorHandler({
        serviceName: 'perf-test',
        environment: 'test',
        logToConsole: false,
      });

      // Add exactly maxBatchSize errors
      for (let i = 0; i < 5; i++) {
        const error = handler.createError(new Error(`Error ${i}`), {});
        batcher.add(error);
      }

      // Should have flushed once
      expect(flushCount).toBe(1);
    });
  });

  describe('Debouncing Performance', () => {
    test('should debounce rapid-fire errors', async () => {
      const debouncer = new ErrorDebouncer({
        intervalMs: 100,
        enabled: true,
        maxBuffered: 10,
      });

      let allowedCount = 0;
      let blockedCount = 0;

      debouncer.onDebounce((_error, result) => {
        if (result.allowed) {
          allowedCount++;
        } else {
          blockedCount++;
        }
      });

      const handler = new ErrorHandler({
        serviceName: 'perf-test',
        environment: 'test',
        logToConsole: false,
      });

      // Send 20 errors rapidly
      for (let i = 0; i < 20; i++) {
        const error = handler.createError(new Error(`Rapid error ${i}`), {});
        debouncer.process(error);
      }

      // First error should be allowed, rest blocked
      expect(allowedCount).toBe(1);
      expect(blockedCount).toBe(19);

      console.log(`Debouncing: ${allowedCount} allowed, ${blockedCount} blocked`);
    });

    test('should process buffered errors after debounce', async () => {
      const debouncer = new ErrorDebouncer({
        intervalMs: 50,
        enabled: true,
        maxBuffered: 5,
      });

      let totalAllowed = 0;

      debouncer.onDebounce((_error, result) => {
        if (result.allowed) {
          totalAllowed++;
        }
      });

      const handler = new ErrorHandler({
        serviceName: 'perf-test',
        environment: 'test',
        logToConsole: false,
      });

      // Send 5 errors rapidly
      for (let i = 0; i < 5; i++) {
        const error = handler.createError(new Error(`Error ${i}`), {});
        debouncer.process(error);
      }

      // Wait for debounce to clear and process buffer
      await sleep(300);

      // Should have processed multiple buffered errors
      expect(totalAllowed).toBeGreaterThan(1);

      console.log(`Buffered processing: ${totalAllowed} errors processed`);
    });
  });

  describe('Memory Performance', () => {
    test('should not leak memory during error handling', async () => {
      const handler = new ErrorHandler({
        serviceName: 'perf-test',
        environment: 'test',
        logToConsole: false,
      });

      // Get initial memory
      const initialMemory = process.memoryUsage().heapUsed;

      const iterations = 1000;

      for (let i = 0; i < iterations; i++) {
        await handler.handle(new Error(`Error ${i}`), { index: i, data: 'x'.repeat(100) });
      }

      // Get final memory
      const finalMemory = process.memoryUsage().heapUsed;
      const memoryIncrease = (finalMemory - initialMemory) / 1024 / 1024; // Convert to MB

      console.log(`Memory increase: ${memoryIncrease.toFixed(2)}MB for ${iterations} errors`);

      // Memory increase should be reasonable (< 50MB for 1000 errors)
      expect(memoryIncrease).toBeLessThan(50);
    });

    test('should clean up storage properly', async () => {
      const handler = new ErrorHandler({
        serviceName: 'perf-test',
        environment: 'test',
        logToConsole: false,
      });

      const iterations = 100;

      for (let i = 0; i < iterations; i++) {
        handler.createError(new Error(`Error ${i}`), {});
      }

      const storage = handler.getStorage();
      expect(storage.getCount()).toBe(iterations);

      // Clear all errors
      storage.clearAllErrors();

      expect(storage.getCount()).toBe(0);
    });
  });

  describe('Enhanced Handler Performance', () => {
    test('should handle errors with all features enabled', async () => {
      const handler = new EnhancedErrorHandler({
        serviceName: 'perf-test',
        environment: 'test',
        performanceMonitoring: true,
        analytics: true,
        ciIntegration: true,
        logToConsole: false,
      });

      const iterations = 100;

      const { duration } = await measureTime(async () => {
        for (let i = 0; i < iterations; i++) {
          await handler.handle(new Error(`Error ${i}`), { index: i });
        }
      });

      const avgTimePerError = duration / iterations;

      console.log(`Enhanced Handler: ${avgTimePerError.toFixed(3)}ms per error`);

      // Enhanced handler should still be performant
      expect(avgTimePerError).toBeLessThan(THRESHOLDS.errorHandling * 2);

      // Verify metrics are being collected
      const metrics = handler.getInvestorMetrics();
      expect(metrics.totalErrors).toBe(iterations);
    });
  });

  describe('Reporter Performance', () => {
    test('console reporter should be fast', async () => {
      const handler = new ErrorHandler({
        serviceName: 'perf-test',
        environment: 'test',
        logToConsole: false,
      });

      const reporter = createConsoleReporter({ useGroups: false });
      handler.addReporter(reporter);

      const iterations = 100;

      const { duration } = await measureTime(async () => {
        for (let i = 0; i < iterations; i++) {
          await handler.handle(new Error(`Error ${i}`), {});
        }
      });

      const avgTimePerError = duration / iterations;

      console.log(`Console Reporter: ${avgTimePerError.toFixed(3)}ms per error`);

      expect(avgTimePerError).toBeLessThan(THRESHOLDS.errorHandling);
    });

    test('multiple reporters should scale linearly', async () => {
      const handler = new ErrorHandler({
        serviceName: 'perf-test',
        environment: 'test',
        logToConsole: false,
      });

      // Add multiple fast reporters
      for (let i = 0; i < 5; i++) {
        handler.addReporter(async () => {
          // Fast no-op
        });
      }

      const iterations = 50;

      const { duration: singleReporter } = await measureTime(async () => {
        const singleHandler = new ErrorHandler({
          serviceName: 'perf-test',
          environment: 'test',
          logToConsole: false,
        });
        singleHandler.addReporter(async () => {});

        for (let i = 0; i < iterations; i++) {
          await singleHandler.handle(new Error(`Error ${i}`), {});
        }
      });

      const { duration: multipleReporters } = await measureTime(async () => {
        for (let i = 0; i < iterations; i++) {
          await handler.handle(new Error(`Error ${i}`), {});
        }
      });

      const overhead = multipleReporters - singleReporter;
      const overheadPerReporter = overhead / 5;

      console.log(
        `Multiple Reporters: ${overheadPerReporter.toFixed(3)}ms overhead per reporter (${iterations} errors)`
      );

      // Overhead should be minimal
      expect(overheadPerReporter / iterations).toBeLessThan(0.1);
    });
  });
});
