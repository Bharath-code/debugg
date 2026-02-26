/**
 * ErrorHandler - Core class for error handling
 * Refactored for better Single Responsibility Principle
 * Uses ConfigManager, ReporterManager, and SecurityManager
 */

import { UniversalError, ErrorContext, ErrorSeverity, ErrorHandlerConfig, ErrorReporter } from '../types';
import { ErrorBuilder } from './ErrorBuilder';
import { ErrorClassifier } from './ErrorClassifier';
import { ConfigManager } from './ConfigManager';
import { ReporterManager, DispatchResult } from './ReporterManager';
import { SecurityManager, RateLimitResult } from './SecurityManager';
import { MemoryStorage } from '../storage/MemoryStorage';
import { detectPlatform } from '../utils/platform';
import { formatErrorForConsole } from '../utils/format';
import { DEFAULTS } from '../constants/defaults';

export interface ErrorHandlerOptions extends ErrorHandlerConfig {
  /** Security configuration */
  security?: {
    redactFields?: readonly string[];
    maxContextSize?: number;
    enableRateLimiting?: boolean;
    maxErrorsPerMinute?: number;
    sanitizeStrings?: boolean;
  };
  /** Reporter manager configuration */
  reporterManager?: {
    maxFailures?: number;
    logFailures?: boolean;
  };
}

export interface HandleResult {
  success: boolean;
  errorId: string;
  dispatchResult?: DispatchResult;
  rateLimitResult?: RateLimitResult;
  warnings?: string[];
}

/**
 * ErrorHandler - Main class for handling errors
 *
 * Responsibilities:
 * - Coordinate error creation, classification, and reporting
 * - Manage configuration, security, and reporter subsystems
 * - Provide a simple API for error handling
 */
export class ErrorHandler {
  private configManager: ConfigManager;
  private classifier: ErrorClassifier;
  private reporterManager: ReporterManager;
  private securityManager: SecurityManager;
  private storage: MemoryStorage;

  constructor(config: ErrorHandlerOptions = {}) {
    // Extract security and reporter manager options
    const { security, reporterManager, ...errorHandlerConfig } = config;

    // Initialize configuration manager
    this.configManager = new ConfigManager(errorHandlerConfig);

    // Initialize other managers
    this.classifier = new ErrorClassifier();
    this.reporterManager = new ReporterManager(reporterManager);
    this.securityManager = new SecurityManager(security);
    this.storage = new MemoryStorage(DEFAULTS.MAX_ERRORS);
  }

  /**
   * Create a UniversalError from any input
   *
   * @param error - The error to process (Error, string, object, etc.)
   * @param context - Additional context data
   * @param severity - Optional severity override
   * @returns The created UniversalError
   *
   * @example
   * ```typescript
   * const error = handler.createError(new Error('Something went wrong'), {
   *   userId: '123',
   *   action: 'login'
   * });
   * ```
   */
  public createError(error: unknown, context: ErrorContext = {}, severity?: ErrorSeverity): UniversalError {
    const platform = detectPlatform();

    // Apply security transformations to context
    let safeContext = this.securityManager.redactContext(context);
    safeContext = this.securityManager.truncateContext(safeContext);

    const builder = new ErrorBuilder({
      serviceName: this.configManager.get('serviceName'),
      environment: this.configManager.get('environment'),
      includeStackTrace: this.configManager.get('includeStackTrace'),
      maxContextDepth: this.configManager.get('maxContextDepth'),
      redactFields: this.securityManager.getConfig().redactFields as string[],
    })
      .fromError(error)
      .withContext(safeContext)
      .withPlatform(platform);

    // Use provided severity or auto-classify
    if (severity) {
      builder.withSeverity(severity);
    } else {
      builder.withAutoSeverity();
    }

    const universalError = builder.build();

    // Store the error
    this.storage.storeError(universalError);

    return universalError;
  }

  /**
   * Handle an error with automatic reporting
   *
   * @param error - The error to handle
   * @param context - Additional context data
   * @param severity - Optional severity override
   * @returns HandleResult with status and metadata
   *
   * @example
   * ```typescript
   * try {
   *   await riskyOperation();
   * } catch (error) {
   *   await handler.handle(error, { userId: '123' });
   * }
   * ```
   */
  public async handle(
    error: unknown,
    context: ErrorContext = {},
    severity?: ErrorSeverity
  ): Promise<HandleResult> {
    const warnings: string[] = [];

    // Check rate limit
    const rateLimitResult = this.securityManager.checkRateLimit();
    if (!rateLimitResult.allowed) {
      warnings.push(`Rate limit exceeded. ${rateLimitResult.retryAfter}s until reset.`);

      // Still create error but don't dispatch to reporters
      const universalError = this.createError(error, context, severity);
      this.securityManager.recordError();

      return {
        success: false,
        errorId: universalError.errorId,
        rateLimitResult,
        warnings,
      };
    }

    // Create the error
    const universalError = this.createError(error, context, severity);

    // Record for rate limiting
    this.securityManager.recordError();

    // Log to console if enabled
    if (this.configManager.get('logToConsole')) {
      this.logToConsole(universalError);
    }

    // Dispatch to all reporters
    const dispatchResult = await this.reporterManager.dispatch(universalError);

    // Check for reporter failures
    if (dispatchResult.failures > 0) {
      warnings.push(`${dispatchResult.failures} reporter(s) failed`);
    }

    return {
      success: true,
      errorId: universalError.errorId,
      dispatchResult,
      rateLimitResult,
      warnings,
    };
  }

  /**
   * Add a custom error reporter
   *
   * @param reporter - The reporter function
   * @param id - Optional reporter ID for management
   * @returns The reporter ID
   *
   * @example
   * ```typescript
   * handler.addReporter(createSentryReporter('YOUR_DSN'));
   * ```
   */
  public addReporter(reporter: ErrorReporter, id?: string): string {
    return this.reporterManager.add(reporter, id);
  }

  /**
   * Remove a reporter by ID
   */
  public removeReporter(id: string): boolean {
    return this.reporterManager.remove(id);
  }

  /**
   * Remove all reporters
   */
  public clearReporters(): void {
    this.reporterManager.clear();
  }

  /**
   * Enable a disabled reporter
   */
  public enableReporter(id: string): boolean {
    return this.reporterManager.enable(id);
  }

  /**
   * Disable a reporter temporarily
   */
  public disableReporter(id: string): boolean {
    return this.reporterManager.disable(id);
  }

  /**
   * Get current configuration
   */
  public getConfig(): Readonly<ErrorHandlerConfig> {
    return this.configManager.getConfig();
  }

  /**
   * Update configuration
   */
  public updateConfig(newConfig: ErrorHandlerConfig): void {
    this.configManager.updateConfig(newConfig);
  }

  /**
   * Update security configuration
   */
  public updateSecurityConfig(config: Parameters<SecurityManager['updateConfig']>[0]): void {
    this.securityManager.updateConfig(config);
  }

  /**
   * Access storage system
   */
  public getStorage(): MemoryStorage {
    return this.storage;
  }

  /**
   * Get error classifier
   */
  public getClassifier(): ErrorClassifier {
    return this.classifier;
  }

  /**
   * Get reporter manager statistics
   */
  public getReporterStats() {
    return this.reporterManager.getStatistics();
  }

  /**
   * Get security statistics
   */
  public getSecurityStats() {
    return this.securityManager.getStatistics();
  }

  /**
   * Get comprehensive handler statistics
   */
  public getStats(): HandlerStatistics {
    const storageStats = this.storage.getStatistics();
    const reporterStats = this.reporterManager.getStatistics();
    const securityStats = this.securityManager.getStatistics();

    return {
      storage: storageStats,
      reporters: reporterStats,
      security: securityStats,
      config: {
        serviceName: this.configManager.get('serviceName'),
        environment: this.configManager.get('environment'),
        defaultSeverity: this.configManager.get('defaultSeverity'),
      },
    };
  }

  /**
   * Reset rate limiting
   */
  public resetRateLimit(): void {
    this.securityManager.resetRateLimit();
  }

  /**
   * Log error to console with formatting
   */
  private logToConsole(error: UniversalError): void {
    const formatted = formatErrorForConsole(error);

    if (typeof console.groupCollapsed === 'function') {
      console.groupCollapsed(formatted);
      console.log('Service:', error.metadata.serviceName);
      console.log('Environment:', error.metadata.environment);
      console.log('Platform:', error.metadata.platform);

      if (Object.keys(error.context).length > 0) {
        console.log('Context:', error.context);
      }

      if (error.stack) {
        console.log('Stack:', error.stack);
      }

      if (error.originalError) {
        console.log('Original Error:', error.originalError);
      }

      console.groupEnd();
    } else {
      console.error(formatted);
    }
  }
}

export interface HandlerStatistics {
  storage: {
    total: number;
    bySeverity: Record<string, number>;
    recentTimestamp?: Date;
  };
  reporters: {
    total: number;
    enabled: number;
    disabled: number;
    failing: number;
    totalFailures: number;
  };
  security: {
    errorsInLastMinute: number;
    limit: number;
    remaining: number;
    rateLimitEnabled: boolean;
    redactedFieldsCount: number;
  };
  config: {
    serviceName: string;
    environment: string;
    defaultSeverity: ErrorSeverity;
  };
}
