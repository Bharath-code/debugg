/**
 * Centralized Configuration Management
 * Type-safe configuration with validation and defaults
 */

export interface Config {
  // Server
  port: number;
  nodeEnv: 'development' | 'production' | 'test';
  
  // Database
  databaseUrl: string;
  databaseType: 'sqlite' | 'postgresql';
  
  // Redis
  redisHost?: string;
  redisPort?: number;
  redisPassword?: string;
  redisEnabled: boolean;
  
  // Authentication
  apiKey: string;
  enableAuth: boolean;
  sessionDuration: number;
  
  // Rate Limiting
  rateLimitWindowMs: number;
  rateLimitMaxRequests: number;
  loginRateLimitMaxAttempts: number;
  
  // Logging
  logLevel: 'debug' | 'info' | 'warn' | 'error';
  
  // Security
  corsOrigins: string[];
  trustProxy: boolean;
  
  // Features
  enableErrorGrouping: boolean;
  enableAutoRefresh: boolean;
  enableExport: boolean;
  
  // Performance
  maxErrors: number;
  errorRetentionDays: number;
}

class ConfigManager {
  private config: Config;
  private static instance: ConfigManager;

  private constructor() {
    this.config = this.loadConfig();
    this.validateConfig();
  }

  /**
   * Get singleton instance
   */
  static getInstance(): ConfigManager {
    if (!ConfigManager.instance) {
      ConfigManager.instance = new ConfigManager();
    }
    return ConfigManager.instance;
  }

  /**
   * Get configuration value
   */
  get<K extends keyof Config>(key: K): Config[K] {
    return this.config[key];
  }

  /**
   * Get all configuration
   */
  getAll(): Readonly<Config> {
    return { ...this.config };
  }

  /**
   * Load configuration from environment
   */
  private loadConfig(): Config {
    return {
      // Server
      port: parseInt(process.env.PORT || '3001'),
      nodeEnv: (process.env.NODE_ENV as any) || 'development',
      
      // Database
      databaseUrl: process.env.DATABASE_URL || 'file:./dev.db',
      databaseType: process.env.DATABASE_URL?.includes('postgresql') ? 'postgresql' : 'sqlite',
      
      // Redis
      redisHost: process.env.REDIS_HOST,
      redisPort: parseInt(process.env.REDIS_PORT || '6379'),
      redisPassword: process.env.REDIS_PASSWORD,
      redisEnabled: !!process.env.REDIS_HOST,
      
      // Authentication
      apiKey: process.env.DASHBOARD_API_KEY || 'debugg-dev-key-change-in-production',
      enableAuth: process.env.ENABLE_AUTH === 'true' || process.env.NODE_ENV === 'production',
      sessionDuration: parseInt(process.env.SESSION_DURATION || '86400000'),
      
      // Rate Limiting
      rateLimitWindowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000'),
      rateLimitMaxRequests: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100'),
      loginRateLimitMaxAttempts: parseInt(process.env.LOGIN_RATE_LIMIT_MAX_ATTEMPTS || '5'),
      
      // Logging
      logLevel: (process.env.LOG_LEVEL as any) || 'info',
      
      // Security
      corsOrigins: (process.env.CORS_ORIGINS || '').split(',').filter(Boolean),
      trustProxy: process.env.TRUST_PROXY === 'true',
      
      // Features
      enableErrorGrouping: process.env.ENABLE_ERROR_GROUPING !== 'false',
      enableAutoRefresh: process.env.ENABLE_AUTO_REFRESH !== 'false',
      enableExport: process.env.ENABLE_EXPORT === 'true',
      
      // Performance
      maxErrors: parseInt(process.env.MAX_ERRORS || '0'),
      errorRetentionDays: parseInt(process.env.ERROR_RETENTION_DAYS || '0'),
    };
  }

  /**
   * Validate configuration
   */
  private validateConfig(): void {
    const errors: string[] = [];

    // Validate port
    if (this.config.port < 1 || this.config.port > 65535) {
      errors.push('PORT must be between 1 and 65535');
    }

    // Validate API key in production
    if (this.config.nodeEnv === 'production' && this.config.enableAuth) {
      if (this.config.apiKey === 'debugg-dev-key-change-in-production') {
        errors.push('DASHBOARD_API_KEY must be changed in production');
      }
    }

    // Validate session duration
    if (this.config.sessionDuration < 3600000 || this.config.sessionDuration > 604800000) {
      errors.push('SESSION_DURATION must be between 1 hour and 7 days');
    }

    // Validate rate limits
    if (this.config.rateLimitMaxRequests < 1 || this.config.rateLimitMaxRequests > 10000) {
      errors.push('RATE_LIMIT_MAX_REQUESTS must be between 1 and 10000');
    }

    if (this.config.loginRateLimitMaxAttempts < 1 || this.config.loginRateLimitMaxAttempts > 20) {
      errors.push('LOGIN_RATE_LIMIT_MAX_ATTEMPTS must be between 1 and 20');
    }

    // Throw if invalid
    if (errors.length > 0) {
      throw new Error(`Configuration validation failed:\n${errors.join('\n')}`);
    }
  }

  /**
   * Check if running in production
   */
  isProduction(): boolean {
    return this.config.nodeEnv === 'production';
  }

  /**
   * Check if running in development
   */
  isDevelopment(): boolean {
    return this.config.nodeEnv === 'development';
  }

  /**
   * Check if running in test mode
   */
  isTest(): boolean {
    return this.config.nodeEnv === 'test';
  }

  /**
   * Get configuration summary (for logging)
   */
  getSummary(): Record<string, any> {
    return {
      port: this.config.port,
      nodeEnv: this.config.nodeEnv,
      databaseType: this.config.databaseType,
      redisEnabled: this.config.redisEnabled,
      authEnabled: this.config.enableAuth,
      authConfigured: this.config.apiKey !== 'debugg-dev-key-change-in-production',
      logLevel: this.config.logLevel,
      isProduction: this.isProduction(),
    };
  }
}

// Export singleton instance
export const config = ConfigManager.getInstance();

// Export types
export type { Config };
