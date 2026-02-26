/**
 * Default values and constants for Debugg
 */

export const DEFAULTS = {
  // Service configuration
  SERVICE_NAME: 'application',
  ENVIRONMENT: 'development' as const,
  DEFAULT_SEVERITY: 'medium' as const,

  // Error handling
  MAX_CONTEXT_DEPTH: 5,
  MAX_ERRORS: 1000,
  MAX_HISTORY: 10000,

  // Reporter configuration
  MAX_RETRIES: 3,
  MIN_RETRIES: 0,
  MAX_RETRIES_ALLOWED: 10,
  REQUEST_TIMEOUT_MS: 5000,
  MIN_TIMEOUT_MS: 100,
  MAX_TIMEOUT_MS: 60000,

  // Performance monitoring
  SAMPLE_RATE: 1.0,
  MAX_METRICS_HISTORY: 1000,

  // CI Quality Gates
  MAX_CRITICAL_ERRORS: 0,
  MAX_HIGH_ERRORS: 5,
  ERROR_RATE_THRESHOLD: 0.1,
  REGRESSION_THRESHOLD_PERCENT: 20,

  // Storage
  STORAGE_KEY: 'debugg_errors',
  DEFAULT_MAX_STORAGE: 1000,

  // Security
  DEFAULT_REDACT_FIELDS: ['password', 'token', 'secret', 'apiKey', 'api_key', 'authorization', 'cookie'] as const,
  MAX_CONTEXT_SIZE_BYTES: 1024 * 1024, // 1MB
  DEFAULT_MAX_ERRORS_PER_MINUTE: 100,

  // Batching
  BATCH_MAX_SIZE: 10,
  BATCH_FLUSH_INTERVAL_MS: 5000,

  // Debouncing
  DEBOUNCE_INTERVAL_MS: 1000,
  DEBOUNCE_MAX_BUFFERED: 10,

  // Reporter Manager
  REPORTER_MAX_FAILURES: 5,

  // Validation
  MAX_SERVICE_NAME_LENGTH: 100,
  MAX_ENVIRONMENT_LENGTH: 50,
  MIN_CONTEXT_DEPTH: 1,
  MAX_CONTEXT_DEPTH_LIMIT: 20,
} as const;

export const SEVERITY_LEVELS = ['critical', 'high', 'medium', 'low', 'info'] as const;

export const PLATFORMS = ['browser', 'node', 'mobile', 'unknown'] as const;

export const ENVIRONMENTS = ['development', 'staging', 'production', 'test'] as const;

/**
 * Error type classifications
 */
export const ERROR_TYPES = {
  CRITICAL: ['SyntaxError', 'SystemError'],
  HIGH: ['TypeError', 'ReferenceError', 'NetworkError'],
  MEDIUM: ['RangeError', 'URIError'],
  LOW: ['Warning', 'Notice'],
  INFO: ['Log', 'Trace'],
} as const;

/**
 * HTTP status code ranges
 */
export const HTTP_STATUS = {
  CRITICAL: { min: 500, max: 599 },
  HIGH: { min: 500, max: 503 },
  MEDIUM: { min: 400, max: 499 },
  LOW: { min: 300, max: 399 },
} as const;

/**
 * Security patterns for sanitization
 */
export const SECURITY_PATTERNS = {
  SCRIPT_TAG: /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,
  HTML_TAG: /<[^>]*>/g,
  JAVASCRIPT_PROTOCOL: /javascript:/gi,
  EVENT_HANDLER: /on\w+\s*=/gi,
  DATA_URL: /data:/gi,
} as const;
