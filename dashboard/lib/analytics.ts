/**
 * Advanced Analytics & Insights Service
 * Predictive analytics, trends, and performance insights
 */

import { prisma } from './prisma.js';

export interface ErrorTrend {
  date: string;
  count: number;
  critical: number;
  high: number;
  medium: number;
  low: number;
  info: number;
}

export interface Prediction {
  metric: string;
  predictedValue: number;
  confidence: number;
  trend: 'increasing' | 'stable' | 'decreasing';
  anomaly: boolean;
  recommendation?: string;
}

export interface PerformanceInsight {
  type: 'performance' | 'reliability' | 'pattern';
  severity: 'critical' | 'high' | 'medium' | 'low';
  insight: string;
  evidence: {
    metric: string;
    value: number;
    threshold?: number;
  };
  recommendation: string;
  impact?: string;
}

export interface DashboardMetrics {
  overview: {
    totalErrors: number;
    criticalErrors: number;
    errorRate: number;
    meanTimeToResolution: number;
    resolutionRate: number;
  };
  trends: ErrorTrend[];
  predictions: Prediction[];
  insights: PerformanceInsight[];
  topErrors: any[];
  services: ServiceMetrics[];
}

export interface ServiceMetrics {
  name: string;
  errorCount: number;
  criticalCount: number;
  errorRate: number;
  avgResolutionTime: number;
  health: 'healthy' | 'degraded' | 'critical';
}

class AnalyticsService {
  /**
   * Get comprehensive dashboard metrics
   */
  async getDashboardMetrics(timeRange: { from: Date; to: Date }): Promise<DashboardMetrics> {
    const [overview, trends, predictions, insights, topErrors, services] = await Promise.all([
      this.getOverviewMetrics(timeRange),
      this.getErrorTrends(timeRange),
      this.getPredictions(timeRange),
      this.getInsights(timeRange),
      this.getTopErrors(timeRange),
      this.getServiceMetrics(timeRange)
    ]);

    return {
      overview,
      trends,
      predictions,
      insights,
      topErrors,
      services
    };
  }

  /**
   * Get overview metrics
   */
  private async getOverviewMetrics(timeRange: { from: Date; to: Date }) {
    const [totalErrors, criticalErrors, resolvedErrors] = await Promise.all([
      prisma.errorRecord.count({
        where: {
          timestamp: {
            gte: timeRange.from,
            lte: timeRange.to
          }
        }
      }),
      prisma.errorRecord.count({
        where: {
          timestamp: {
            gte: timeRange.from,
            lte: timeRange.to
          },
          severity: 'critical'
        }
      }),
      prisma.errorRecord.count({
        where: {
          timestamp: {
            gte: timeRange.from,
            lte: timeRange.to
          },
          status: 'RESOLVED'
        }
      })
    ]);

    const errorRate = totalErrors / ((timeRange.to.getTime() - timeRange.from.getTime()) / (1000 * 60 * 60)); // per hour
    const resolutionRate = totalErrors > 0 ? (resolvedErrors / totalErrors) * 100 : 0;

    // Calculate mean time to resolution
    const resolvedWithTime = await prisma.errorRecord.findMany({
      where: {
        timestamp: {
          gte: timeRange.from,
          lte: timeRange.to
        },
        status: 'RESOLVED',
        resolvedAt: { not: null }
      },
      select: {
        timestamp: true,
        resolvedAt: true
      }
    });

    const meanTimeToResolution = resolvedWithTime.length > 0
      ? resolvedWithTime.reduce((sum, e) => sum + (e.resolvedAt!.getTime() - e.timestamp.getTime()), 0) / resolvedWithTime.length / 1000 / 60 // minutes
      : 0;

    return {
      totalErrors,
      criticalErrors,
      errorRate: Math.round(errorRate * 100) / 100,
      meanTimeToResolution: Math.round(meanTimeToResolution * 100) / 100,
      resolutionRate: Math.round(resolutionRate * 100) / 100
    };
  }

  /**
   * Get error trends over time
   */
  private async getErrorTrends(timeRange: { from: Date; to: Date }): Promise<ErrorTrend[]> {
    const errors = await prisma.errorRecord.findMany({
      where: {
        timestamp: {
          gte: timeRange.from,
          lte: timeRange.to
        }
      },
      select: {
        timestamp: true,
        severity: true
      },
      orderBy: {
        timestamp: 'asc'
      }
    });

    // Group by date
    const trendsMap = new Map<string, ErrorTrend>();

    errors.forEach(error => {
      const date = error.timestamp.toISOString().split('T')[0];
      
      if (!trendsMap.has(date)) {
        trendsMap.set(date, {
          date,
          count: 0,
          critical: 0,
          high: 0,
          medium: 0,
          low: 0,
          info: 0
        });
      }

      const trend = trendsMap.get(date)!;
      trend.count++;
      trend[error.severity as keyof ErrorTrend] = (trend[error.severity as keyof ErrorTrend] as number) + 1;
    });

    return Array.from(trendsMap.values()).sort((a, b) => a.date.localeCompare(b.date));
  }

  /**
   * Generate predictions using simple trend analysis
   */
  private async getPredictions(timeRange: { from: Date; to: Date }): Promise<Prediction[]> {
    const trends = await this.getErrorTrends(timeRange);
    
    if (trends.length < 2) {
      return [];
    }

    const predictions: Prediction[] = [];

    // Predict next day's error count
    const recentTrend = trends.slice(-7); // Last 7 days
    const avgChange = this.calculateAverageChange(recentTrend.map(t => t.count));
    const lastValue = recentTrend[recentTrend.length - 1].count;
    const predicted = Math.round(lastValue + avgChange);

    predictions.push({
      metric: 'error_count',
      predictedValue: predicted,
      confidence: this.calculateConfidence(recentTrend.map(t => t.count)),
      trend: avgChange > 5 ? 'increasing' : avgChange < -5 ? 'decreasing' : 'stable',
      anomaly: Math.abs(avgChange) > 20,
      recommendation: avgChange > 20 
        ? 'Error rate is increasing rapidly. Investigate recent deployments or infrastructure changes.'
        : avgChange < -20
        ? 'Error rate is decreasing. Continue monitoring to ensure stability.'
        : undefined
    });

    // Predict critical errors
    const criticalTrend = recentTrend.map(t => t.critical);
    const avgCriticalChange = this.calculateAverageChange(criticalTrend);
    
    predictions.push({
      metric: 'critical_errors',
      predictedValue: Math.max(0, Math.round(criticalTrend[criticalTrend.length - 1] + avgCriticalChange)),
      confidence: this.calculateConfidence(criticalTrend),
      trend: avgCriticalChange > 2 ? 'increasing' : avgCriticalChange < -2 ? 'decreasing' : 'stable',
      anomaly: avgCriticalChange > 5,
      recommendation: avgCriticalChange > 5
        ? 'Critical errors are increasing. Immediate investigation recommended.'
        : undefined
    });

    return predictions;
  }

  /**
   * Calculate average change in array
   */
  private calculateAverageChange(values: number[]): number {
    if (values.length < 2) return 0;
    
    const changes = [];
    for (let i = 1; i < values.length; i++) {
      changes.push(values[i] - values[i - 1]);
    }
    
    return changes.reduce((sum, c) => sum + c, 0) / changes.length;
  }

  /**
   * Calculate prediction confidence (0-1)
   */
  private calculateConfidence(values: number[]): number {
    if (values.length < 2) return 0.5;
    
    const avg = values.reduce((sum, v) => sum + v, 0) / values.length;
    const variance = values.reduce((sum, v) => sum + Math.pow(v - avg, 2), 0) / values.length;
    const stdDev = Math.sqrt(variance);
    
    // Lower variance = higher confidence
    const cv = stdDev / avg; // Coefficient of variation
    return Math.max(0.1, Math.min(0.95, 1 - cv));
  }

  /**
   * Generate performance insights
   */
  private async getInsights(timeRange: { from: Date; to: Date }): Promise<PerformanceInsight[]> {
    const insights: PerformanceInsight[] = [];
    const metrics = await this.getOverviewMetrics(timeRange);

    // Insight: High error rate
    if (metrics.errorRate > 10) {
      insights.push({
        type: 'reliability',
        severity: 'critical',
        insight: 'Error rate is critically high',
        evidence: {
          metric: 'errors_per_hour',
          value: metrics.errorRate,
          threshold: 10
        },
        recommendation: 'Investigate recent changes and monitor error patterns closely',
        impact: 'System reliability is compromised'
      });
    }

    // Insight: Low resolution rate
    if (metrics.resolutionRate < 50) {
      insights.push({
        type: 'reliability',
        severity: 'high',
        insight: 'Error resolution rate is low',
        evidence: {
          metric: 'resolution_rate',
          value: metrics.resolutionRate,
          threshold: 50
        },
        recommendation: 'Prioritize error triage and resolution processes',
        impact: 'Technical debt is accumulating'
      });
    }

    // Insight: High mean time to resolution
    if (metrics.meanTimeToResolution > 60) {
      insights.push({
        type: 'performance',
        severity: 'medium',
        insight: 'Mean time to resolution is high',
        evidence: {
          metric: 'mttr_minutes',
          value: metrics.meanTimeToResolution,
          threshold: 60
        },
        recommendation: 'Improve error diagnosis and resolution workflows',
        impact: 'Extended downtime affecting users'
      });
    }

    // Get top error patterns
    const topErrors = await this.getTopErrors(timeRange);
    if (topErrors.length > 0 && topErrors[0].count > 50) {
      insights.push({
        type: 'pattern',
        severity: 'high',
        insight: `Recurring error pattern detected: ${topErrors[0].message.substring(0, 50)}...`,
        evidence: {
          metric: 'recurring_errors',
          value: topErrors[0].count,
          threshold: 50
        },
        recommendation: 'Fix the root cause of this recurring error',
        impact: 'Repeated failures affecting system stability'
      });
    }

    return insights;
  }

  /**
   * Get top errors by frequency
   */
  private async getTopErrors(timeRange: { from: Date; to: Date }): Promise<any[]> {
    const errors = await prisma.errorRecord.findMany({
      where: {
        timestamp: {
          gte: timeRange.from,
          lte: timeRange.to
        }
      },
      select: {
        name: true,
        message: true,
        severity: true,
        fingerprint: true
      }
    });

    // Group by fingerprint
    const errorCounts = new Map<string, any>();

    errors.forEach(error => {
      const key = error.fingerprint;
      
      if (!errorCounts.has(key)) {
        errorCounts.set(key, {
          fingerprint: key,
          name: error.name,
          message: error.message,
          severity: error.severity,
          count: 0
        });
      }
      
      errorCounts.get(key).count++;
    });

    return Array.from(errorCounts.values())
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);
  }

  /**
   * Get metrics by service
   */
  private async getServiceMetrics(timeRange: { from: Date; to: Date }): Promise<ServiceMetrics[]> {
    const errors = await prisma.errorRecord.findMany({
      where: {
        timestamp: {
          gte: timeRange.from,
          lte: timeRange.to
        }
      },
      select: {
        metadata: true,
        severity: true,
        status: true,
        timestamp: true,
        resolvedAt: true
      }
    });

    // Group by service
    const serviceMap = new Map<string, ServiceMetrics>();

    errors.forEach(error => {
      const metadata = error.metadata as any;
      const serviceName = metadata?.serviceName || 'unknown';

      if (!serviceMap.has(serviceName)) {
        serviceMap.set(serviceName, {
          name: serviceName,
          errorCount: 0,
          criticalCount: 0,
          errorRate: 0,
          avgResolutionTime: 0,
          health: 'healthy'
        });
      }

      const service = serviceMap.get(serviceName)!;
      service.errorCount++;
      
      if (error.severity === 'critical') {
        service.criticalCount++;
      }

      if (error.status === 'RESOLVED' && error.resolvedAt) {
        service.avgResolutionTime += (error.resolvedAt.getTime() - error.timestamp.getTime()) / 1000 / 60;
      }
    });

    // Calculate rates and health
    const hours = (timeRange.to.getTime() - timeRange.from.getTime()) / (1000 * 60 * 60);
    
    return Array.from(serviceMap.values()).map(service => {
      service.errorRate = Math.round((service.errorCount / hours) * 100) / 100;
      service.avgResolutionTime = service.errorCount > 0 
        ? Math.round(service.avgResolutionTime / service.errorCount * 100) / 100 
        : 0;

      // Determine health
      if (service.criticalCount > 10 || service.errorRate > 20) {
        service.health = 'critical';
      } else if (service.criticalCount > 0 || service.errorRate > 5) {
        service.health = 'degraded';
      } else {
        service.health = 'healthy';
      }

      return service;
    }).sort((a, b) => b.errorCount - a.errorCount);
  }
}

// Singleton instance
const analyticsService = new AnalyticsService();

export default analyticsService;
export { AnalyticsService };
