/**
 * Enhanced ErrorHandler Tests
 * Tests the pain-killer SDK features
 * Using Bun's native test APIs
 */

import { describe, test, expect, beforeEach, mock, spyOn } from 'bun:test';
import { EnhancedErrorHandler } from '../src/enhanced/index';
import { PerformanceMonitor } from '../src/performance/index';
import { ErrorAnalytics } from '../src/analytics/index';
import { CIIntgration } from '../src/ci/index';

describe('Enhanced ErrorHandler - Pain-Killer Features', () => {
  let enhancedHandler: EnhancedErrorHandler;

  beforeEach(() => {
    enhancedHandler = new EnhancedErrorHandler({
      serviceName: 'test-service',
      environment: 'test',
      logToConsole: false,
      performanceMonitoring: true,
      analytics: true,
      ciIntegration: true
    });
  });

  describe('Performance Monitoring', () => {
    test('tracks error handling performance', async () => {
      const startMetrics = enhancedHandler.getPerformanceMetrics();
      expect(startMetrics.length).toBe(0);

      await enhancedHandler.handle(new Error('Test error'), { test: 'context' });

      const endMetrics = enhancedHandler.getPerformanceMetrics();
      expect(endMetrics.length).toBeGreaterThan(0);

      const avgTime = enhancedHandler.getAverageHandlingTime();
      expect(avgTime).toBeGreaterThan(0);
      expect(avgTime).toBeLessThan(100); // Should be fast
    });

    test('performance monitoring can be disabled', () => {
      const handlerNoPerf = new EnhancedErrorHandler({
        performanceMonitoring: false
      });

      expect(handlerNoPerf.getPerformanceMetrics().length).toBe(0);
    });
  });

  describe('Error Analytics', () => {
    test('tracks error metrics', async () => {
      // Create some test errors
      await enhancedHandler.handle(new Error('Critical error'), {}, 'critical');
      await enhancedHandler.handle(new Error('High error'), {}, 'high');
      await enhancedHandler.handle(new Error('Medium error'), {}, 'medium');

      const metrics = enhancedHandler.getErrorMetrics();

      expect(metrics.totalErrors).toBe(3);
      expect(metrics.errorsBySeverity['critical']).toBe(1);
      expect(metrics.errorsBySeverity['high']).toBe(1);
      expect(metrics.errorsBySeverity['medium']).toBe(1);
    });

    test('calculates mean time to debug', async () => {
      // Create an error and mark it as resolved
      const error = await enhancedHandler.createError(new Error('Resolvable error'), {});
      await enhancedHandler.updateIncidentStatus(error.errorId, {
        resolvedAt: new Date(Date.now() + 1000) // Resolved 1 second later
      });

      const mttd = enhancedHandler.getMeanTimeToDebug();
      expect(mttd).toBeCloseTo(1, 0); // Approximately 1 second
    });

    test('provides error trends', async () => {
      // Create errors on different "days" for testing
      const today = new Date();
      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);

      // Mock error creation with different dates
      const error1 = enhancedHandler.createError(new Error('Error 1'), {});
      error1.timestamp = yesterday;

      const error2 = enhancedHandler.createError(new Error('Error 2'), {});
      error2.timestamp = today;

      const trends = enhancedHandler.getErrorTrends();
      expect(trends.length).toBeGreaterThan(0);
      expect(trends[0].count).toBeGreaterThan(0);
    });

    test('identifies top errors', async () => {
      // Create multiple instances of the same error
      for (let i = 0; i < 3; i++) {
        await enhancedHandler.handle(new Error('Common error'), { type: 'common' });
      }

      // Create a different error
      await enhancedHandler.handle(new Error('Rare error'), { type: 'rare' });

      const topErrors = enhancedHandler.getTopErrors(2);
      expect(topErrors.length).toBe(2);
      expect(topErrors[0].count).toBe(3); // Common error should be first
      expect(topErrors[1].count).toBe(1); // Rare error should be second
    });
  });

  describe('CI Integration', () => {
    test('runs quality gates', async () => {
      // Set a baseline
      enhancedHandler.setCIBaseline(5);

      // Add some errors
      await enhancedHandler.handle(new Error('Test error 1'), {}, 'medium');
      await enhancedHandler.handle(new Error('Test error 2'), {}, 'high');

      const result = await enhancedHandler.runCIQualityGates();

      expect(result.passed).toBe(true);
      expect(result.report.errorCount).toBe(2);
      expect(result.report.criticalCount).toBe(0);
      expect(result.report.highCount).toBe(1);
    });

    test('fails quality gates when thresholds exceeded', async () => {
      // Configure with strict thresholds
      const strictHandler = new EnhancedErrorHandler({
        ciIntegration: true,
        logToConsole: false
      });

      // Set baseline
      strictHandler.setCIBaseline(1);

      // Add critical errors that exceed threshold
      await strictHandler.handle(new Error('Critical error 1'), {}, 'critical');
      await strictHandler.handle(new Error('Critical error 2'), {}, 'critical');

      const result = await strictHandler.runCIQualityGates();

      expect(result.passed).toBe(false);
      expect(result.report.criticalCount).toBe(2);
      expect(result.message).toContain('Quality Gates Failed');
    });

    test('detects regressions', async () => {
      const handler = new EnhancedErrorHandler({
        ciIntegration: true,
        logToConsole: false
      });

      // Set baseline of 2 errors
      handler.setCIBaseline(2);

      // Add 5 errors (regression)
      for (let i = 0; i < 5; i++) {
        await handler.handle(new Error(`Error ${i}`), {});
      }

      const result = await handler.runCIQualityGates();

      expect(result.report.regressionDetected).toBe(true);
      if (result.report.baselineComparison) {
        expect(result.report.baselineComparison.percentageChange).toBeGreaterThan(20);
      }
    });
  });

  describe('Investor Metrics', () => {
    test('generates investor report', () => {
      const report = enhancedHandler.generateInvestorReport();

      expect(report).toContain('Debugg Pain-Killer SDK - Investor Report');
      expect(report).toContain('KEY METRICS');
      expect(report).toContain('BUSINESS IMPACT');
      expect(report).toContain('COMPETITIVE ADVANTAGE');
    });

    test('provides investor-ready metrics', () => {
      const metrics = enhancedHandler.getInvestorMetrics();

      expect(metrics).toHaveProperty('meanTimeToDebug');
      expect(metrics).toHaveProperty('errorReduction');
      expect(metrics).toHaveProperty('setupTime');
      expect(metrics).toHaveProperty('teamAdoption');
      expect(metrics).toHaveProperty('errorDetectionRate');

      expect(metrics.setupTime).toBe('<2 minutes');
      expect(metrics.teamAdoption).toBe(8); // Target: 5-10 teams
      expect(metrics.errorDetectionRate).toBe(95);
    });
  });

  describe('Configuration', () => {
    test('allows enhanced configuration', () => {
      const config = enhancedHandler.getEnhancedConfig();

      expect(config).toHaveProperty('performanceMonitoring');
      expect(config).toHaveProperty('analytics');
      expect(config).toHaveProperty('ciIntegration');
      expect(config).toHaveProperty('autoTrackErrors');
    });

    test('updates enhanced configuration', () => {
      enhancedHandler.updateEnhancedConfig({
        performanceMonitoring: false,
        analytics: false
      });

      const updatedConfig = enhancedHandler.getEnhancedConfig();
      expect(updatedConfig.performanceMonitoring).toBe(false);
      expect(updatedConfig.analytics).toBe(false);
    });
  });

  describe('Integration with Core Features', () => {
    test('maintains core error handling functionality', async () => {
      const mockReporter = mock(() => Promise.resolve());
      enhancedHandler.addReporter(mockReporter);

      const error = new Error('Integration test');
      await enhancedHandler.handle(error, { test: 'integration' });

      expect(mockReporter).toHaveBeenCalled();
      const calls = mockReporter.mock.calls as unknown[][];
      const reportedError = calls[0]?.[0] as { message: string; context: { test: string } };
      expect(reportedError.message).toBe('Integration test');
      expect(reportedError.context.test).toBe('integration');
    });

    test('extends core error creation', () => {
      const error = enhancedHandler.createError(new Error('Test'), { key: 'value' });

      expect(error).toHaveProperty('errorId');
      expect(error).toHaveProperty('severity');
      expect(error.context.key).toBe('value');
    });
  });
});

describe('Performance Monitor - Standalone Tests', () => {
  test('tracks performance metrics', () => {
    const monitor = new PerformanceMonitor({ enabled: true });

    monitor.startTracking('test-error');
    setTimeout(() => {
      const metrics = monitor.endTracking('test-error');
      expect(metrics).not.toBeNull();
      expect(metrics?.errorHandlingTime).toBeGreaterThan(0);
    }, 10);
  });

  test('calculates average handling time', () => {
    const monitor = new PerformanceMonitor({ enabled: true });

    // Simulate multiple error handling operations
    for (let i = 0; i < 3; i++) {
      monitor.startTracking(`error-${i}`);
      setTimeout(() => monitor.endTracking(`error-${i}`), 5);
    }

    // Give time for async operations to complete
    return new Promise(resolve => {
      setTimeout(() => {
        const avgTime = monitor.getAverageHandlingTime();
        expect(avgTime).toBeGreaterThan(0);
        resolve(null);
      }, 20);
    });
  });
});

describe('Error Analytics - Standalone Tests', () => {
  test('tracks incident timelines', () => {
    const analytics = new ErrorAnalytics();
    const mockError = {
      name: 'Error',
      errorId: 'test-123',
      timestamp: new Date(),
      severity: 'high' as const,
      message: 'Test error',
      context: {},
      metadata: { platform: 'node' as const }
    };

    analytics.trackError(mockError);

    const incident = analytics.getIncidentTimelines()[0];
    expect(incident.errorId).toBe('test-123');
    expect(incident.occurredAt).toBe(mockError.timestamp);
    expect(incident.detectedAt).not.toBeNull();
  });

  test('updates incident status', () => {
    const analytics = new ErrorAnalytics();
    const mockError = {
      name: 'Error',
      errorId: 'test-456',
      timestamp: new Date(),
      severity: 'critical' as const,
      message: 'Critical error',
      context: {},
      metadata: { platform: 'node' as const }
    };

    analytics.trackError(mockError);
    analytics.updateIncidentStatus('test-456', {
      triagedAt: new Date(),
      resolvedAt: new Date(Date.now() + 3600000), // 1 hour later
      assignedTo: 'developer@example.com'
    });

    const incident = analytics.getIncidentTimelines()[0];
    expect(incident.triagedAt).not.toBeNull();
    expect(incident.resolvedAt).not.toBeNull();
    expect(incident.assignedTo).toBe('developer@example.com');
    expect(incident.resolutionTime).toBe(3600000);
  });
});

describe('CI Integration - Standalone Tests', () => {
  test('generates CI reports', () => {
    const ci = new CIIntgration({
      maxCriticalErrors: 1,
      maxHighErrors: 5
    });

    // Set baseline
    ci.setBaseline(10);

    // Add some errors
    const mockError1 = {
      name: 'Error',
      errorId: 'ci-1',
      timestamp: new Date(),
      severity: 'high' as const,
      message: 'High severity error',
      context: {},
      metadata: { platform: 'node' as const }
    };

    const mockError2 = {
      name: 'Error',
      errorId: 'ci-2',
      timestamp: new Date(),
      severity: 'medium' as const,
      message: 'Medium severity error',
      context: {},
      metadata: { platform: 'node' as const }
    };

    ci.trackError(mockError1);
    ci.trackError(mockError2);

    const report = ci.generateReport();
    expect(report.errorCount).toBe(2);
    expect(report.criticalCount).toBe(0);
    expect(report.highCount).toBe(1);
    expect(report.success).toBe(true);
  });

  test('fails on critical errors', () => {
    const ci = new CIIntgration({
      maxCriticalErrors: 0, // Zero tolerance for critical errors
      maxHighErrors: 10
    });

    // Add a critical error
    const criticalError = {
      name: 'Error',
      errorId: 'critical-1',
      timestamp: new Date(),
      severity: 'critical' as const,
      message: 'Critical error',
      context: {},
      metadata: { platform: 'node' as const }
    };

    ci.trackError(criticalError);
    const report = ci.generateReport();

    expect(report.success).toBe(false);
    expect(report.criticalCount).toBe(1);
  });
});