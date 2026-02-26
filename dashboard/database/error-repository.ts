import { prisma } from './client.js';
import type { UniversalError, ErrorSeverity } from '../../src/types/index.js';

export interface ErrorFilters {
  severity?: ErrorSeverity[];
  status?: string[];
  service?: string;
  platform?: string[];
  search?: string;
  dateFrom?: string;
  dateTo?: string;
  projectId?: string;
}

export interface ErrorListOptions {
  page?: number;
  limit?: number;
  sortBy?: 'timestamp' | 'severity' | 'count';
  sortOrder?: 'asc' | 'desc';
  filters?: ErrorFilters;
}

export interface ErrorListResult {
  data: ErrorRecordDTO[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface ErrorRecordDTO {
  id: string;
  errorId: string;
  name: string;
  message: string;
  severity: ErrorSeverity;
  status: string;
  context: Record<string, unknown>;
  metadata: Record<string, unknown>;
  stack?: string;
  fingerprint: string;
  timestamp: Date;
  createdAt: Date;
  assignedTo?: string;
  resolvedAt?: Date;
  ignoredAt?: Date;
  projectId?: string;
  occurrenceCount?: number;
}

export interface ErrorStatistics {
  total: number;
  bySeverity: Record<string, number>;
  byStatus: Record<string, number>;
  byPlatform: Record<string, number>;
  byService: Record<string, number>;
  recent: ErrorRecordDTO[];
  trends: ErrorTrend[];
}

export interface ErrorTrend {
  date: string;
  count: number;
  critical: number;
  high: number;
}

export interface ErrorGroup {
  fingerprint: string;
  count: number;
  firstOccurrence: Date;
  lastOccurrence: Date;
  severity: ErrorSeverity;
  sampleError: ErrorRecordDTO;
  services: string[];
  platforms: string[];
}

/**
 * Create fingerprint for error grouping
 */
export function createFingerprint(error: UniversalError): string {
  const crypto = await import('crypto');
  // Create hash based on error type, message, and stack trace
  const content = `${error.name}|${error.message}|${error.stack || ''}`;
  return crypto.createHash('sha256').update(content).digest('hex').substring(0, 16);
}

/**
 * Store a new error
 */
export async function storeError(error: UniversalError, projectId?: string): Promise<ErrorRecordDTO> {
  const fingerprint = createFingerprint(error);
  
  // Check if similar error exists
  const existingError = await prisma.errorRecord.findUnique({
    where: { fingerprint },
  });
  
  if (existingError) {
    // Create occurrence
    await prisma.errorOccurrence.create({
      data: {
        errorId: existingError.id,
        context: JSON.stringify(error.context),
      },
    });
    
    // Update last occurrence timestamp
    await prisma.errorRecord.update({
      where: { id: existingError.id },
      data: { updatedAt: new Date() },
    });
    
    return errorRecordToDTO(existingError);
  }
  
  // Create new error record
  const errorRecord = await prisma.errorRecord.create({
    data: {
      errorId: error.errorId,
      name: error.name,
      message: error.message,
      severity: error.severity,
      context: JSON.stringify(error.context),
      metadata: JSON.stringify(error.metadata),
      stack: error.stack || null,
      fingerprint,
      timestamp: error.timestamp,
      projectId: projectId || null,
    },
  });
  
  return errorRecordToDTO(errorRecord);
}

/**
 * Get error by ID
 */
export async function getErrorById(id: string): Promise<ErrorRecordDTO | null> {
  const error = await prisma.errorRecord.findUnique({
    where: { id },
    include: {
      _count: {
        select: { occurrences: true },
      },
    },
  });
  
  if (!error) return null;
  
  return errorRecordToDTO(error, error._count.occurrences);
}

/**
 * Get error by errorId
 */
export async function getErrorByErrorId(errorId: string): Promise<ErrorRecordDTO | null> {
  const error = await prisma.errorRecord.findUnique({
    where: { errorId },
    include: {
      _count: {
        select: { occurrences: true },
      },
    },
  });
  
  if (!error) return null;
  
  return errorRecordToDTO(error, error._count.occurrences);
}

/**
 * List errors with pagination and filtering
 */
export async function listErrors(options: ErrorListOptions = {}): Promise<ErrorListResult> {
  const {
    page = 1,
    limit = 20,
    sortBy = 'timestamp',
    sortOrder = 'desc',
    filters = {},
  } = options;
  
  const skip = (page - 1) * limit;
  
  // Build where clause
  const where: Record<string, unknown> = {};
  
  if (filters.severity && filters.severity.length > 0) {
    where.severity = { in: filters.severity };
  }
  
  if (filters.status && filters.status.length > 0) {
    where.status = { in: filters.status };
  }
  
  if (filters.projectId) {
    where.projectId = filters.projectId;
  }
  
  if (filters.dateFrom || filters.dateTo) {
    where.timestamp = {};
    if (filters.dateFrom) {
      (where.timestamp as Record<string, string>).gte = filters.dateFrom;
    }
    if (filters.dateTo) {
      (where.timestamp as Record<string, string>).lte = filters.dateTo;
    }
  }
  
  if (filters.search) {
    where.OR = [
      { message: { contains: filters.search } },
      { name: { contains: filters.search } },
    ];
  }
  
  // Get total count
  const total = await prisma.errorRecord.count({ where });
  
  // Get errors
  const errors = await prisma.errorRecord.findMany({
    where,
    skip,
    take: limit,
    orderBy: {
      [sortBy]: sortOrder,
    },
    include: {
      _count: {
        select: { occurrences: true },
      },
    },
  });
  
  return {
    data: errors.map(e => errorRecordToDTO(e, e._count.occurrences)),
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
}

/**
 * Get error statistics
 */
export async function getStatistics(timeRange?: { from: string; to: string }): Promise<ErrorStatistics> {
  const where: Record<string, unknown> = {};
  
  if (timeRange) {
    where.timestamp = {
      gte: timeRange.from,
      lte: timeRange.to,
    };
  }
  
  const [total, bySeverity, byStatus, recent] = await Promise.all([
    prisma.errorRecord.count({ where }),
    prisma.errorRecord.groupBy({
      by: ['severity'],
      where,
      _count: true,
    }),
    prisma.errorRecord.groupBy({
      by: ['status'],
      where,
      _count: true,
    }),
    prisma.errorRecord.findMany({
      where,
      orderBy: { timestamp: 'desc' },
      take: 10,
    }),
  ]);
  
  // Get platform stats from metadata
  const allErrors = await prisma.errorRecord.findMany({
    where,
    select: { metadata: true },
  });
  
  const byPlatform: Record<string, number> = {};
  const byService: Record<string, number> = {};
  
  allErrors.forEach(error => {
    try {
      const metadata = JSON.parse(error.metadata as string) as Record<string, unknown>;
      const platform = String(metadata.platform || 'unknown');
      const service = String(metadata.serviceName || 'unknown');
      
      byPlatform[platform] = (byPlatform[platform] || 0) + 1;
      byService[service] = (byService[service] || 0) + 1;
    } catch {
      byPlatform.unknown = (byPlatform.unknown || 0) + 1;
    }
  });
  
  // Get trends (last 7 days)
  const trends = await getErrorTrends(timeRange);
  
  return {
    total,
    bySeverity: Object.fromEntries(bySeverity.map(s => [s.severity, s._count])),
    byStatus: Object.fromEntries(byStatus.map(s => [s.status, s._count])),
    byPlatform,
    byService,
    recent: recent.map(errorRecordToDTO),
    trends,
  };
}

/**
 * Get error trends over time
 */
async function getErrorTrends(timeRange?: { from: string; to: string }): Promise<ErrorTrend[]> {
  // Simple implementation - group by date
  const errors = await prisma.errorRecord.findMany({
    where: timeRange ? { timestamp: { gte: timeRange.from, lte: timeRange.to } } : {},
    select: { timestamp: true, severity: true },
  });
  
  const trendsMap = new Map<string, { count: number; critical: number; high: number }>();
  
  errors.forEach(error => {
    const date = error.timestamp.toISOString().split('T')[0];
    const existing = trendsMap.get(date) || { count: 0, critical: 0, high: 0 };
    
    existing.count++;
    if (error.severity === 'critical') existing.critical++;
    if (error.severity === 'high') existing.high++;
    
    trendsMap.set(date, existing);
  });
  
  return Array.from(trendsMap.entries())
    .map(([date, data]) => ({
      date,
      count: data.count,
      critical: data.critical,
      high: data.high,
    }))
    .sort((a, b) => a.date.localeCompare(b.date));
}

/**
 * Get error groups (clustered by fingerprint)
 */
export async function getErrorGroups(projectId?: string): Promise<ErrorGroup[]> {
  const groups = await prisma.errorRecord.groupBy({
    by: ['fingerprint', 'severity'],
    where: projectId ? { projectId } : {},
    _count: true,
    _min: { timestamp: true },
    _max: { timestamp: true },
    orderBy: {
      _count: {
        id: 'desc',
      },
    },
  });
  
  // Get sample error for each group
  const result: ErrorGroup[] = [];
  
  for (const group of groups) {
    const sampleError = await prisma.errorRecord.findFirst({
      where: {
        fingerprint: group.fingerprint,
        ...(projectId && { projectId }),
      },
      orderBy: { timestamp: 'desc' },
    });
    
    if (sampleError) {
      result.push({
        fingerprint: group.fingerprint,
        count: group._count,
        firstOccurrence: group._min.timestamp!,
        lastOccurrence: group._max.timestamp!,
        severity: group.severity as ErrorSeverity,
        sampleError: errorRecordToDTO(sampleError),
        services: [],
        platforms: [],
      });
    }
  }
  
  return result;
}

/**
 * Update error status
 */
export async function updateErrorStatus(
  errorId: string,
  status: string,
  assignedTo?: string
): Promise<ErrorRecordDTO> {
  const updateData: Record<string, unknown> = {
    status,
    assignedTo,
  };
  
  if (status === 'RESOLVED') {
    updateData.resolvedAt = new Date();
  }
  
  if (status === 'IGNORED') {
    updateData.ignoredAt = new Date();
  }
  
  const updated = await prisma.errorRecord.update({
    where: { errorId },
    data: updateData,
    include: {
      _count: {
        select: { occurrences: true },
      },
    },
  });
  
  return errorRecordToDTO(updated, updated._count.occurrences);
}

/**
 * Delete error
 */
export async function deleteError(errorId: string): Promise<void> {
  await prisma.errorRecord.delete({
    where: { errorId },
  });
}

/**
 * Clear all errors
 */
export async function clearAllErrors(projectId?: string): Promise<number> {
  const result = await prisma.errorRecord.deleteMany({
    where: projectId ? { projectId } : {},
  });
  
  return result.count;
}

/**
 * Convert Prisma error record to DTO
 */
function errorRecordToDTO(
  record: Record<string, unknown>,
  occurrenceCount?: number
): ErrorRecordDTO {
  return {
    id: String(record.id),
    errorId: String(record.errorId),
    name: String(record.name),
    message: String(record.message),
    severity: record.severity as ErrorSeverity,
    status: String(record.status || 'OPEN'),
    context: JSON.parse(String(record.context || '{}')),
    metadata: JSON.parse(String(record.metadata || '{}')),
    stack: record.stack ? String(record.stack) : undefined,
    fingerprint: String(record.fingerprint),
    timestamp: record.timestamp as Date,
    createdAt: record.createdAt as Date,
    assignedTo: record.assignedTo ? String(record.assignedTo) : undefined,
    resolvedAt: record.resolvedAt ? (record.resolvedAt as Date) : undefined,
    ignoredAt: record.ignoredAt ? (record.ignoredAt as Date) : undefined,
    projectId: record.projectId ? String(record.projectId) : undefined,
    occurrenceCount: occurrenceCount || 0,
  };
}
