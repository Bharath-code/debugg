/**
 * E2E Tests for Debugg with Express
 * Tests real-world Express application integration
 */

import { describe, test, expect, beforeEach, afterEach } from 'bun:test';
import { ErrorHandler } from '../../src/core/ErrorHandler';
import { createExpressErrorHandler, asyncHandler } from '../../src/middleware/express';
import { createConsoleReporter } from '../../src/reporters/ConsoleReporter';
import { mockConsole, sleep } from '../../tests/utils/test-utils';

// Mock Express types for testing
interface MockRequest {
  method: string;
  path: string;
  headers: Record<string, string>;
  query: Record<string, string>;
  body: any;
  ip: string;
  get: (header: string) => string | undefined;
}

interface MockResponse {
  status: (code: number) => MockResponse;
  json: (data: any) => MockResponse;
  statusCode: number;
  jsonData: any;
}

interface MockNextFunction {
  (error?: Error): void;
  calledWith?: Error;
}

describe('Express Integration E2E Tests', () => {
  let errorHandler: ErrorHandler;
  let consoleSpy: ReturnType<typeof mockConsole>;
  let mockRes: MockResponse;
  let mockNext: MockNextFunction;

  beforeEach(() => {
    consoleSpy = mockConsole();

    errorHandler = new ErrorHandler({
      serviceName: 'express-test-app',
      environment: 'test',
      logToConsole: false,
    });

    errorHandler.addReporter(createConsoleReporter({ useGroups: false }));

    mockRes = {
      statusCode: 200,
      jsonData: null,
      status: function (code: number) {
        this.statusCode = code;
        return this;
      },
      json: function (data: any) {
        this.jsonData = data;
        return this;
      },
    };

    mockNext = function (error?: Error) {
      mockNext.calledWith = error;
    };
  });

  afterEach(() => {
    consoleSpy.restore();
  });

  /**
   * Create a mock Express request
   */
  const createMockRequest = (overrides: Partial<MockRequest> = {}): MockRequest => {
    return {
      method: 'GET',
      path: '/test',
      headers: {
        'content-type': 'application/json',
        'user-agent': 'TestAgent/1.0',
      },
      query: {},
      body: null,
      ip: '127.0.0.1',
      get: (header: string) => {
        return overrides.headers?.[header.toLowerCase() as keyof typeof overrides.headers] as string;
      },
      ...overrides,
    };
  };

  describe('Express Error Handler Middleware', () => {
    test('should handle error and send response', async () => {
      const middleware = createExpressErrorHandler(errorHandler, {
        sendErrorResponse: true,
        logErrors: true,
      });

      const mockReq = createMockRequest();
      const testError = new Error('Test middleware error');

      middleware(testError, mockReq, mockRes, mockNext);

      // Wait for async error handling
      await sleep(50);

      expect(mockRes.statusCode).toBe(500);
      expect(mockRes.jsonData).toHaveProperty('error', 'Error');
      expect(mockRes.jsonData).toHaveProperty('message', 'Test middleware error');
    });

    test('should include request details in error context', async () => {
      const middleware = createExpressErrorHandler(errorHandler, {
        includeRequestDetails: true,
        sendErrorResponse: false,
      });

      const mockReq = createMockRequest({
        method: 'POST',
        path: '/api/users',
        headers: {
          'content-type': 'application/json',
          'user-agent': 'TestClient/1.0',
        },
        body: { name: 'John' },
        query: { include: 'profile' },
      });

      const testError = new Error('Request error');

      middleware(testError, mockReq, mockRes, mockNext);

      await sleep(50);

      // Get stored errors
      const storage = errorHandler.getStorage();
      const errors = storage.getAllErrors();
      const lastError = errors[errors.length - 1];

      expect(lastError.context).toHaveProperty('method', 'POST');
      expect(lastError.context).toHaveProperty('endpoint', '/api/users');
      expect(lastError.context).toHaveProperty('body');
    });

    test('should use custom context builder', async () => {
      const middleware = createExpressErrorHandler(errorHandler, {
        buildContext: (req, error) => ({
          custom: true,
          path: req.path,
          errorMessage: error.message,
        }),
        sendErrorResponse: false,
      });

      const mockReq = createMockRequest({ path: '/custom' });
      const testError = new Error('Custom context error');

      middleware(testError, mockReq, mockRes, mockNext);

      await sleep(50);

      const storage = errorHandler.getStorage();
      const errors = storage.getAllErrors();
      const lastError = errors[errors.length - 1];

      expect(lastError.context).toHaveProperty('custom', true);
      expect(lastError.context).toHaveProperty('path', '/custom');
    });

    test('should not send error response in production', async () => {
      process.env.NODE_ENV = 'production';

      const middleware = createExpressErrorHandler(errorHandler, {
        sendErrorResponse: true,
      });

      const mockReq = createMockRequest();
      const testError = new Error('Production error');

      middleware(testError, mockReq, mockRes, mockNext);

      expect(mockRes.statusCode).toBe(500);
      expect(mockRes.jsonData.message).toBe('Internal server error');

      process.env.NODE_ENV = 'test';
    });

    test('should handle validation errors', async () => {
      const middleware = createExpressErrorHandler(errorHandler);

      const mockReq = createMockRequest();
      const validationError = new Error('Validation failed');
      (validationError as any).status = 400;

      middleware(validationError, mockReq, mockRes, mockNext);

      expect(mockRes.statusCode).toBe(500);
    });
  });

  describe('Async Handler Wrapper', () => {
    test('should catch and forward async errors', async () => {
      const mockNext = function (error?: Error) {
        mockNext.calledWith = error;
      };

      const asyncRoute = asyncHandler(async (req: MockRequest, res: MockResponse, next) => {
        throw new Error('Async route error');
      });

      const mockReq = createMockRequest();

      asyncRoute(mockReq, mockRes, mockNext);

      // Wait for promise resolution
      await sleep(50);

      expect(mockNext.calledWith).toBeDefined();
      expect(mockNext.calledWith?.message).toBe('Async route error');
    });

    test('should handle successful async routes', async () => {
      const mockNext = function (error?: Error) {
        mockNext.calledWith = error;
      };

      const asyncRoute = asyncHandler(async (req: MockRequest, res: MockResponse, next) => {
        res.status(200).json({ success: true });
      });

      const mockReq = createMockRequest();

      asyncRoute(mockReq, mockRes, mockNext);

      await sleep(50);

      expect(mockRes.statusCode).toBe(200);
      expect(mockRes.jsonData).toEqual({ success: true });
      expect(mockNext.calledWith).toBeUndefined();
    });
  });

  describe('Real Express Application Flow', () => {
    test('should handle complete request-error cycle', async () => {
      // Simulate a complete Express app flow
      const middleware = createExpressErrorHandler(errorHandler, {
        includeRequestDetails: true,
      });

      // Simulate request
      const mockReq = createMockRequest({
        method: 'POST',
        path: '/api/data',
        body: { invalid: 'data' },
      });

      // Simulate error in route handler
      const routeError = new Error('Invalid data format');

      middleware(routeError, mockReq, mockRes, mockNext);

      await sleep(50);

      // Verify error was handled
      const stats = errorHandler.getStats();
      expect(stats.storage.total).toBeGreaterThan(0);

      // Verify response was sent
      expect(mockRes.statusCode).toBe(500);
    });

    test('should handle multiple concurrent errors', async () => {
      const middleware = createExpressErrorHandler(errorHandler);

      const promises: Promise<void>[] = [];

      // Simulate 10 concurrent errors
      for (let i = 0; i < 10; i++) {
        const mockReq = createMockRequest({ path: `/route/${i}` });
        const error = new Error(`Concurrent error ${i}`);

        const promise = new Promise<void>((resolve) => {
          middleware(error, mockReq, mockRes, mockNext);
          setTimeout(resolve, 10);
        });

        promises.push(promise);
      }

      await Promise.all(promises);
      await sleep(100);

      const stats = errorHandler.getStats();
      expect(stats.storage.total).toBe(10);
    });
  });

  describe('Express Error Scenarios', () => {
    test('should handle JSON parse errors', async () => {
      const middleware = createExpressErrorHandler(errorHandler);

      const mockReq = createMockRequest({
        path: '/api/json',
        body: 'invalid-json',
      });

      const jsonError = new SyntaxError('Unexpected token in JSON');

      middleware(jsonError, mockReq, mockRes, mockNext);

      await sleep(50);

      expect(mockRes.statusCode).toBe(500);

      const storage = errorHandler.getStorage();
      const errors = storage.getAllErrors();
      const lastError = errors[errors.length - 1];

      expect(lastError.name).toBe('SyntaxError');
    });

    test('should handle authorization errors', async () => {
      const middleware = createExpressErrorHandler(errorHandler);

      const mockReq = createMockRequest({
        path: '/api/protected',
        headers: { authorization: 'Bearer invalid-token' },
      });

      const authError = new Error('Unauthorized');
      (authError as any).status = 401;

      middleware(authError, mockReq, mockRes, mockNext);

      expect(mockRes.statusCode).toBe(500);
    });

    test('should handle not found errors', async () => {
      const middleware = createExpressErrorHandler(errorHandler);

      const mockReq = createMockRequest({
        path: '/api/nonexistent',
      });

      const notFoundError = new Error('Not Found');
      (notFoundError as any).status = 404;

      middleware(notFoundError, mockReq, mockRes, mockNext);

      expect(mockRes.statusCode).toBe(500);
    });
  });
});
