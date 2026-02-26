/**
 * Redis Client Configuration
 * Provides scalable storage for sessions, rate limiting, and caching
 */

import { Redis } from 'ioredis';

export interface RedisConfig {
  host: string;
  port: number;
  password?: string;
  db?: number;
  keyPrefix?: string;
  retryStrategy?: (times: number) => number | null;
}

// Singleton pattern for Redis connection
let redisClient: Redis | null = null;

/**
 * Get Redis configuration from environment
 */
function getRedisConfig(): RedisConfig {
  return {
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT || '6379'),
    password: process.env.REDIS_PASSWORD || undefined,
    db: parseInt(process.env.REDIS_DB || '0'),
    keyPrefix: process.env.REDIS_PREFIX || 'debugg:',
    retryStrategy: (times: number) => {
      if (times > 3) {
        console.error('[Redis] Max retry attempts reached');
        return null;
      }
      // Exponential backoff
      return Math.min(times * 200, 3000);
    },
  };
}

/**
 * Get or create Redis client
 */
export function getRedisClient(): Redis {
  if (!redisClient) {
    const config = getRedisConfig();
    
    redisClient = new Redis({
      host: config.host,
      port: config.port,
      password: config.password,
      db: config.db,
      keyPrefix: config.keyPrefix,
      retryStrategy: config.retryStrategy,
      maxRetriesPerRequest: 3,
      lazyConnect: true,
      showFriendlyErrorStack: true,
    });

    // Event handlers
    redisClient.on('connect', () => {
      console.log('[Redis] Connected successfully');
    });

    redisClient.on('error', (error) => {
      console.error('[Redis] Error:', error.message);
    });

    redisClient.on('close', () => {
      console.log('[Redis] Connection closed');
    });

    redisClient.on('reconnecting', (delay: number) => {
      console.log(`[Redis] Reconnecting in ${delay}ms`);
    });
  }

  return redisClient;
}

/**
 * Check Redis connection health
 */
export async function checkRedisHealth(): Promise<boolean> {
  try {
    const client = getRedisClient();
    await client.ping();
    return true;
  } catch (error) {
    console.error('[Redis] Health check failed:', (error as Error).message);
    return false;
  }
}

/**
 * Disconnect Redis client (for graceful shutdown)
 */
export async function disconnectRedis(): Promise<void> {
  if (redisClient) {
    await redisClient.quit();
    redisClient = null;
    console.log('[Redis] Disconnected');
  }
}

/**
 * Clear all keys with current prefix (for development only!)
 */
export async function clearRedis(): Promise<void> {
  if (process.env.NODE_ENV === 'production') {
    throw new Error('[Redis] clearRedis is not allowed in production');
  }
  
  const client = getRedisClient();
  const keys = await client.keys('*');
  if (keys.length > 0) {
    await client.del(...keys);
    console.log(`[Redis] Cleared ${keys.length} keys`);
  }
}

/**
 * Get Redis stats
 */
export async function getRedisStats(): Promise<RedisStats> {
  const client = getRedisClient();
  const info = await client.info('stats');
  const keysCount = await client.dbsize();
  
  return {
    connected: true,
    keysCount,
    info: info.substring(0, 500) + '...',
  };
}

export interface RedisStats {
  connected: boolean;
  keysCount: number;
  info: string;
}

/**
 * Check if Redis is configured
 */
export function isRedisConfigured(): boolean {
  return !!process.env.REDIS_HOST || !!process.env.REDIS_URL;
}

/**
 * Get Redis URL from environment (for connection strings)
 */
export function getRedisUrl(): string | undefined {
  return process.env.REDIS_URL;
}
