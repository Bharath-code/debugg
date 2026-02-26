/**
 * BaseReporter - Abstract base class for error reporters
 */

import { UniversalError } from '../types';

export interface BaseReporterOptions {
  /** Whether to log failures to console */
  logFailures?: boolean;
}

export abstract class BaseReporter {
  protected options: { logFailures: boolean };

  constructor(options: BaseReporterOptions = {}) {
    this.options = {
      logFailures: options.logFailures ?? true,
    };
  }

  /**
   * Report an error - must be implemented by subclasses
   */
  abstract report(error: UniversalError): Promise<void>;

  /**
   * Log failure to console
   */
  protected logFailure(error: UniversalError, reason: Error): void {
    if (this.options.logFailures) {
      console.error(`[Reporter] Failed to report error ${error.errorId}:`, reason.message);
    }
  }

  /**
   * Validate error before reporting
   */
  protected validateError(error: UniversalError): boolean {
    return !!(error && error.errorId && error.message);
  }
}
