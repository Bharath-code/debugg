/**
 * Test Fixtures for Debugg
 * Reusable test data and configurations
 */

import type { ErrorHandlerConfig, ErrorContext, UniversalError } from '../../src/types';
import type { EnhancedErrorHandlerConfig } from '../../src/enhanced';

/**
 * Standard test configurations
 */
export const TEST_CONFIGS = {
  /** Minimal valid configuration */
  MINIMAL: {
    serviceName: 'test-service',
    environment: 'test',
  } as ErrorHandlerConfig,

  /** Full configuration with all options */
  FULL: {
    serviceName: 'test-service-full',
    environment: 'test',
    defaultSeverity: 'medium' as const,
    logToConsole: false,
    includeStackTrace: true,
    maxContextDepth: 3,
    reporters: [],
  } as ErrorHandlerConfig,

  /** Development configuration */
  DEVELOPMENT: {
    serviceName: 'test-app-dev',
    environment: 'development',
    logToConsole: true,
    includeStackTrace: true,
    maxContextDepth: 10,
  } as ErrorHandlerConfig,

  /** Production configuration */
  PRODUCTION: {
    serviceName: 'test-app-prod',
    environment: 'production',
    logToConsole: false,
    includeStackTrace: false,
    maxContextDepth: 3,
  } as ErrorHandlerConfig,

  /** Enhanced configuration */
  ENHANCED: {
    serviceName: 'test-app-enhanced',
    environment: 'test',
    performanceMonitoring: true,
    analytics: true,
    ciIntegration: true,
    autoTrackErrors: true,
  } as EnhancedErrorHandlerConfig,

  /** Security-focused configuration */
  SECURITY: {
    serviceName: 'test-app-secure',
    environment: 'test',
    security: {
      redactFields: ['password', 'token', 'secret', 'apiKey'],
      maxContextSize: 1024 * 1024,
      enableRateLimiting: true,
      maxErrorsPerMinute: 100,
      sanitizeStrings: true,
    },
  } as any,
} as const;

/**
 * Standard test contexts
 */
export const TEST_CONTEXTS = {
  /** Empty context */
  EMPTY: {} as ErrorContext,

  /** Simple context */
  SIMPLE: {
    userId: '123',
    action: 'test_action',
  } as ErrorContext,

  /** Complex nested context */
  COMPLEX: {
    user: {
      id: '123',
      email: 'test@example.com',
      profile: {
        name: 'Test User',
        age: 30,
      },
    },
    request: {
      method: 'POST',
      url: '/api/test',
      headers: {
        'content-type': 'application/json',
      },
    },
    metadata: {
      version: '1.0.0',
      timestamp: new Date().toISOString(),
    },
  } as ErrorContext,

  /** Context with sensitive data */
  SENSITIVE: {
    userId: '123',
    password: 'secret123',
    token: 'abc123xyz',
    apiKey: 'key-12345',
    action: 'login',
  } as ErrorContext,

  /** Large context (for size testing) */
  LARGE: {
    ...Array(100)
      .fill(null)
      .reduce(
        (acc, _, i) => {
          acc[`field_${i}`] = `value_${i}`;
          return acc;
        },
        {} as Record<string, string>
      ),
  } as ErrorContext,

  /** Context with circular reference (for serialization testing) */
  CIRCULAR: (() => {
    const context: any = {
      name: 'circular',
      value: 'test',
    };
    context.self = context;
    return context as ErrorContext;
  })(),
} as const;

/**
 * Standard test errors
 */
export const TEST_ERRORS = {
  /** Basic Error */
  BASIC: new Error('Basic test error'),

  /** TypeError */
  TYPE_ERROR: new TypeError('Type error occurred'),

  /** ReferenceError */
  REFERENCE_ERROR: new ReferenceError('Variable is not defined'),

  /** SyntaxError */
  SYNTAX_ERROR: new SyntaxError('Invalid syntax'),

  /** RangeError */
  RANGE_ERROR: new RangeError('Value out of range'),

  /** Network error */
  NETWORK: Object.assign(new Error('Network error'), { code: 'ECONNREFUSED' }),

  /** HTTP 500 error */
  HTTP_500: Object.assign(new Error('Internal Server Error'), { status: 500 }),

  /** HTTP 404 error */
  HTTP_404: Object.assign(new Error('Not Found'), { status: 404 }),

  /** HTTP 401 error */
  HTTP_401: Object.assign(new Error('Unauthorized'), { status: 401 }),

  /** Custom error */
  CUSTOM: class CustomError extends Error {
    constructor(message: string) {
      super(message);
      this.name = 'CustomError';
    }
  },

  /** Error with stack trace */
  WITH_STACK: (() => {
    const error = new Error('Error with stack');
    Error.captureStackTrace?.(error, TEST_ERRORS.WITH_STACK.constructor);
    return error;
  })(),
} as const;

/**
 * Expected error structures
 */
export const EXPECTED_STRUCTURES = {
  /** Expected UniversalError structure */
  UNIVERSAL_ERROR: {
    name: expect.any(String),
    message: expect.any(String),
    severity: expect.any(String),
    context: expect.any(Object),
    timestamp: expect.any(Date),
    errorId: expect.any(String),
    metadata: expect.any(Object),
  },

  /** Expected metadata structure */
  METADATA: {
    platform: expect.any(String),
    serviceName: expect.any(String),
    environment: expect.any(String),
  },

  /** Expected error ID format */
  ERROR_ID_FORMAT: /^err_[a-z0-9]+_\d+$/,

  /** Expected severity levels */
  SEVERITY_LEVELS: ['critical', 'high', 'medium', 'low', 'info'],
} as const;

/**
 * Mock server configurations
 */
export const MOCK_SERVERS = {
  /** Mock webhook URL (will fail) */
  INVALID_WEBHOOK: 'https://invalid.example.com/webhook',

  /** Mock localhost webhook */
  LOCALHOST_WEBHOOK: 'http://localhost:9999/webhook',

  /** Mock Sentry DSN (invalid) */
  INVALID_SENTRY_DSN: 'https://invalid@sentry.io/123456',

  /** Mock valid-looking DSN */
  VALID_LOOKING_DSN: 'https://abc123@sentry.io/987654',
} as const;

/**
 * Performance test configurations
 */
export const PERFORMANCE_CONFIGS = {
  /** Number of iterations for performance tests */
  ITERATIONS: 1000,

  /** Maximum allowed duration for error creation (ms) */
  MAX_ERROR_CREATION_MS: 100,

  /** Maximum allowed duration for error handling (ms) */
  MAX_ERROR_HANDLING_MS: 500,

  /** Number of concurrent errors for stress test */
  CONCURRENT_ERRORS: 100,

  /** Memory limit for memory tests (MB) */
  MEMORY_LIMIT_MB: 100,
} as const;

/**
 * Timeout configurations
 */
export const TIMEOUT_CONFIGS = {
  /** Default test timeout */
  DEFAULT: 5000,

  /** Timeout for integration tests */
  INTEGRATION: 10000,

  /** Timeout for E2E tests */
  E2E: 30000,

  /** Timeout for performance tests */
  PERFORMANCE: 60000,
} as const;

/**
 * Sample data for testing
 */
export const SAMPLE_DATA = {
  /** Sample user data */
  USER: {
    id: 'user_123',
    email: 'user@example.com',
    name: 'John Doe',
  },

  /** Sample request data */
  REQUEST: {
    method: 'POST',
    url: '/api/users',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': 'Bearer token123',
    },
    body: {
      name: 'John Doe',
      email: 'user@example.com',
    },
  },

  /** Sample response data */
  RESPONSE: {
    status: 200,
    data: {
      id: 'user_123',
      name: 'John Doe',
      email: 'user@example.com',
    },
  },
} as const;
