/**
 * Integration Tests for Debugg Reporters
 * Tests integration with external services (Sentry, Webhooks)
 */

import { describe, test, expect, beforeEach, afterEach } from 'bun:test';
import { ErrorHandler } from '../../src/core/ErrorHandler';
import { createWebhookReporter } from '../../src/reporters/WebhookReporter';
import { createSentryReporter } from '../../src/reporters/SentryReporter';
import { createConsoleReporter } from '../../src/reporters/ConsoleReporter';
import { MockServer } from './utils/mock-server';
import { sleep, mockConsole, createTestContext } from './utils/test-utils';

describe('Reporter Integration Tests', () => {
  let mockServer: MockServer;
  let errorHandler: ErrorHandler;
  let consoleSpy: ReturnType<typeof mockConsole>;

  beforeEach(async () => {
    consoleSpy = mockConsole();
    mockServer = new MockServer({ port: 9999, logRequests: false });
    await mockServer.start();

    errorHandler = new ErrorHandler({
      serviceName: 'test-service',
      environment: 'test',
      logToConsole: false,
    });
  });

  afterEach(async () => {
    consoleSpy.restore();
    await mockServer.stop();
  });

  describe('Webhook Reporter Integration', () => {
    test('should successfully send error to webhook', async () => {
      const webhookUrl = mockServer.getWebhookUrl();
      const reporter = createWebhookReporter(webhookUrl, {
        retries: 3,
        timeout: 5000,
      });

      errorHandler.addReporter(reporter);

      const testError = new Error('Integration test error');
      const context = createTestContext({ userId: '123' });

      const result = await errorHandler.handle(testError, context);

      expect(result.success).toBe(true);
      expect(result.errorId).toMatch(/^err_/);

      // Wait for webhook to be called
      await sleep(100);

      const serverStats = mockServer.getStats();
      expect(serverStats.requestCount).toBeGreaterThan(0);

      const webhookRequests = mockServer.getRequestsByPath('/webhook');
      expect(webhookRequests.length).toBeGreaterThan(0);

      const request = webhookRequests[0];
      expect(request.method).toBe('POST');
      expect(request.body).toHaveProperty('errorId');
      expect(request.body).toHaveProperty('message', 'Integration test error');
    });

    test('should retry on webhook failure', async () => {
      // Use invalid URL to trigger retries
      const reporter = createWebhookReporter('http://localhost:9998/webhook', {
        retries: 2,
        timeout: 100,
        logFailures: false,
      });

      errorHandler.addReporter(reporter);

      const testError = new Error('Retry test error');
      const result = await errorHandler.handle(testError, {});

      // Should still succeed even if webhook fails
      expect(result.success).toBe(true);
      expect(result.warnings).toContainEqual(expect.stringContaining('reporter'));
    });

    test('should handle webhook timeout', async () => {
      const reporter = createWebhookReporter('http://localhost:9999/slow', {
        retries: 1,
        timeout: 100, // Very short timeout
        logFailures: false,
      });

      errorHandler.addReporter(reporter);

      const testError = new Error('Timeout test error');
      const result = await errorHandler.handle(testError, {});

      // Should handle timeout gracefully
      expect(result.success).toBe(true);
    });

    test('should include custom headers in webhook request', async () => {
      const webhookUrl = mockServer.getWebhookUrl();
      const reporter = createWebhookReporter(webhookUrl, {
        headers: {
          'X-Custom-Header': 'test-value',
          'X-API-Key': 'secret-key',
        },
        retries: 1,
      });

      errorHandler.addReporter(reporter);

      await errorHandler.handle(new Error('Header test'), {});
      await sleep(100);

      const webhookRequests = mockServer.getRequestsByPath('/webhook');
      expect(webhookRequests.length).toBeGreaterThan(0);

      const request = webhookRequests[0];
      expect(request.headers['x-custom-header']).toBe('test-value');
    });
  });

  describe('Sentry Reporter Integration', () => {
    test('should handle missing Sentry gracefully', async () => {
      const reporter = createSentryReporter('https://invalid@sentry.io/123456', {
        logWarning: false,
      });

      errorHandler.addReporter(reporter);

      const testError = new Error('Sentry test error');
      const result = await errorHandler.handle(testError, {});

      // Should succeed even without Sentry installed
      expect(result.success).toBe(true);
    });

    test('should validate Sentry DSN', async () => {
      expect(() => {
        createSentryReporter('');
      }).toThrow('Sentry DSN is required');

      expect(() => {
        createSentryReporter('invalid-dsn');
      }).not.toThrow(); // Invalid DSN is caught at runtime
    });
  });

  describe('Console Reporter Integration', () => {
    test('should log error to console', async () => {
      const reporter = createConsoleReporter({
        useGroups: false,
        logFailures: true,
      });

      errorHandler.addReporter(reporter);

      const testError = new Error('Console test error');
      await errorHandler.handle(testError, { userId: '123' });

      expect(consoleSpy.error).toHaveBeenCalled();
    });

    test('should use grouped console output', async () => {
      const reporter = createConsoleReporter({
        useGroups: true,
      });

      errorHandler.addReporter(reporter);

      await errorHandler.handle(new Error('Group test'), {});

      expect(consoleSpy.groupCollapsed).toHaveBeenCalled();
      expect(consoleSpy.groupEnd).toHaveBeenCalled();
    });
  });

  describe('Multiple Reporters Integration', () => {
    test('should dispatch to all reporters', async () => {
      const webhookUrl = mockServer.getWebhookUrl();

      const webhookReporter = createWebhookReporter(webhookUrl, { retries: 1 });
      const consoleReporter = createConsoleReporter({ useGroups: false });

      errorHandler.addReporter(webhookReporter);
      errorHandler.addReporter(consoleReporter);

      const testError = new Error('Multiple reporters test');
      const result = await errorHandler.handle(testError, {});

      expect(result.success).toBe(true);
      expect(result.dispatchResult?.total).toBe(2);

      await sleep(100);

      const webhookRequests = mockServer.getRequestsByPath('/webhook');
      expect(webhookRequests.length).toBe(1);
      expect(consoleSpy.error).toHaveBeenCalled();
    });

    test('should handle partial reporter failures', async () => {
      const webhookUrl = mockServer.getWebhookUrl();
      const failingReporter = async () => {
        throw new Error('Intentional failure');
      };

      const webhookReporter = createWebhookReporter(webhookUrl, { retries: 1 });

      errorHandler.addReporter(webhookReporter);
      errorHandler.addReporter(failingReporter);

      const testError = new Error('Partial failure test');
      const result = await errorHandler.handle(testError, {});

      expect(result.success).toBe(true);
      expect(result.dispatchResult?.failures).toBe(1);
      expect(result.warnings).toContainEqual(expect.stringContaining('failed'));
    });
  });

  describe('Reporter Performance Integration', () => {
    test('should handle rapid-fire webhook calls', async () => {
      const webhookUrl = mockServer.getWebhookUrl();
      const reporter = createWebhookReporter(webhookUrl, { retries: 1 });

      errorHandler.addReporter(reporter);

      const promises: Promise<any>[] = [];

      // Send 10 errors rapidly
      for (let i = 0; i < 10; i++) {
        promises.push(errorHandler.handle(new Error(`Rapid error ${i}`), {}));
      }

      const results = await Promise.all(promises);

      // All should succeed
      results.forEach((result) => {
        expect(result.success).toBe(true);
      });

      await sleep(200);

      const serverStats = mockServer.getStats();
      expect(serverStats.requestCount).toBe(10);
    });

    test('should handle large error payloads', async () => {
      const webhookUrl = mockServer.getWebhookUrl();
      const reporter = createWebhookReporter(webhookUrl, { retries: 1 });

      errorHandler.addReporter(reporter);

      // Create large context
      const largeContext = {
        data: 'x'.repeat(10000), // 10KB string
        array: Array(100).fill('item'),
      };

      const result = await errorHandler.handle(new Error('Large payload test'), largeContext);

      expect(result.success).toBe(true);

      await sleep(100);

      const webhookRequests = mockServer.getRequestsByPath('/webhook');
      expect(webhookRequests.length).toBe(1);
    });
  });
});
