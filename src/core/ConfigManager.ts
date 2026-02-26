/**
 * Configuration Manager - Handles all configuration-related operations
 * Separated from ErrorHandler for better Single Responsibility Principle
 */

import { ErrorHandlerConfig, ErrorSeverity, ErrorReporter } from '../types';
import { DEFAULTS, SEVERITY_LEVELS } from '../constants/defaults';

export interface ValidatedConfig extends Required<ErrorHandlerConfig> {
  /** Whether configuration has been validated */
  readonly isValidated: true;
}

export class ConfigManager {
  private config: ValidatedConfig;
  private readonly validationErrors: string[] = [];

  constructor(config: ErrorHandlerConfig = {}) {
    this.config = this.validateAndNormalize(config);
  }

  /**
   * Validate and normalize configuration
   */
  private validateAndNormalize(config: ErrorHandlerConfig): ValidatedConfig {
    this.validationErrors.length = 0;

    // Validate service name
    const serviceName = this.validateServiceName(config.serviceName);

    // Validate environment
    const environment = this.validateEnvironment(config.environment);

    // Validate default severity
    const defaultSeverity = this.validateSeverity(config.defaultSeverity);

    // Validate reporters
    const reporters = this.validateReporters(config.reporters);

    // Validate boolean options
    const logToConsole = this.validateBoolean(config.logToConsole, true, 'logToConsole');
    const includeStackTrace = this.validateBoolean(config.includeStackTrace, true, 'includeStackTrace');

    // Validate max context depth
    const maxContextDepth = this.validatePositiveInteger(
      config.maxContextDepth,
      DEFAULTS.MAX_CONTEXT_DEPTH,
      'maxContextDepth',
      1,
      20
    );

    if (this.validationErrors.length > 0) {
      throw new Error(`Invalid configuration:\n${this.validationErrors.map((e) => `  - ${e}`).join('\n')}`);
    }

    return {
      serviceName,
      environment,
      defaultSeverity,
      reporters,
      logToConsole,
      includeStackTrace,
      maxContextDepth,
      isValidated: true as const,
    };
  }

  /**
   * Validate service name
   */
  private validateServiceName(name: string | undefined): string {
    if (!name) {
      return DEFAULTS.SERVICE_NAME;
    }

    if (typeof name !== 'string') {
      this.validationErrors.push('serviceName must be a string');
      return DEFAULTS.SERVICE_NAME;
    }

    const trimmed = name.trim();
    if (trimmed.length === 0) {
      this.validationErrors.push('serviceName cannot be empty');
      return DEFAULTS.SERVICE_NAME;
    }

    if (trimmed.length > 100) {
      this.validationErrors.push('serviceName must be 100 characters or less');
      return trimmed.substring(0, 100);
    }

    // Allow alphanumeric, hyphens, underscores
    if (!/^[a-zA-Z0-9_-]+$/.test(trimmed)) {
      this.validationErrors.push('serviceName can only contain letters, numbers, hyphens, and underscores');
    }

    return trimmed;
  }

  /**
   * Validate environment
   */
  private validateEnvironment(env: string | undefined): string {
    if (!env) {
      return DEFAULTS.ENVIRONMENT;
    }

    if (typeof env !== 'string') {
      this.validationErrors.push('environment must be a string');
      return DEFAULTS.ENVIRONMENT;
    }

    const normalized = env.toLowerCase().trim();

    if (normalized.length === 0 || normalized.length > 50) {
      this.validationErrors.push('environment must be between 1 and 50 characters');
      return DEFAULTS.ENVIRONMENT;
    }

    return normalized;
  }

  /**
   * Validate severity level
   */
  private validateSeverity(severity: ErrorSeverity | undefined): ErrorSeverity {
    if (!severity) {
      return DEFAULTS.DEFAULT_SEVERITY;
    }

    if (!SEVERITY_LEVELS.includes(severity)) {
      this.validationErrors.push(`Invalid severity: ${severity}. Must be one of: ${SEVERITY_LEVELS.join(', ')}`);
      return DEFAULTS.DEFAULT_SEVERITY;
    }

    return severity;
  }

  /**
   * Validate reporters array
   */
  private validateReporters(reporters: unknown[] | undefined): ErrorReporter[] {
    if (!reporters) {
      return [];
    }

    if (!Array.isArray(reporters)) {
      this.validationErrors.push('reporters must be an array');
      return [];
    }

    const validReporters = reporters.filter((reporter, index): reporter is ErrorReporter => {
      if (typeof reporter !== 'function') {
        this.validationErrors.push(`reporter at index ${index} must be a function`);
        return false;
      }
      return true;
    });

    return validReporters;
  }

  /**
   * Validate boolean option
   */
  private validateBoolean(value: unknown, defaultValue: boolean, name: string): boolean {
    if (value === undefined) {
      return defaultValue;
    }

    if (typeof value !== 'boolean') {
      this.validationErrors.push(`${name} must be a boolean`);
      return defaultValue;
    }

    return value;
  }

  /**
   * Validate positive integer within range
   */
  private validatePositiveInteger(
    value: unknown,
    defaultValue: number,
    name: string,
    min: number = 1,
    max: number = 1000
  ): number {
    if (value === undefined) {
      return defaultValue;
    }

    if (typeof value !== 'number' || !Number.isInteger(value)) {
      this.validationErrors.push(`${name} must be an integer`);
      return defaultValue;
    }

    if (value < min || value > max) {
      this.validationErrors.push(`${name} must be between ${min} and ${max}`);
      return Math.max(min, Math.min(max, value));
    }

    return value;
  }

  /**
   * Get current configuration
   */
  getConfig(): Readonly<ValidatedConfig> {
    return { ...this.config };
  }

  /**
   * Update configuration
   */
  updateConfig(newConfig: ErrorHandlerConfig): void {
    this.config = this.validateAndNormalize(newConfig);
  }

  /**
   * Get a specific config value
   */
  get<K extends keyof ValidatedConfig>(key: K): ValidatedConfig[K] {
    return this.config[key];
  }

  /**
   * Validate configuration against schema
   */
  validate(): { valid: boolean; errors: string[] } {
    return {
      valid: this.validationErrors.length === 0,
      errors: [...this.validationErrors],
    };
  }
}
