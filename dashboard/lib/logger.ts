/**
 * Structured Logging Utility
 * Provides consistent, searchable logs for production monitoring
 */

export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

export interface LogEntry {
  timestamp: string;
  level: LogLevel;
  message: string;
  context?: Record<string, unknown>;
  error?: {
    name: string;
    message: string;
    stack?: string;
  };
  requestId?: string;
  userId?: string;
  ip?: string;
}

class Logger {
  private level: LogLevel;
  private service: string;
  private version: string;

  constructor() {
    this.level = (process.env.LOG_LEVEL as LogLevel) || 'info';
    this.service = process.env.SERVICE_NAME || 'debugg-dashboard';
    this.version = process.env.npm_package_version || '2.0.0';
  }

  /**
   * Log a debug message
   */
  debug(message: string, context?: Record<string, unknown>): void {
    this.log('debug', message, context);
  }

  /**
   * Log an info message
   */
  info(message: string, context?: Record<string, unknown>): void {
    this.log('info', message, context);
  }

  /**
   * Log a warning message
   */
  warn(message: string, context?: Record<string, unknown>): void {
    this.log('warn', message, context);
  }

  /**
   * Log an error message
   */
  error(message: string, error?: Error, context?: Record<string, unknown>): void {
    this.log('error', message, {
      ...context,
      error: error ? {
        name: error.name,
        message: error.message,
        stack: error.stack,
      } : undefined,
    });
  }

  /**
   * Core log method
   */
  private log(level: LogLevel, message: string, context?: Record<string, unknown>): void {
    // Check if this level should be logged
    if (!this.shouldLog(level)) {
      return;
    }

    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level,
      message,
      context: {
        service: this.service,
        version: this.version,
        ...context,
      },
    };

    // Output based on level
    const output = this.formatLog(entry);
    
    switch (level) {
      case 'debug':
        console.debug(output);
        break;
      case 'info':
        console.info(output);
        break;
      case 'warn':
        console.warn(output);
        break;
      case 'error':
        console.error(output);
        break;
    }
  }

  /**
   * Check if a log level should be output
   */
  private shouldLog(level: LogLevel): boolean {
    const levels: LogLevel[] = ['debug', 'info', 'warn', 'error'];
    const currentLevelIndex = levels.indexOf(this.level);
    const targetLevelIndex = levels.indexOf(level);
    
    return targetLevelIndex >= currentLevelIndex;
  }

  /**
   * Format log entry for output
   */
  private formatLog(entry: LogEntry): string {
    // Production: JSON format for log aggregation
    if (process.env.NODE_ENV === 'production') {
      return JSON.stringify(entry);
    }
    
    // Development: Human-readable format
    const color = this.getLevelColor(entry.level);
    const timestamp = entry.timestamp.split('T')[1].split('.')[0];
    const contextStr = entry.context ? ` ${JSON.stringify(entry.context)}` : '';
    
    return `\x1b[${color}m[${timestamp}] [${entry.level.toUpperCase()}]\x1b[0m ${entry.message}${contextStr}`;
  }

  /**
   * Get ANSI color code for log level
   */
  private getLevelColor(level: LogLevel): string {
    switch (level) {
      case 'debug': return '36'; // Cyan
      case 'info': return '32';  // Green
      case 'warn': return '33';  // Yellow
      case 'error': return '31'; // Red
      default: return '37';      // White
    }
  }

  /**
   * Create a child logger with additional context
   */
  child(context: Record<string, unknown>): Logger {
    const parentLogger = this;
    
    return {
      debug: (message: string, childContext?: Record<string, unknown>) =>
        parentLogger.debug(message, { ...context, ...childContext }),
      info: (message: string, childContext?: Record<string, unknown>) =>
        parentLogger.info(message, { ...context, ...childContext }),
      warn: (message: string, childContext?: Record<string, unknown>) =>
        parentLogger.warn(message, { ...context, ...childContext }),
      error: (message: string, error?: Error, childContext?: Record<string, unknown>) =>
        parentLogger.error(message, error, { ...context, ...childContext }),
    };
  }
}

// Export singleton instance
export const logger = new Logger();

/**
 * Express middleware for request logging
 */
export function requestLogger(req: any, res: any, next: NextFunction): void {
  const start = Date.now();
  const requestId = generateRequestId();
  
  // Add request ID to response headers
  res.setHeader('X-Request-ID', requestId);
  
  // Create request-specific logger
  const reqLogger = logger.child({
    requestId,
    method: req.method,
    path: req.path,
    ip: req.ip,
  });
  
  // Log request start
  reqLogger.info('Request started');
  
  // Log response
  res.on('finish', () => {
    const duration = Date.now() - start;
    const logData = {
      statusCode: res.statusCode,
      duration,
      userAgent: req.get('user-agent'),
    };
    
    if (res.statusCode >= 500) {
      reqLogger.error('Request failed', undefined, logData);
    } else if (res.statusCode >= 400) {
      reqLogger.warn('Request error', logData);
    } else {
      reqLogger.info('Request completed', logData);
    }
  });
  
  next();
}

/**
 * Generate unique request ID
 */
function generateRequestId(): string {
  const crypto = require('crypto');
  return crypto.randomBytes(8).toString('hex');
}

// Type for NextFunction
type NextFunction = (err?: any) => void;
