/**
 * Test Utilities for Debugg
 * Common helpers and utilities for testing
 */

import { expect, mock, spyOn } from 'bun:test';

/**
 * Wait for a specified number of milliseconds
 */
export const sleep = (ms: number): Promise<void> => {
  return new Promise((resolve) => setTimeout(resolve, ms));
};

/**
 * Create a mock error reporter
 */
export const createMockReporter = () => {
  return mock(async (_error: any) => {
    // Mock implementation
  });
};

/**
 * Create a mock error reporter that fails
 */
export const createFailingReporter = () => {
  return mock(async (_error: any) => {
    throw new Error('Reporter failed intentionally');
  });
};

/**
 * Create a mock error reporter that tracks calls
 */
export const createTrackingReporter = () => {
  const calls: any[] = [];

  const reporter = mock(async (error: any) => {
    calls.push(error);
  });

  reporter.getCalls = () => [...calls];
  reporter.getCallCount = () => calls.length;
  reporter.clearCalls = () => {
    calls.length = 0;
  };

  return reporter;
};

/**
 * Create a test error with custom properties
 */
export const createTestError = (overrides: Partial<Error> = {}): Error => {
  const error = new Error(overrides.message ?? 'Test error');
  if (overrides.name) error.name = overrides.name;
  if (overrides.stack) error.stack = overrides.stack;
  return error;
};

/**
 * Create a network error for testing
 */
export const createNetworkError = (): Error & { code: string } => {
  const error = new Error('Network error') as Error & { code: string };
  error.code = 'ECONNREFUSED';
  return error;
};

/**
 * Create an HTTP error for testing
 */
export const createHttpError = (status: number): Error & { status: number } => {
  const error = new Error(`HTTP ${status}`) as Error & { status: number };
  error.status = status;
  return error;
};

/**
 * Mock console methods
 */
export const mockConsole = () => {
  const consoleSpy = {
    log: spyOn(console, 'log').mockImplementation(() => {}),
    error: spyOn(console, 'error').mockImplementation(() => {}),
    warn: spyOn(console, 'warn').mockImplementation(() => {}),
    info: spyOn(console, 'info').mockImplementation(() => {}),
    groupCollapsed: spyOn(console, 'groupCollapsed').mockImplementation(() => {}),
    groupEnd: spyOn(console, 'groupEnd').mockImplementation(() => {}),
  };

  consoleSpy.restore = () => {
    consoleSpy.log.mockRestore();
    consoleSpy.error.mockRestore();
    consoleSpy.warn.mockRestore();
    consoleSpy.info.mockRestore();
    consoleSpy.groupCollapsed.mockRestore();
    consoleSpy.groupEnd.mockRestore();
  };

  return consoleSpy;
};

/**
 * Mock localStorage
 */
export const mockLocalStorage = () => {
  const store: Record<string, string> = {};

  const localStorage = {
    getItem: mock((key: string) => store[key] ?? null),
    setItem: mock((key: string, value: string) => {
      store[key] = value;
    }),
    removeItem: mock((key: string) => {
      delete store[key];
    }),
    clear: mock(() => {
      Object.keys(store).forEach((key) => delete store[key]);
    }),
    get length() {
      return Object.keys(store).length;
    },
    key: mock((index: number) => Object.keys(store)[index] ?? null),
  };

  return {
    localStorage,
    getItem: (key: string) => store[key],
    getAll: () => ({ ...store }),
    clear: () => {
      Object.keys(store).forEach((key) => delete store[key]);
    },
  };
};

/**
 * Measure execution time
 */
export const measureTime = async <T>(fn: () => Promise<T>): Promise<{ result: T; duration: number }> => {
  const start = performance.now();
  const result = await fn();
  const duration = performance.now() - start;
  return { result, duration };
};

/**
 * Retry a function multiple times
 */
export const retry = async <T>(
  fn: () => Promise<T>,
  options: { maxRetries?: number; delay?: number } = {}
): Promise<T> => {
  const { maxRetries = 3, delay = 100 } = options;

  let lastError: Error | null = null;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error as Error;
      if (attempt < maxRetries) {
        await sleep(delay * attempt); // Exponential backoff
      }
    }
  }

  throw lastError;
};

/**
 * Suppress console output during test
 */
export const suppressConsole = (fn: () => void | Promise<void>) => {
  const originalConsole = {
    log: console.log,
    error: console.error,
    warn: console.warn,
    info: console.info,
  };

  console.log = () => {};
  console.error = () => {};
  console.warn = () => {};
  console.info = () => {};

  const restore = () => {
    console.log = originalConsole.log;
    console.error = originalConsole.error;
    console.warn = originalConsole.warn;
    console.info = originalConsole.info;
  };

  const result = fn();

  if (result instanceof Promise) {
    return result.finally(restore);
  } else {
    restore();
    return result;
  }
};

/**
 * Create a test context
 */
export const createTestContext = (overrides: Record<string, unknown> = {}): Record<string, unknown> => {
  return {
    testId: `test_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
    timestamp: new Date().toISOString(),
    ...overrides,
  };
};

/**
 * Generate unique test ID
 */
export const generateTestId = (): string => {
  return `test_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
};

/**
 * Wait for condition to be true
 */
export const waitFor = async (
  condition: () => boolean | Promise<boolean>,
  options: { timeout?: number; interval?: number } = {}
): Promise<void> => {
  const { timeout = 5000, interval = 50 } = options;
  const startTime = Date.now();

  while (true) {
    const result = await condition();
    if (result) {
      return;
    }

    if (Date.now() - startTime > timeout) {
      throw new Error(`waitFor timeout after ${timeout}ms`);
    }

    await sleep(interval);
  }
};

/**
 * Create a promise that resolves after a delay
 */
export const delayedResolve = <T>(value: T, delay: number): Promise<T> => {
  return new Promise((resolve) => {
    setTimeout(() => resolve(value), delay);
  });
};

/**
 * Create a promise that rejects after a delay
 */
export const delayedReject = (reason: unknown, delay: number): Promise<never> => {
  return new Promise((_, reject) => {
    setTimeout(() => reject(reason), delay);
  });
};
