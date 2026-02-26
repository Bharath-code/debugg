/**
 * AI-Powered Error Clustering Service
 * Uses similarity algorithms to automatically group related errors
 */

import { createHash } from 'crypto';

export interface ErrorCluster {
  id: string;
  fingerprint: string;
  errors: any[];
  count: number;
  firstOccurrence: Date;
  lastOccurrence: Date;
  severity: string;
  sampleError: any;
  services: string[];
  platforms: string[];
  similarity: number;
  rootCause?: string;
  suggestedFix?: string;
}

export interface ClusterAnalysis {
  totalClusters: number;
  totalErrors: number;
  topClusters: ErrorCluster[];
  emergingClusters: ErrorCluster[];
  resolvedClusters: ErrorCluster[];
}

class ErrorClusteringService {
  private clusters: Map<string, ErrorCluster> = new Map();
  private readonly SIMILARITY_THRESHOLD = 0.8;

  /**
   * Create fingerprint for error grouping
   */
  createFingerprint(error: any): string {
    // Create hash based on error type, message, and stack trace
    const content = `${error.name}|${error.message}|${this.normalizeStack(error.stack)}`;
    return createHash('sha256').update(content).digest('hex').substring(0, 16);
  }

  /**
   * Normalize stack trace for comparison
   */
  private normalizeStack(stack?: string): string {
    if (!stack) return '';
    
    // Remove line numbers and file paths for better grouping
    return stack
      .replace(/at\s+.*?\((.*?):\d+:\d+\)/g, 'at $1')
      .replace(/at\s+(.*?):\d+:\d+/g, 'at $1')
      .split('\n')
      .slice(0, 5)
      .join('\n');
  }

  /**
   * Calculate similarity between two errors
   */
  calculateSimilarity(error1: any, error2: any): number {
    let score = 0;
    let factors = 0;

    // Error name match (weight: 30%)
    if (error1.name === error2.name) {
      score += 0.3;
    }
    factors += 0.3;

    // Message similarity (weight: 40%)
    const messageSimilarity = this.stringSimilarity(error1.message, error2.message);
    score += messageSimilarity * 0.4;
    factors += 0.4;

    // Stack trace similarity (weight: 30%)
    if (error1.stack && error2.stack) {
      const stackSimilarity = this.stringSimilarity(
        this.normalizeStack(error1.stack),
        this.normalizeStack(error2.stack)
      );
      score += stackSimilarity * 0.3;
    }
    factors += 0.3;

    return score / factors;
  }

  /**
   * Calculate string similarity using Levenshtein distance
   */
  private stringSimilarity(str1: string, str2: string): number {
    const longer = str1.length > str2.length ? str1 : str2;
    const shorter = str1.length > str2.length ? str2 : str1;
    
    if (longer.length === 0) return 1;
    
    const editDistance = this.levenshteinDistance(longer, shorter);
    return (longer.length - editDistance) / longer.length;
  }

  /**
   * Calculate Levenshtein distance between two strings
   */
  private levenshteinDistance(str1: string, str2: string): number {
    const matrix: number[][] = [];

    for (let i = 0; i <= str2.length; i++) {
      matrix[i] = [i];
    }

    for (let j = 0; j <= str1.length; j++) {
      matrix[0][j] = j;
    }

    for (let i = 1; i <= str2.length; i++) {
      for (let j = 1; j <= str1.length; j++) {
        if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
          matrix[i][j] = matrix[i - 1][j - 1];
        } else {
          matrix[i][j] = Math.min(
            matrix[i - 1][j - 1] + 1,
            matrix[i][j - 1] + 1,
            matrix[i - 1][j] + 1
          );
        }
      }
    }

    return matrix[str2.length][str1.length];
  }

  /**
   * Cluster errors by similarity
   */
  clusterErrors(errors: any[]): ErrorCluster[] {
    const clusters: ErrorCluster[] = [];

    for (const error of errors) {
      const fingerprint = this.createFingerprint(error);
      
      // Check if error belongs to existing cluster
      let existingCluster = clusters.find(c => c.fingerprint === fingerprint);
      
      if (!existingCluster) {
        // Check similarity with existing clusters
        existingCluster = clusters.find(c => 
          this.calculateSimilarity(error, c.sampleError) >= this.SIMILARITY_THRESHOLD
        );
      }

      if (existingCluster) {
        // Add to existing cluster
        existingCluster.errors.push(error);
        existingCluster.count++;
        existingCluster.lastOccurrence = new Date(error.timestamp);
        
        // Update services and platforms
        if (error.metadata?.serviceName && !existingCluster.services.includes(error.metadata.serviceName)) {
          existingCluster.services.push(error.metadata.serviceName);
        }
        if (error.metadata?.platform && !existingCluster.platforms.includes(error.metadata.platform)) {
          existingCluster.platforms.push(error.metadata.platform);
        }
      } else {
        // Create new cluster
        clusters.push({
          id: `cluster_${clusters.length}_${Date.now()}`,
          fingerprint,
          errors: [error],
          count: 1,
          firstOccurrence: new Date(error.timestamp),
          lastOccurrence: new Date(error.timestamp),
          severity: error.severity,
          sampleError: error,
          services: error.metadata?.serviceName ? [error.metadata.serviceName] : [],
          platforms: error.metadata?.platform ? [error.metadata.platform] : [],
          similarity: 1.0
        });
      }
    }

    // Sort by count (most common first)
    return clusters.sort((a, b) => b.count - a.count);
  }

  /**
   * Analyze clusters for insights
   */
  analyzeClusters(clusters: ErrorCluster[], timeRange: { from: Date; to: Date }): ClusterAnalysis {
    const now = new Date();
    const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);
    const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);

    return {
      totalClusters: clusters.length,
      totalErrors: clusters.reduce((sum, c) => sum + c.count, 0),
      topClusters: clusters.slice(0, 10),
      emergingClusters: clusters.filter(c => c.firstOccurrence >= oneHourAgo),
      resolvedClusters: clusters.filter(c => c.lastOccurrence < oneDayAgo)
    };
  }

  /**
   * Get root cause suggestions (basic implementation)
   */
  suggestRootCause(cluster: ErrorCluster): string | undefined {
    const error = cluster.sampleError;
    
    // Pattern matching for common errors
    if (error.message.includes('Cannot read property')) {
      return 'Null/undefined reference - Check if object exists before accessing properties';
    }
    
    if (error.message.includes('is not a function')) {
      return 'Type error - Verify the variable is a function before calling';
    }
    
    if (error.message.includes('timeout') || error.message.includes('ETIMEDOUT')) {
      return 'Network timeout - Check network connectivity and increase timeout if needed';
    }
    
    if (error.message.includes('ECONNREFUSED')) {
      return 'Connection refused - Verify the service is running and accessible';
    }
    
    if (error.name === 'SyntaxError') {
      return 'Syntax error - Check for typos or invalid syntax in code';
    }
    
    return undefined;
  }

  /**
   * Get fix suggestions
   */
  suggestFix(cluster: ErrorCluster): string | undefined {
    const error = cluster.sampleError;
    
    if (error.message.includes('Cannot read property')) {
      return 'Use optional chaining (?.) or add null checks before accessing properties';
    }
    
    if (error.message.includes('timeout')) {
      return 'Increase timeout value or implement retry logic with exponential backoff';
    }
    
    if (error.message.includes('ECONNREFUSED')) {
      return 'Ensure the target service is running and firewall rules allow connections';
    }
    
    return undefined;
  }

  /**
   * Get cluster statistics
   */
  getClusterStats(clusters: ErrorCluster[]): ClusterStats {
    return {
      totalClusters: clusters.length,
      totalErrors: clusters.reduce((sum, c) => sum + c.count, 0),
      avgErrorsPerCluster: clusters.reduce((sum, c) => sum + c.count, 0) / clusters.length,
      maxClusterSize: Math.max(...clusters.map(c => c.count)),
      minClusterSize: Math.min(...clusters.map(c => c.count)),
      bySeverity: clusters.reduce((acc, c) => {
        acc[c.severity] = (acc[c.severity] || 0) + c.count;
        return acc;
      }, {} as Record<string, number>)
    };
  }
}

export interface ClusterStats {
  totalClusters: number;
  totalErrors: number;
  avgErrorsPerCluster: number;
  maxClusterSize: number;
  minClusterSize: number;
  bySeverity: Record<string, number>;
}

// Singleton instance
const clusteringService = new ErrorClusteringService();

export default clusteringService;
export { ErrorClusteringService };
