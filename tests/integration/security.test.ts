/**
 * Security Tests for Debugg
 * Tests for field redaction, rate limiting, XSS prevention, etc.
 */

import { describe, test, expect, beforeEach } from 'bun:test';
import { ErrorHandler } from '../../src/core/ErrorHandler';
import { SecurityManager } from '../../src/core/SecurityManager';
import { createTestContext, mockConsole } from '../../tests/utils/test-utils';

describe('Security Tests', () => {
  describe('Field Redaction', () => {
    test('should redact configured sensitive fields', async () => {
      const handler = new ErrorHandler({
        serviceName: 'security-test',
        environment: 'test',
        logToConsole: false,
        security: {
          redactFields: ['password', 'token', 'apiKey'],
        },
      });

      const error = await handler.handle(new Error('Test error'), {
        userId: '123',
        password: 'secret123',
        token: 'abc123',
        apiKey: 'key-12345',
      });

      const storage = handler.getStorage();
      const errors = storage.getAllErrors();
      const lastError = errors[errors.length - 1];

      expect(lastError.context.password).toBe('[REDACTED]');
      expect(lastError.context.token).toBe('[REDACTED]');
      expect(lastError.context.apiKey).toBe('[REDACTED]');
      expect(lastError.context.userId).toBe('123'); // Not redacted
    });

    test('should partially redact string values', async () => {
      const securityManager = new SecurityManager({
        redactFields: ['password'],
      });

      const context = {
        password: 'secret',
      };

      const redacted = securityManager.redactContext(context);

      // Should show first and last character
      expect(redacted.password).toMatch(/^s.*t$/);
    });

    test('should redact nested sensitive fields', () => {
      const securityManager = new SecurityManager({
        redactFields: ['password', 'token'],
      });

      const context = {
        password: 'secret',
        name: 'John',
      };

      const redacted = securityManager.redactContext(context);

      expect(redacted.password).toBe('[REDACTED]');
      expect(redacted.name).toBe('John');
    });

    test('should handle object values in redacted fields', () => {
      const securityManager = new SecurityManager({
        redactFields: ['credentials'],
      });

      const context = {
        credentials: {
          username: 'admin',
          password: 'secret',
        },
      };

      const redacted = securityManager.redactContext(context);

      expect(redacted.credentials).toBe('[REDACTED_OBJECT]');
    });
  });

  describe('Rate Limiting', () => {
    test('should allow errors within rate limit', () => {
      const securityManager = new SecurityManager({
        enableRateLimiting: true,
        maxErrorsPerMinute: 10,
      });

      // First 10 errors should be allowed
      for (let i = 0; i < 10; i++) {
        const result = securityManager.checkRateLimit();
        expect(result.allowed).toBe(true);
        securityManager.recordError();
      }
    });

    test('should block errors exceeding rate limit', () => {
      const securityManager = new SecurityManager({
        enableRateLimiting: true,
        maxErrorsPerMinute: 5,
      });

      // Exceed rate limit
      for (let i = 0; i < 5; i++) {
        securityManager.recordError();
      }

      const result = securityManager.checkRateLimit();

      expect(result.allowed).toBe(false);
      expect(result.remaining).toBe(0);
      expect(result.retryAfter).toBeGreaterThan(0);
    });

    test('should track rate limit statistics', () => {
      const securityManager = new SecurityManager({
        enableRateLimiting: true,
        maxErrorsPerMinute: 100,
      });

      // Record some errors
      for (let i = 0; i < 10; i++) {
        securityManager.recordError();
      }

      const stats = securityManager.getStatistics();

      expect(stats.errorsInLastMinute).toBe(10);
      expect(stats.limit).toBe(100);
      expect(stats.remaining).toBe(90);
    });

    test('should be disabled by default', () => {
      const securityManager = new SecurityManager();

      for (let i = 0; i < 1000; i++) {
        securityManager.recordError();
      }

      const result = securityManager.checkRateLimit();
      expect(result.allowed).toBe(true);
      expect(result.remaining).toBe(Infinity);
    });
  });

  describe('Context Size Validation', () => {
    test('should validate context size', () => {
      const securityManager = new SecurityManager({
        maxContextSize: 1024, // 1KB
      });

      const smallContext = { data: 'x'.repeat(100) };
      const largeContext = { data: 'x'.repeat(2000) };

      expect(securityManager.validateContextSize(smallContext).valid).toBe(true);
      expect(securityManager.validateContextSize(largeContext).valid).toBe(false);
    });

    test('should truncate large context', () => {
      const securityManager = new SecurityManager({
        maxContextSize: 500,
      });

      const largeContext = {
        field1: 'x'.repeat(200),
        field2: 'x'.repeat(200),
        field3: 'x'.repeat(200),
      };

      const truncated = securityManager.truncateContext(largeContext);

      const size = new TextEncoder().encode(JSON.stringify(truncated)).length;
      expect(size).toBeLessThanOrEqual(500);
    });
  });

  describe('XSS Prevention', () => {
    test('should sanitize script tags', () => {
      const securityManager = new SecurityManager({
        sanitizeStrings: true,
      });

      const context = {
        userInput: '<script>alert("XSS")</script>',
      };

      const sanitized = securityManager.sanitizeContext(context);

      expect(sanitized.userInput).toContain('[SCRIPT_REMOVED]');
    });

    test('should sanitize HTML tags', () => {
      const securityManager = new SecurityManager({
        sanitizeStrings: true,
      });

      const context = {
        userInput: '<div onclick="alert(1)">Click me</div>',
      };

      const sanitized = securityManager.sanitizeContext(context);

      expect(sanitized.userInput).not.toContain('<div>');
      expect(sanitized.userInput).not.toContain('onclick');
    });

    test('should sanitize javascript: protocol', () => {
      const securityManager = new SecurityManager({
        sanitizeStrings: true,
      });

      const context = {
        url: 'javascript:alert(1)',
      };

      const sanitized = securityManager.sanitizeContext(context);

      expect(sanitized.url).not.toContain('javascript:');
    });

    test('should sanitize event handlers', () => {
      const securityManager = new SecurityManager({
        sanitizeStrings: true,
      });

      const context = {
        html: '<img src="x" onerror="alert(1)">',
      };

      const sanitized = securityManager.sanitizeContext(context);

      expect(sanitized.html).not.toContain('onerror');
    });

    test('should be disabled by default', () => {
      const securityManager = new SecurityManager();

      const context = {
        userInput: '<script>alert(1)</script>',
      };

      const sanitized = securityManager.sanitizeContext(context);

      // Should not sanitize by default
      expect(sanitized).toEqual(context);
    });
  });

  describe('Security Configuration', () => {
    test('should update security configuration', () => {
      const handler = new ErrorHandler({
        serviceName: 'security-test',
        environment: 'test',
      });

      handler.updateSecurityConfig({
        redactFields: ['password', 'secret'],
        enableRateLimiting: true,
        maxErrorsPerMinute: 50,
      });

      const stats = handler.getSecurityStats();

      expect(stats.redactedFieldsCount).toBe(2);
      expect(stats.rateLimitEnabled).toBe(true);
    });

    test('should get security statistics', () => {
      const securityManager = new SecurityManager({
        enableRateLimiting: true,
        maxErrorsPerMinute: 100,
        redactFields: ['password', 'token', 'secret'],
      });

      // Record some errors
      for (let i = 0; i < 10; i++) {
        securityManager.recordError();
      }

      const stats = securityManager.getStatistics();

      expect(stats.errorsInLastMinute).toBe(10);
      expect(stats.limit).toBe(100);
      expect(stats.remaining).toBe(90);
      expect(stats.redactedFieldsCount).toBe(3);
    });
  });

  describe('Integration Security Tests', () => {
    test('should handle complete secure error flow', async () => {
      const handler = new ErrorHandler({
        serviceName: 'security-test',
        environment: 'test',
        logToConsole: false,
        security: {
          redactFields: ['password', 'token'],
          maxContextSize: 1024 * 1024,
          enableRateLimiting: true,
          maxErrorsPerMinute: 100,
          sanitizeStrings: true,
        },
      });

      // Try to send error with sensitive data and XSS
      await handler.handle(new Error('Test'), {
        userId: '123',
        password: 'secret123',
        token: 'abc',
        userInput: '<script>alert(1)</script>',
      });

      const storage = handler.getStorage();
      const errors = storage.getAllErrors();
      const lastError = errors[errors.length - 1];

      // Verify redaction
      expect(lastError.context.password).toBe('[REDACTED]');
      expect(lastError.context.token).toBe('[REDACTED]');

      // Verify XSS prevention
      expect(lastError.context.userInput).not.toContain('<script>');
    });

    test('should handle rate limit in error handling', async () => {
      const handler = new ErrorHandler({
        serviceName: 'security-test',
        environment: 'test',
        logToConsole: false,
        security: {
          enableRateLimiting: true,
          maxErrorsPerMinute: 3,
        },
      });

      // Send errors up to limit
      for (let i = 0; i < 3; i++) {
        await handler.handle(new Error(`Error ${i}`), {});
      }

      // Next error should be rate limited
      const result = await handler.handle(new Error('Rate limited'), {});

      expect(result.success).toBe(false);
      expect(result.rateLimitResult?.allowed).toBe(false);
      expect(result.warnings).toContainEqual(expect.stringContaining('Rate limit'));
    });
  });
});
