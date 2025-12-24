/**
 * Error Analytics and Metrics Tracking Module
 * Provides hard metrics for investor presentations
 */

import { UniversalError } from '../types/error';

export interface ErrorMetrics {
  totalErrors: number;
  errorsBySeverity: Record<string, number>;
  errorsByType: Record<string, number>;
  meanTimeToResolve: number | null;
  resolutionRate: number;
  firstOccurrence: Date | null;
  lastOccurrence: Date | null;
}

export interface IncidentTimeline {
  errorId: string;
  occurredAt: Date;
  detectedAt: Date | null;
  triagedAt: Date | null;
  resolvedAt: Date | null;
  resolutionTime: number | null;
  assignedTo: string | null;
}

export class ErrorAnalytics {
  private errors: UniversalError[];
  private incidents: IncidentTimeline[];
  private maxHistory: number;

  constructor(maxHistory: number = 10000) {
    this.errors = [];
    this.incidents = [];
    this.maxHistory = maxHistory;
  }

  public trackError(error: UniversalError): void {
    // Add to error history
    this.errors.push(error);
    if (this.errors.length > this.maxHistory) {
      this.errors.shift();
    }

    // Create incident timeline
    const incident: IncidentTimeline = {
      errorId: error.errorId,
      occurredAt: error.timestamp,
      detectedAt: new Date(),
      triagedAt: null,
      resolvedAt: null,
      resolutionTime: null,
      assignedTo: null
    };

    this.incidents.push(incident);
    if (this.incidents.length > this.maxHistory) {
      this.incidents.shift();
    }
  }

  public updateIncidentStatus(errorId: string, status: {
    triagedAt?: Date;
    resolvedAt?: Date;
    assignedTo?: string;
  }): void {
    const incident = this.incidents.find(i => i.errorId === errorId);
    if (!incident) return;

    if (status.triagedAt) incident.triagedAt = status.triagedAt;
    if (status.resolvedAt) {
      incident.resolvedAt = status.resolvedAt;
      incident.resolutionTime = status.resolvedAt.getTime() - incident.occurredAt.getTime();
    }
    if (status.assignedTo) incident.assignedTo = status.assignedTo;
  }

  public getMetrics(): ErrorMetrics {
    if (this.errors.length === 0) {
      return {
        totalErrors: 0,
        errorsBySeverity: {},
        errorsByType: {},
        meanTimeToResolve: null,
        resolutionRate: 0,
        firstOccurrence: null,
        lastOccurrence: null
      };
    }

    // Calculate basic metrics
    const errorsBySeverity: Record<string, number> = {};
    const errorsByType: Record<string, number> = {};

    this.errors.forEach(error => {
      errorsBySeverity[error.severity] = (errorsBySeverity[error.severity] || 0) + 1;
      errorsByType[error.name] = (errorsByType[error.name] || 0) + 1;
    });

    // Calculate resolution metrics
    const resolvedIncidents = this.incidents.filter(i => i.resolvedAt !== null);
    const resolutionRate = this.incidents.length > 0
      ? (resolvedIncidents.length / this.incidents.length) * 100
      : 0;

    const meanTimeToResolve = resolvedIncidents.length > 0
      ? resolvedIncidents.reduce((sum, incident) => sum + (incident.resolutionTime || 0), 0) / resolvedIncidents.length
      : null;

    return {
      totalErrors: this.errors.length,
      errorsBySeverity,
      errorsByType,
      meanTimeToResolve: meanTimeToResolve ? meanTimeToResolve / 1000 : null, // Convert to seconds
      resolutionRate,
      firstOccurrence: this.errors[0]?.timestamp || null,
      lastOccurrence: this.errors[this.errors.length - 1]?.timestamp || null
    };
  }

  public getMeanTimeToDebug(): number | null {
    const metrics = this.getMetrics();
    return metrics.meanTimeToResolve;
  }

  public getIncidentTimelines(): IncidentTimeline[] {
    return [...this.incidents];
  }

  public getErrorTrends(): { date: string; count: number }[] {
    const trends: Record<string, number> = {};

    this.errors.forEach(error => {
      const date = error.timestamp.toISOString().split('T')[0];
      trends[date] = (trends[date] || 0) + 1;
    });

    return Object.entries(trends)
      .map(([date, count]) => ({ date, count }))
      .sort((a, b) => a.date.localeCompare(b.date));
  }

  public getTopErrors(limit: number = 5): Array<{
    errorType: string;
    count: number;
    severity: string;
  }> {
    const errorCounts: Record<string, { count: number; severity: string }> = {};

    this.errors.forEach(error => {
      const key = `${error.name}-${error.message}`;
      if (!errorCounts[key]) {
        errorCounts[key] = { count: 0, severity: error.severity };
      }
      errorCounts[key].count++;
    });

    return Object.entries(errorCounts)
      .map(([errorType, data]) => ({
        errorType,
        count: data.count,
        severity: data.severity
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, limit);
  }

  public clearData(): void {
    this.errors = [];
    this.incidents = [];
  }
}