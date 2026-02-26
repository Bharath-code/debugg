/**
 * Security Manager - Handles security-related features
 * Including field redaction, rate limiting, and size validation
 */

import { ErrorContext } from '../types';
import { DEFAULTS } from '../constants/defaults';

export interface SecurityConfig {
  /** Fields to redact from error context */
  redactFields: readonly string[];
  /** Maximum context size in bytes */
  maxContextSize: number;
  /** Whether to enable rate limiting */
  enableRateLimiting: boolean;
  /** Maximum errors per minute */
  maxErrorsPerMinute: number;
  /** Whether to sanitize strings */
  sanitizeStrings: boolean;
}

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetAt: Date;
  retryAfter?: number;
}

export class SecurityManager {
  private config: SecurityConfig;
  private errorTimestamps: number[] = [];
  private lastCleanup: number = Date.now();

  constructor(config: Partial<SecurityConfig> = {}) {
    this.config = {
      redactFields: config.redactFields ?? [...DEFAULTS.DEFAULT_REDACT_FIELDS],
      maxContextSize: config.maxContextSize ?? DEFAULTS.MAX_CONTEXT_SIZE_BYTES,
      enableRateLimiting: config.enableRateLimiting ?? false,
      maxErrorsPerMinute: config.maxErrorsPerMinute ?? DEFAULTS.DEFAULT_MAX_ERRORS_PER_MINUTE,
      sanitizeStrings: config.sanitizeStrings ?? false,
    };
  }

  /**
   * Update security configuration
   */
  updateConfig(config: Partial<SecurityConfig>): void {
    this.config = { ...this.config, ...config };
  }

  /**
   * Get current configuration
   */
  getConfig(): Readonly<SecurityConfig> {
    return { ...this.config };
  }

  /**
   * Redact sensitive fields from context
   */
  redactContext(context: ErrorContext): ErrorContext {
    if (!context || typeof context !== 'object') {
      return context;
    }

    const redacted = { ...context };

    for (const field of this.config.redactFields) {
      if (field in redacted) {
        const value = redacted[field];

        // Redact based on type
        if (typeof value === 'string') {
          redacted[field] = this.createRedactedString(String(value));
        } else if (typeof value === 'object' && value !== null) {
          redacted[field] = '[REDACTED_OBJECT]';
        } else {
          redacted[field] = '[REDACTED]';
        }
      }
    }

    return redacted;
  }

  /**
   * Create redacted string showing partial info
   */
  private createRedactedString(value: string): string {
    if (value.length === 0) return '[REDACTED]';

    // Show first and last character for debugging
    if (value.length <= 4) {
      return '*'.repeat(value.length);
    }

    return value.charAt(0) + '*'.repeat(value.length - 2) + value.charAt(value.length - 1);
  }

  /**
   * Check rate limit
   */
  checkRateLimit(): RateLimitResult {
    if (!this.config.enableRateLimiting) {
      return {
        allowed: true,
        remaining: Infinity,
        resetAt: new Date(Date.now() + 60000),
      };
    }

    const now = Date.now();
    const oneMinuteAgo = now - 60000;

    // Clean old timestamps
    if (now - this.lastCleanup > 10000) {
      this.errorTimestamps = this.errorTimestamps.filter((ts) => ts > oneMinuteAgo);
      this.lastCleanup = now;
    }

    const currentCount = this.errorTimestamps.length;
    const remaining = Math.max(0, this.config.maxErrorsPerMinute - currentCount);
    const allowed = currentCount < this.config.maxErrorsPerMinute;

    // Calculate reset time
    const oldestTimestamp = this.errorTimestamps[0] ?? now;
    const resetAt = new Date(oldestTimestamp + 60000);

    const result: RateLimitResult = {
      allowed,
      remaining,
      resetAt,
    };

    if (!allowed) {
      result.retryAfter = Math.ceil((resetAt.getTime() - now) / 1000);
    }

    return result;
  }

  /**
   * Record an error for rate limiting
   */
  recordError(): void {
    this.errorTimestamps.push(Date.now());

    // Cleanup if too many timestamps
    if (this.errorTimestamps.length > this.config.maxErrorsPerMinute * 2) {
      const oneMinuteAgo = Date.now() - 60000;
      this.errorTimestamps = this.errorTimestamps.filter((ts) => ts > oneMinuteAgo);
    }
  }

  /**
   * Validate context size
   */
  validateContextSize(context: ErrorContext): { valid: boolean; size: number; message?: string } {
    const size = this.estimateContextSize(context);

    if (size > this.config.maxContextSize) {
      return {
        valid: false,
        size,
        message: `Context size (${size} bytes) exceeds maximum (${this.config.maxContextSize} bytes)`,
      };
    }

    return {
      valid: true,
      size,
    };
  }

  /**
   * Estimate context size in bytes
   */
  private estimateContextSize(context: ErrorContext): number {
    try {
      return new TextEncoder().encode(JSON.stringify(context)).length;
    } catch {
      // Fallback for circular references
      return String(context).length;
    }
  }

  /**
   * Truncate context if too large
   */
  truncateContext(context: ErrorContext): ErrorContext {
    const validation = this.validateContextSize(context);

    if (validation.valid) {
      return context;
    }

    // Recursively truncate until within limit
    return this.truncateContextRecursive(context, this.config.maxContextSize);
  }

  /**
   * Recursively truncate context
   */
  private truncateContextRecursive(context: ErrorContext, maxSize: number, depth = 0): ErrorContext {
    if (depth > 10) {
      return { _truncated: true, _reason: 'max_depth_exceeded' };
    }

    const current = this.truncateContextRecursive(context, maxSize);
    const validation = this.validateContextSize(current);

    if (validation.valid) {
      return current;
    }

    // Remove least important fields
    const truncated = { ...current };
    const keys = Object.keys(truncated);

    if (keys.length > 0) {
      // Remove the last key (assumed least important)
      const keyToRemove = keys[keys.length - 1];
      if (keyToRemove) {
        delete truncated[keyToRemove];
      }
      return this.truncateContextRecursive(truncated, maxSize, depth + 1);
    }

    return { _truncated: true, _reason: 'size_limit' };
  }

  /**
   * Sanitize string values in context
   */
  sanitizeContext(context: ErrorContext): ErrorContext {
    if (!this.config.sanitizeStrings) {
      return context;
    }

    const sanitized: ErrorContext = {};

    for (const [key, value] of Object.entries(context)) {
      if (typeof value === 'string') {
        sanitized[key] = this.sanitizeString(value);
      } else if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
        sanitized[key] = this.sanitizeContext(value as ErrorContext);
      } else {
        sanitized[key] = value;
      }
    }

    return sanitized;
  }

  /**
   * Sanitize a string value
   */
  private sanitizeString(value: string): string {
    if (!value || typeof value !== 'string') {
      return String(value ?? '');
    }

    // Remove potential XSS patterns
    return value
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '[SCRIPT_REMOVED]')
      .replace(/<[^>]*>/g, '')
      .replace(/javascript:/gi, '')
      .replace(/on\w+\s*=/gi, '')
      .trim()
      .substring(0, 10000); // Max string length
  }

  /**
   * Get rate limit statistics
   */
  getStatistics(): SecurityStatistics {
    const now = Date.now();
    const oneMinuteAgo = now - 60000;

    const recentErrors = this.errorTimestamps.filter((ts) => ts > oneMinuteAgo);

    return {
      errorsInLastMinute: recentErrors.length,
      limit: this.config.maxErrorsPerMinute,
      remaining: Math.max(0, this.config.maxErrorsPerMinute - recentErrors.length),
      rateLimitEnabled: this.config.enableRateLimiting,
      redactedFieldsCount: this.config.redactFields.length,
    };
  }

  /**
   * Reset rate limit tracking
   */
  resetRateLimit(): void {
    this.errorTimestamps = [];
  }
}

export interface SecurityStatistics {
  errorsInLastMinute: number;
  limit: number;
  remaining: number;
  rateLimitEnabled: boolean;
  redactedFieldsCount: number;
}
