/**
 * Redis-based Rate Limiter
 * Scalable rate limiting that works across multiple server instances
 */

import { Request, Response, NextFunction } from 'express';
import { getRedisClient, isRedisConfigured } from '../lib/redis.js';

export interface RateLimitConfig {
  windowMs: number;        // Time window in milliseconds
  maxRequests: number;     // Max requests per window
  message: string;         // Error message
  skipSuccessfulRequests?: boolean;
  skipFailedRequests?: boolean;
}

/**
 * Create rate limiter using Redis
 */
export function createRateLimiter(config: Partial<RateLimitConfig> = {}) {
  const limiterConfig: RateLimitConfig = {
    windowMs: 15 * 60 * 1000, // 15 minutes
    maxRequests: 100,
    message: 'Too many requests, please try again later.',
    skipSuccessfulRequests: false,
    skipFailedRequests: false,
    ...config,
  };

  return async function rateLimitMiddleware(req: Request, res: Response, next: NextFunction): Promise<void> {
    // Skip if Redis not configured (fallback to no rate limiting)
    if (!isRedisConfigured()) {
      console.warn('[RateLimiter] Redis not configured, skipping rate limiting');
      return next();
    }

    try {
      const redis = getRedisClient();
      
      // Get client identifier
      const clientId = getClientIdentifier(req);
      const key = `ratelimit:${clientId}`;
      
      // Get current count from Redis
      const current = await redis.incr(key);
      
      // Set expiry on first request
      if (current === 1) {
        await redis.expire(key, Math.ceil(limiterConfig.windowMs / 1000));
      }
      
      // Get TTL for reset time
      const ttl = await redis.ttl(key);
      const resetTime = Date.now() + (ttl > 0 ? ttl * 1000 : limiterConfig.windowMs);
      
      // Set rate limit headers
      res.setHeader('X-RateLimit-Limit', limiterConfig.maxRequests.toString());
      res.setHeader('X-RateLimit-Remaining', Math.max(0, limiterConfig.maxRequests - current).toString());
      res.setHeader('X-RateLimit-Reset', resetTime.toString());
      
      // Check if limit exceeded
      if (current > limiterConfig.maxRequests) {
        const retryAfter = Math.ceil((resetTime - Date.now()) / 1000);
        res.setHeader('Retry-After', retryAfter.toString());
        
        res.status(429).json({
          success: false,
          error: 'Too Many Requests',
          message: limiterConfig.message,
          retryAfter,
        });
        return;
      }
      
      next();
    } catch (error) {
      // If Redis fails, allow the request (fail open)
      console.error('[RateLimiter] Error:', (error as Error).message);
      next();
    }
  };
}

/**
 * Get client identifier for rate limiting
 */
function getClientIdentifier(req: Request): string {
  // Try API key first
  const apiKey = req.headers['x-api-key'] as string;
  if (apiKey) {
    return `api:${apiKey}`;
  }

  // Try Bearer token
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    return `bearer:${authHeader.substring(7)}`;
  }

  // Fall back to IP address
  const ip = req.ip || req.socket.remoteAddress || 'unknown';
  return `ip:${ip.replace(/[^a-zA-Z0-9]/g, '')}`;
}

/**
 * Strict rate limiter for login attempts
 */
export const loginRateLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000, // 15 minutes
  maxRequests: 5, // 5 attempts per 15 minutes
  message: 'Too many login attempts, please try again after 15 minutes.',
  skipSuccessfulRequests: true,
});

/**
 * Standard API rate limiter
 */
export const apiRateLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000, // 15 minutes
  maxRequests: 100, // 100 requests per 15 minutes
  message: 'Too many API requests, please try again later.',
});

/**
 * Aggressive rate limiter for sensitive endpoints
 */
export const strictRateLimiter = createRateLimiter({
  windowMs: 60 * 1000, // 1 minute
  maxRequests: 10, // 10 requests per minute
  message: 'Too many requests. Please slow down.',
});

/**
 * Reset rate limit for a client
 */
export async function resetRateLimit(clientId: string): Promise<void> {
  if (!isRedisConfigured()) return;
  
  try {
    const redis = getRedisClient();
    const key = `ratelimit:${clientId}`;
    await redis.del(key);
  } catch (error) {
    console.error('[RateLimiter] Reset failed:', (error as Error).message);
  }
}

/**
 * Get current rate limit status for a client
 */
export async function getRateLimitStatus(clientId: string): Promise<RateLimitStatus> {
  if (!isRedisConfigured()) {
    return { allowed: true, remaining: Infinity, resetTime: 0 };
  }
  
  try {
    const redis = getRedisClient();
    const key = `ratelimit:${clientId}`;
    
    const current = await redis.get(key);
    const ttl = await redis.ttl(key);
    
    return {
      allowed: true,
      remaining: Math.max(0, 100 - (parseInt(current || '0'))),
      resetTime: Date.now() + (ttl > 0 ? ttl * 1000 : 0),
    };
  } catch (error) {
    console.error('[RateLimiter] Status check failed:', (error as Error).message);
    return { allowed: true, remaining: Infinity, resetTime: 0 };
  }
}

export interface RateLimitStatus {
  allowed: boolean;
  remaining: number;
  resetTime: number;
}
