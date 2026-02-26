/**
 * Reporter Manager - Handles reporter registration and error dispatch
 * Separated from ErrorHandler for better Single Responsibility Principle
 */

import { UniversalError, ErrorReporter } from '../types';

export interface ReporterEntry {
  id: string;
  reporter: ErrorReporter;
  enabled: boolean;
  failureCount: number;
  lastFailure?: Error;
  createdAt: Date;
}

export interface ReporterManagerOptions {
  /** Maximum failures before auto-disabling a reporter */
  maxFailures?: number;
  /** Whether to log reporter failures */
  logFailures?: boolean;
}

export class ReporterManager {
  private reporters: Map<string, ReporterEntry>;
  private readonly maxFailures: number;
  private readonly logFailures: boolean;

  constructor(options: ReporterManagerOptions = {}) {
    this.reporters = new Map();
    this.maxFailures = options.maxFailures ?? 5;
    this.logFailures = options.logFailures ?? true;
  }

  /**
   * Add a reporter
   */
  add(reporter: ErrorReporter, id?: string): string {
    const reporterId = id ?? this.generateReporterId();

    if (this.reporters.has(reporterId)) {
      throw new Error(`Reporter with id "${reporterId}" already exists`);
    }

    const entry: ReporterEntry = {
      id: reporterId,
      reporter,
      enabled: true,
      failureCount: 0,
      createdAt: new Date(),
    };

    this.reporters.set(reporterId, entry);
    return reporterId;
  }

  /**
   * Remove a reporter
   */
  remove(id: string): boolean {
    return this.reporters.delete(id);
  }

  /**
   * Clear all reporters
   */
  clear(): void {
    this.reporters.clear();
  }

  /**
   * Enable a reporter
   */
  enable(id: string): boolean {
    const entry = this.reporters.get(id);
    if (!entry) return false;

    entry.enabled = true;
    entry.failureCount = 0;
    entry.lastFailure = undefined;
    return true;
  }

  /**
   * Disable a reporter
   */
  disable(id: string): boolean {
    const entry = this.reporters.get(id);
    if (!entry) return false;

    entry.enabled = false;
    return true;
  }

  /**
   * Dispatch error to all enabled reporters
   */
  async dispatch(error: UniversalError): Promise<DispatchResult> {
    const results: ReporterResult[] = [];
    const enabledReporters = Array.from(this.reporters.values()).filter((r) => r.enabled);

    const promises = enabledReporters.map(async (entry) => {
      const result = await this.reportToEntry(entry, error);
      results.push(result);
    });

    await Promise.all(promises);

    const successCount = results.filter((r) => r.success).length;
    const failureCount = results.filter((r) => !r.success).length;

    return {
      total: enabledReporters.length,
      success: successCount,
      failures: failureCount,
      results,
    };
  }

  /**
   * Report to a single reporter entry
   */
  private async reportToEntry(entry: ReporterEntry, error: UniversalError): Promise<ReporterResult> {
    const startTime = Date.now();

    try {
      await entry.reporter(error);

      // Reset failure count on success
      entry.failureCount = 0;
      entry.lastFailure = undefined;

      return {
        reporterId: entry.id,
        success: true,
        duration: Date.now() - startTime,
      };
    } catch (reportError) {
      entry.failureCount++;
      entry.lastFailure = reportError as Error;

      // Auto-disable if too many failures
      if (entry.failureCount >= this.maxFailures) {
        entry.enabled = false;
        if (this.logFailures) {
          console.error(
            `[ReporterManager] Reporter "${entry.id}" disabled after ${entry.failureCount} consecutive failures`
          );
        }
      }

      if (this.logFailures) {
        console.error(`[ReporterManager] Reporter "${entry.id}" failed:`, reportError);
      }

      return {
        reporterId: entry.id,
        success: false,
        duration: Date.now() - startTime,
        error: reportError as Error,
      };
    }
  }

  /**
   * Get all reporters
   */
  getAll(): ReporterEntry[] {
    return Array.from(this.reporters.values());
  }

  /**
   * Get reporter by ID
   */
  get(id: string): ReporterEntry | undefined {
    return this.reporters.get(id);
  }

  /**
   * Get count of enabled reporters
   */
  getEnabledCount(): number {
    return Array.from(this.reporters.values()).filter((r) => r.enabled).length;
  }

  /**
   * Get count of total reporters
   */
  getCount(): number {
    return this.reporters.size;
  }

  /**
   * Get reporter statistics
   */
  getStatistics(): ReporterStatistics {
    const entries = Array.from(this.reporters.values());
    const enabled = entries.filter((r) => r.enabled);
    const disabled = entries.filter((r) => !r.enabled);
    const failing = entries.filter((r) => r.failureCount > 0);

    return {
      total: entries.length,
      enabled: enabled.length,
      disabled: disabled.length,
      failing: failing.length,
      totalFailures: entries.reduce((sum, r) => sum + r.failureCount, 0),
    };
  }

  /**
   * Generate unique reporter ID
   */
  private generateReporterId(): string {
    return `reporter_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
  }
}

export interface DispatchResult {
  total: number;
  success: number;
  failures: number;
  results: ReporterResult[];
}

export interface ReporterResult {
  reporterId: string;
  success: boolean;
  duration: number;
  error?: Error;
}

export interface ReporterStatistics {
  total: number;
  enabled: number;
  disabled: number;
  failing: number;
  totalFailures: number;
}
