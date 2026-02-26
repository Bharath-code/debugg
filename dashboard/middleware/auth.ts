/**
 * Redis-based Session Management
 * Scalable sessions that work across multiple server instances
 */

import { Request, Response, NextFunction } from 'express';
import { getRedisClient, isRedisConfigured } from '../lib/redis.js';

export interface SessionData {
  userId?: string;
  apiKey?: string;
  authenticated: boolean;
  createdAt: number;
  expiresAt: number;
  ipAddress?: string;
  userAgent?: string;
}

export interface AuthConfig {
  apiKey: string;
  enableAuth: boolean;
  sessionDuration: number; // milliseconds
}

let authConfig: AuthConfig = {
  apiKey: process.env.DASHBOARD_API_KEY || 'debugg-dev-key-change-in-production',
  enableAuth: process.env.ENABLE_AUTH === 'true' || process.env.NODE_ENV === 'production',
  sessionDuration: parseInt(process.env.SESSION_DURATION || '86400000'), // 24 hours
};

/**
 * Update auth configuration
 */
export function updateAuthConfig(config: Partial<AuthConfig>): void {
  authConfig = { ...authConfig, ...config };
}

/**
 * Get current auth configuration
 */
export function getAuthStatus(): { enabled: boolean; configured: boolean } {
  return {
    enabled: authConfig.enableAuth,
    configured: authConfig.apiKey !== 'debugg-dev-key-change-in-production',
  };
}

/**
 * Check if authentication is enabled
 */
export function isAuthEnabled(): boolean {
  return authConfig.enableAuth;
}

/**
 * Create session in Redis
 */
export async function createSession(
  sessionId: string,
  data: SessionData
): Promise<void> {
  if (!isRedisConfigured()) {
    // Fallback: no session storage (stateless)
    return;
  }
  
  try {
    const redis = getRedisClient();
    const key = `session:${sessionId}`;
    const ttl = Math.ceil((data.expiresAt - Date.now()) / 1000);
    
    await redis.setex(key, ttl, JSON.stringify(data));
  } catch (error) {
    console.error('[Session] Create failed:', (error as Error).message);
  }
}

/**
 * Get session from Redis
 */
export async function getSession(sessionId: string): Promise<SessionData | null> {
  if (!isRedisConfigured()) {
    // Fallback: always authenticated if Redis not configured
    return {
      authenticated: true,
      createdAt: Date.now(),
      expiresAt: Date.now() + authConfig.sessionDuration,
    };
  }
  
  try {
    const redis = getRedisClient();
    const key = `session:${sessionId}`;
    const data = await redis.get(key);
    
    if (!data) {
      return null;
    }
    
    return JSON.parse(data) as SessionData;
  } catch (error) {
    console.error('[Session] Get failed:', (error as Error).message);
    return null;
  }
}

/**
 * Delete session from Redis
 */
export async function deleteSession(sessionId: string): Promise<void> {
  if (!isRedisConfigured()) {
    return;
  }
  
  try {
    const redis = getRedisClient();
    const key = `session:${sessionId}`;
    await redis.del(key);
  } catch (error) {
    console.error('[Session] Delete failed:', (error as Error).message);
  }
}

/**
 * Extend session expiry
 */
export async function extendSession(sessionId: string): Promise<void> {
  if (!isRedisConfigured()) {
    return;
  }
  
  try {
    const redis = getRedisClient();
    const key = `session:${sessionId}`;
    const data = await redis.get(key);
    
    if (data) {
      const session = JSON.parse(data) as SessionData;
      session.expiresAt = Date.now() + authConfig.sessionDuration;
      const ttl = Math.ceil(authConfig.sessionDuration / 1000);
      await redis.setex(key, ttl, JSON.stringify(session));
    }
  } catch (error) {
    console.error('[Session] Extend failed:', (error as Error).message);
  }
}

/**
 * Middleware to protect API routes
 */
export function requireAuth(req: Request, res: Response, next: NextFunction): void {
  // Skip auth if disabled
  if (!authConfig.enableAuth) {
    return next();
  }

  // Get API key from header
  const authHeader = req.headers.authorization;
  const apiKey = req.headers['x-api-key'] as string;

  // Check for API key
  if (!authHeader && !apiKey) {
    res.setHeader('WWW-Authenticate', 'ApiKey');
    return res.status(401).json({
      success: false,
      error: 'Authentication required',
      message: 'Please provide an API key via Authorization or X-API-Key header',
    });
  }

  // Extract API key from Authorization header
  let providedKey: string | undefined;
  if (authHeader) {
    if (authHeader.startsWith('Bearer ')) {
      providedKey = authHeader.substring(7);
    } else if (authHeader.startsWith('ApiKey ')) {
      providedKey = authHeader.substring(7);
    } else {
      providedKey = authHeader;
    }
  } else if (apiKey) {
    providedKey = apiKey;
  }

  // Validate API key
  if (providedKey !== authConfig.apiKey) {
    return res.status(403).json({
      success: false,
      error: 'Invalid API key',
      message: 'The provided API key is not valid',
    });
  }

  // Auth successful
  next();
}

/**
 * Middleware to protect UI routes (session-based)
 */
export async function requireUIAuth(req: Request, res: Response, next: NextFunction): Promise<void> {
  // Skip auth if disabled
  if (!authConfig.enableAuth) {
    return next();
  }

  // Check for session cookie
  const sessionCookie = req.cookies?.dashboard_session;

  if (!sessionCookie) {
    // Redirect to login
    return res.redirect('/login?redirect=' + encodeURIComponent(req.originalUrl));
  }

  // Get session from Redis
  const session = await getSession(sessionCookie);

  if (!session || !session.authenticated || !session.apiKey || session.apiKey !== authConfig.apiKey) {
    res.clearCookie('dashboard_session');
    return res.redirect('/login?redirect=' + encodeURIComponent(req.originalUrl));
  }

  // Extend session (sliding expiry)
  await extendSession(sessionCookie);

  // Session valid
  next();
}

/**
 * Login handler
 */
export async function handleLogin(req: Request, res: Response): Promise<void> {
  const { apiKey, redirect } = req.body;

  if (!apiKey) {
    return res.status(400).json({
      success: false,
      error: 'API key required',
    });
  }

  // Validate API key
  if (apiKey !== authConfig.apiKey) {
    return res.status(403).json({
      success: false,
      error: 'Invalid API key',
    });
  }

  // Create session ID
  const sessionId = generateSessionId();

  // Create session data
  const sessionData: SessionData = {
    authenticated: true,
    apiKey,
    createdAt: Date.now(),
    expiresAt: Date.now() + authConfig.sessionDuration,
    ipAddress: req.ip,
    userAgent: req.headers['user-agent'],
  };

  // Store session in Redis
  await createSession(sessionId, sessionData);

  // Create session cookie (24 hour expiry)
  const sessionCookie = Buffer.from(sessionId).toString('base64');

  res.cookie('dashboard_session', sessionCookie, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: authConfig.sessionDuration,
  });

  res.json({
    success: true,
    redirect: redirect || '/dashboard',
    sessionExpires: sessionData.expiresAt,
  });
}

/**
 * Logout handler
 */
export async function handleLogout(req: Request, res: Response): Promise<void> {
  const sessionCookie = req.cookies?.dashboard_session;

  if (sessionCookie) {
    try {
      const sessionId = Buffer.from(sessionCookie, 'base64').toString('utf-8');
      await deleteSession(sessionId);
    } catch (error) {
      console.error('[Auth] Logout session delete failed:', (error as Error).message);
    }
    res.clearCookie('dashboard_session');
  }

  res.json({
    success: true,
    redirect: '/login',
  });
}

/**
 * Check auth status
 */
export async function checkAuthStatus(req: Request, res: Response): Promise<void> {
  const sessionCookie = req.cookies?.dashboard_session;

  if (!sessionCookie) {
    return res.json({
      authenticated: false,
      authEnabled: authConfig.enableAuth,
    });
  }

  try {
    const sessionId = Buffer.from(sessionCookie, 'base64').toString('utf-8');
    const session = await getSession(sessionId);
    
    if (session && session.authenticated && session.apiKey === authConfig.apiKey) {
      return res.json({
        authenticated: true,
        authEnabled: authConfig.enableAuth,
        expires: session.expiresAt,
        createdAt: session.createdAt,
      });
    }
  } catch (error) {
    // Invalid session
  }

  res.json({
    authenticated: false,
    authEnabled: authConfig.enableAuth,
  });
}

/**
 * Generate a secure random session ID
 */
function generateSessionId(): string {
  const crypto = require('crypto');
  return crypto.randomBytes(32).toString('hex');
}

/**
 * Generate a secure random API key
 */
export function generateApiKey(): string {
  const crypto = require('crypto');
  return crypto.randomBytes(32).toString('hex');
}
