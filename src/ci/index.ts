/**
 * CI/CD Integration Module
 * Provides build quality gates and error baseline tracking
 */

import { UniversalError } from '../types/error';
import { ErrorAnalytics } from '../analytics';

export interface CIConfig {
  maxCriticalErrors: number;
  maxHighErrors: number;
  errorRateThreshold: number;
  baselineComparison: boolean;
  failOnRegression: boolean;
}

export interface CIReport {
  success: boolean;
  errorCount: number;
  criticalCount: number;
  highCount: number;
  errorRate: number;
  regressionDetected: boolean;
  baselineComparison: {
    current: number;
    baseline: number;
    change: number;
    percentageChange: number;
  } | null;
  errors: Array<{
    errorId: string;
    severity: string;
    message: string;
    timestamp: Date;
  }>;
}

export class CIIntgration {
  private config: CIConfig;
  private analytics: ErrorAnalytics;
  private baselineErrorCount: number;

  constructor(config: Partial<CIConfig> = {}) {
    this.config = {
      maxCriticalErrors: config.maxCriticalErrors || 0,
      maxHighErrors: config.maxHighErrors || 5,
      errorRateThreshold: config.errorRateThreshold || 0.1, // 10%
      baselineComparison: config.baselineComparison !== false,
      failOnRegression: config.failOnRegression !== false
    };

    this.analytics = new ErrorAnalytics();
    this.baselineErrorCount = 0;
  }

  public setBaseline(errorCount: number): void {
    this.baselineErrorCount = errorCount;
  }

  public trackError(error: UniversalError): void {
    this.analytics.trackError(error);
  }

  public generateReport(): CIReport {
    const metrics = this.analytics.getMetrics();
    const incidents = this.analytics.getIncidentTimelines();

    const criticalCount = metrics.errorsBySeverity['critical'] || 0;
    const highCount = metrics.errorsBySeverity['high'] || 0;
    const totalErrors = metrics.totalErrors;

    // Calculate error rate (errors per 1000 operations - simulated)
    const errorRate = totalErrors / 1000; // Simplified calculation

    // Check for regression
    let regressionDetected = false;
    let baselineComparison = null;

    if (this.config.baselineComparison && this.baselineErrorCount > 0) {
      const change = totalErrors - this.baselineErrorCount;
      const percentageChange = this.baselineErrorCount > 0
        ? (change / this.baselineErrorCount) * 100
        : 0;

      baselineComparison = {
        current: totalErrors,
        baseline: this.baselineErrorCount,
        change,
        percentageChange
      };

      // Consider regression if error count increased by 20% or more
      regressionDetected = percentageChange > 20;
    }

    // Determine success based on thresholds
    const criticalExceeded = criticalCount > this.config.maxCriticalErrors;
    const highExceeded = highCount > this.config.maxHighErrors;
    const rateExceeded = errorRate > this.config.errorRateThreshold;
    const regressionFailed = this.config.failOnRegression && regressionDetected;

    const success = !(criticalExceeded || highExceeded || rateExceeded || regressionFailed);

    // Get recent errors for report
    const recentErrors = incidents.slice(-10).map(incident => ({
      errorId: incident.errorId,
      severity: this.findErrorById(incident.errorId)?.severity || 'unknown',
      message: this.findErrorById(incident.errorId)?.message || 'Unknown error',
      timestamp: incident.occurredAt
    }));

    return {
      success,
      errorCount: totalErrors,
      criticalCount,
      highCount,
      errorRate,
      regressionDetected,
      baselineComparison,
      errors: recentErrors
    };
  }

  private findErrorById(errorId: string): UniversalError | undefined {
    // This would be more efficient with a proper index, but for simplicity:
    const allErrors = this.analytics['errors'] as UniversalError[];
    return allErrors.find(error => error.errorId === errorId);
  }

  public getQualityGateStatus(): {
    passed: boolean;
    reasons: string[];
  } {
    const report = this.generateReport();
    const reasons = [];

    if (report.criticalCount > this.config.maxCriticalErrors) {
      reasons.push(`Critical errors exceeded: ${report.criticalCount}/${this.config.maxCriticalErrors}`);
    }

    if (report.highCount > this.config.maxHighErrors) {
      reasons.push(`High severity errors exceeded: ${report.highCount}/${this.config.maxHighErrors}`);
    }

    if (report.errorRate > this.config.errorRateThreshold) {
      reasons.push(`Error rate exceeded: ${report.errorRate.toFixed(2)}/${this.config.errorRateThreshold}`);
    }

    if (report.regressionDetected && this.config.failOnRegression) {
      reasons.push('Regression detected compared to baseline');
    }

    return {
      passed: report.success,
      reasons
    };
  }

  public async runQualityGates(): Promise<{
    passed: boolean;
    report: CIReport;
    message: string;
  }> {
    const report = this.generateReport();
    const gateStatus = this.getQualityGateStatus();

    let message = `CI Quality Gates: ${gateStatus.passed ? 'PASSED' : 'FAILED'}\n`;
    message += `✓ Total Errors: ${report.errorCount}\n`;
    message += `✓ Critical: ${report.criticalCount}/${this.config.maxCriticalErrors}\n`;
    message += `✓ High: ${report.highCount}/${this.config.maxHighErrors}\n`;
    message += `✓ Error Rate: ${report.errorRate.toFixed(3)} (threshold: ${this.config.errorRateThreshold})\n`;

    if (report.baselineComparison) {
      message += `✓ Baseline: ${report.baselineComparison.current} vs ${report.baselineComparison.baseline} `;
      message += `(Δ: ${report.baselineComparison.percentageChange.toFixed(1)}%)\n`;
    }

    if (!gateStatus.passed) {
      message += '\n🚨 Quality Gates Failed:\n';
      gateStatus.reasons.forEach(reason => {
        message += `  • ${reason}\n`;
      });

      if (report.errors.length > 0) {
        message += '\n📋 Recent Errors:\n';
        report.errors.forEach(error => {
          message += `  • [${error.severity}] ${error.message} (${error.errorId})\n`;
        });
      }
    }

    return {
      passed: gateStatus.passed,
      report,
      message
    };
  }
}