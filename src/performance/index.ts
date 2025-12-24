/**
 * Performance Monitoring Module
 * Tracks error handling overhead and system performance impact
 */

import { UniversalError } from '../types/error';

export interface PerformanceMetrics {
  errorHandlingTime: number;
  memoryUsage: number;
  cpuUsage: number;
  timestamp: Date;
  errorId: string;
}

export interface PerformanceMonitorConfig {
  enabled: boolean;
  sampleRate: number;
  maxHistory: number;
}

export class PerformanceMonitor {
  private config: PerformanceMonitorConfig;
  private metricsHistory: PerformanceMetrics[];
  private startTimes: Map<string, number>;

  constructor(config: Partial<PerformanceMonitorConfig> = {}) {
    this.config = {
      enabled: config.enabled !== false,
      sampleRate: config.sampleRate || 1.0,
      maxHistory: config.maxHistory || 1000
    };

    this.metricsHistory = [];
    this.startTimes = new Map();
  }

  public startTracking(errorId: string): void {
    if (!this.config.enabled) return;

    if (Math.random() > this.config.sampleRate) return;

    this.startTimes.set(errorId, performance.now());
  }

  public endTracking(errorId: string): PerformanceMetrics | null {
    if (!this.config.enabled) return null;
    if (!this.startTimes.has(errorId)) return null;

    const startTime = this.startTimes.get(errorId)!;
    const endTime = performance.now();
    const handlingTime = endTime - startTime;

    const metrics: PerformanceMetrics = {
      errorHandlingTime: handlingTime,
      memoryUsage: this.getMemoryUsage(),
      cpuUsage: this.getCPUUsage(),
      timestamp: new Date(),
      errorId: errorId
    };

    this.startTimes.delete(errorId);

    // Add to history
    this.metricsHistory.push(metrics);
    if (this.metricsHistory.length > this.config.maxHistory) {
      this.metricsHistory.shift();
    }

    return metrics;
  }

  private getMemoryUsage(): number {
    try {
      if (typeof process !== 'undefined' && process.memoryUsage) {
        const memory = process.memoryUsage();
        return memory.heapUsed / 1024 / 1024; // MB
      }
      return 0;
    } catch (error) {
      return 0;
    }
  }

  private getCPUUsage(): number {
    try {
      if (typeof process !== 'undefined' && process.cpuUsage) {
        const startUsage = process.cpuUsage();
        // Simple CPU usage approximation
        const now = Date.now();
        while (Date.now() - now < 50) {} // Busy wait for 50ms
        const endUsage = process.cpuUsage(startUsage);

        const user = endUsage.user / 1000; // microseconds to milliseconds
        const system = endUsage.system / 1000;
        return (user + system) / 50; // Percentage over 50ms
      }
      return 0;
    } catch (error) {
      return 0;
    }
  }

  public getMetrics(): PerformanceMetrics[] {
    return [...this.metricsHistory];
  }

  public getAverageHandlingTime(): number {
    if (this.metricsHistory.length === 0) return 0;
    const total = this.metricsHistory.reduce((sum, metric) => sum + metric.errorHandlingTime, 0);
    return total / this.metricsHistory.length;
  }

  public clearHistory(): void {
    this.metricsHistory = [];
  }
}