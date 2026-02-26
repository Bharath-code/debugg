/**
 * ErrorBuilder - Constructs UniversalError objects
 * Follows Builder pattern for clean error construction
 */

import { UniversalError, ErrorContext, ErrorSeverity, Platform } from '../types';
import { generateErrorId, limitContextDepth, redactSensitiveFields } from '../utils/format';
import { classifyError } from '../utils/classify';
import { getPlatformMetadata } from '../utils/platform';

export interface ErrorBuilderConfig {
  serviceName: string;
  environment: string;
  includeStackTrace: boolean;
  maxContextDepth: number;
  redactFields?: string[];
}

export class ErrorBuilder {
  private name = 'Error';
  private message = '';
  private stack?: string;
  private severity: ErrorSeverity = 'medium';
  private context: ErrorContext = {};
  private originalError?: Error;
  private platform: Platform = 'unknown';
  private metadata: Record<string, unknown> = {};

  constructor(private config: ErrorBuilderConfig) {}

  /**
   * Set the error from any input
   */
  fromError(error: unknown): ErrorBuilder {
    if (error instanceof Error) {
      this.name = error.name;
      this.message = error.message;
      this.stack = this.config.includeStackTrace ? error.stack : undefined;
      this.originalError = error;
    } else if (error && typeof error === 'object') {
      const err = error as Record<string, unknown>;
      this.name = String(err.name ?? 'Error');
      this.message = String(err.message ?? '');
      this.stack = this.config.includeStackTrace && err.stack ? String(err.stack) : undefined;
    } else {
      this.message = String(error);
    }

    return this;
  }

  /**
   * Set severity level
   */
  withSeverity(severity: ErrorSeverity): ErrorBuilder {
    this.severity = severity;
    return this;
  }

  /**
   * Auto-classify severity based on error type
   */
  withAutoSeverity(): ErrorBuilder {
    if (this.originalError) {
      this.severity = classifyError(this.originalError);
    }
    return this;
  }

  /**
   * Add context data
   */
  withContext(context: ErrorContext): ErrorBuilder {
    this.context = context;
    return this;
  }

  /**
   * Add metadata
   */
  withMetadata(metadata: Record<string, unknown>): ErrorBuilder {
    this.metadata = { ...this.metadata, ...metadata };
    return this;
  }

  /**
   * Set platform
   */
  withPlatform(platform: Platform): ErrorBuilder {
    this.platform = platform;
    return this;
  }

  /**
   * Auto-detect and set platform
   */
  withAutoPlatform(): ErrorBuilder {
    this.platform = getPlatformMetadata(this.platform) ? this.platform : 'unknown';
    return this;
  }

  /**
   * Build the UniversalError object
   */
  build(): UniversalError {
    const timestamp = new Date();
    const errorId = generateErrorId();

    // Limit context depth and redact sensitive fields
    const limitedContext = limitContextDepth(this.context, this.config.maxContextDepth);
    const safeContext = redactSensitiveFields(limitedContext, this.config.redactFields);

    // Get platform-specific metadata
    const platformMetadata = getPlatformMetadata(this.platform);

    const universalError: UniversalError = {
      name: this.name,
      message: this.message,
      stack: this.stack,
      severity: this.severity,
      context: safeContext,
      timestamp,
      errorId,
      originalError: this.originalError,
      metadata: {
        platform: this.platform,
        serviceName: this.config.serviceName,
        environment: this.config.environment,
        ...platformMetadata,
        ...this.metadata,
      },
    };

    return universalError;
  }
}
