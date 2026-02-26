/**
 * Public API Routes
 * RESTful API for external integrations
 */

import { Router } from 'express';
import { requireAuth } from '../middleware/auth.js';
import { prisma } from '../lib/prisma.js';
import { logger } from '../lib/logger.js';

const apiRouter = Router();

// ==================== Health & Status ====================

/**
 * @openapi
 * /api/health:
 *   get:
 *     summary: Health check
 *     tags: [System]
 *     responses:
 *       200:
 *         description: Service is healthy
 */
apiRouter.get('/health', async (req, res) => {
  const dbHealthy = await prisma.$queryRaw`SELECT 1`.then(() => true).catch(() => false);
  
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    version: process.env.npm_package_version || '2.0.0',
    database: dbHealthy ? 'connected' : 'disconnected'
  });
});

// ==================== Errors API ====================

/**
 * @openapi
 * /api/errors:
 *   get:
 *     summary: List errors
 *     tags: [Errors]
 *     parameters:
 *       - name: page
 *         in: query
 *         schema:
 *           type: integer
 *           default: 1
 *       - name: limit
 *         in: query
 *         schema:
 *           type: integer
 *           default: 20
 *       - name: severity
 *         in: query
 *         schema:
 *           type: string
 *           enum: [critical, high, medium, low, info]
 *     responses:
 *       200:
 *         description: List of errors
 */
apiRouter.get('/errors', requireAuth, async (req, res) => {
  try {
    const { page = 1, limit = 20, severity } = req.query;
    
    const where: any = {};
    if (severity) where.severity = severity;
    
    const [errors, total] = await Promise.all([
      prisma.errorRecord.findMany({
        where,
        orderBy: { timestamp: 'desc' },
        skip: (parseInt(page as string) - 1) * parseInt(limit as string),
        take: parseInt(limit as string)
      }),
      prisma.errorRecord.count({ where })
    ]);
    
    res.json({
      success: true,
      data: errors,
      pagination: {
        page: parseInt(page as string),
        limit: parseInt(limit as string),
        total,
        totalPages: Math.ceil(total / parseInt(limit as string))
      }
    });
  } catch (error: any) {
    logger.error('[API] Failed to list errors', { error: error.message });
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * @openapi
 * /api/errors/{id}:
 *   get:
 *     summary: Get error by ID
 *     tags: [Errors]
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Error details
 */
apiRouter.get('/errors/:id', requireAuth, async (req, res) => {
  try {
    const error = await prisma.errorRecord.findUnique({
      where: { errorId: req.params.id }
    });
    
    if (!error) {
      return res.status(404).json({ success: false, error: 'Error not found' });
    }
    
    res.json({ success: true, data: error });
  } catch (error: any) {
    logger.error('[API] Failed to get error', { error: error.message });
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * @openapi
 * /api/errors:
 *   post:
 *     summary: Create new error
 *     tags: [Errors]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               message:
 *                 type: string
 *               severity:
 *                 type: string
 *                 enum: [critical, high, medium, low, info]
 *               context:
 *                 type: object
 *     responses:
 *       201:
 *         description: Error created
 */
apiRouter.post('/errors', requireAuth, async (req, res) => {
  try {
    const { message, severity = 'medium', context = {}, metadata = {} } = req.body;
    
    if (!message) {
      return res.status(400).json({ success: false, error: 'Message is required' });
    }
    
    const error = await prisma.errorRecord.create({
      data: {
        errorId: `err_api_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
        name: 'APIError',
        message,
        severity,
        context: JSON.stringify(context),
        metadata: JSON.stringify(metadata),
        timestamp: new Date(),
        fingerprint: `api_${Date.now()}`
      }
    });
    
    logger.info('[API] Error created via API', { errorId: error.errorId });
    
    res.status(201).json({ success: true, data: error });
  } catch (error: any) {
    logger.error('[API] Failed to create error', { error: error.message });
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * @openapi
 * /api/errors/{id}/status:
 *   patch:
 *     summary: Update error status
 *     tags: [Errors]
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               status:
 *                 type: string
 *                 enum: [OPEN, TRIAGED, RESOLVED, IGNORED]
 *     responses:
 *       200:
 *         description: Error updated
 */
apiRouter.patch('/errors/:id/status', requireAuth, async (req, res) => {
  try {
    const { status } = req.body;
    
    if (!status || !['OPEN', 'TRIAGED', 'RESOLVED', 'IGNORED'].includes(status)) {
      return res.status(400).json({ success: false, error: 'Invalid status' });
    }
    
    const error = await prisma.errorRecord.update({
      where: { errorId: req.params.id },
      data: {
        status,
        resolvedAt: status === 'RESOLVED' ? new Date() : null
      }
    });
    
    logger.info('[API] Error status updated', { errorId: error.errorId, status });
    
    res.json({ success: true, data: error });
  } catch (error: any) {
    logger.error('[API] Failed to update error', { error: error.message });
    res.status(500).json({ success: false, error: error.message });
  }
});

// ==================== Analytics API ====================

/**
 * @openapi
 * /api/analytics/overview:
 *   get:
 *     summary: Get analytics overview
 *     tags: [Analytics]
 *     responses:
 *       200:
 *         description: Analytics overview
 */
apiRouter.get('/analytics/overview', requireAuth, async (req, res) => {
  try {
    const last24h = new Date(Date.now() - 24 * 60 * 60 * 1000);
    
    const [total, critical, resolved] = await Promise.all([
      prisma.errorRecord.count({
        where: { timestamp: { gte: last24h } }
      }),
      prisma.errorRecord.count({
        where: { 
          timestamp: { gte: last24h },
          severity: 'critical'
        }
      }),
      prisma.errorRecord.count({
        where: {
          timestamp: { gte: last24h },
          status: 'RESOLVED'
        }
      })
    ]);
    
    res.json({
      success: true,
      data: {
        period: '24h',
        total,
        critical,
        resolved,
        resolutionRate: total > 0 ? Math.round((resolved / total) * 100) : 0
      }
    });
  } catch (error: any) {
    logger.error('[API] Failed to get analytics', { error: error.message });
    res.status(500).json({ success: false, error: error.message });
  }
});

// ==================== API Keys ====================

/**
 * @openapi
 * /api/api-keys:
 *   post:
 *     summary: Create API key
 *     tags: [API Keys]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               role:
 *                 type: string
 *                 enum: [ADMIN, DEVELOPER, VIEWER]
 *     responses:
 *       201:
 *         description: API key created
 */
apiRouter.post('/api-keys', requireAuth, async (req, res) => {
  try {
    const crypto = require('crypto');
    const { name, role = 'VIEWER' } = req.body;
    
    const apiKey = `dbg_${crypto.randomBytes(24).toString('hex')}`;
    
    // Store API key (in production, store in database)
    logger.info('[API] API key created', { name, role });
    
    res.status(201).json({
      success: true,
      data: {
        name,
        role,
        apiKey,
        message: 'Save this API key securely. It cannot be retrieved later.'
      }
    });
  } catch (error: any) {
    logger.error('[API] Failed to create API key', { error: error.message });
    res.status(500).json({ success: false, error: error.message });
  }
});

// ==================== Webhooks ====================

/**
 * @openapi
 * /api/webhooks:
 *   post:
 *     summary: Create webhook
 *     tags: [Webhooks]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               url:
 *                 type: string
 *               events:
 *                 type: array
 *                 items:
 *                   type: string
 *                   enum: [error.created, error.resolved, error.critical]
 *     responses:
 *       201:
 *         description: Webhook created
 */
apiRouter.post('/webhooks', requireAuth, async (req, res) => {
  try {
    const { url, events = ['error.created'] } = req.body;
    
    if (!url) {
      return res.status(400).json({ success: false, error: 'URL is required' });
    }
    
    // Validate URL
    try {
      new URL(url);
    } catch {
      return res.status(400).json({ success: false, error: 'Invalid URL' });
    }
    
    logger.info('[API] Webhook created', { url, events });
    
    res.status(201).json({
      success: true,
      data: {
        url,
        events,
        active: true
      }
    });
  } catch (error: any) {
    logger.error('[API] Failed to create webhook', { error: error.message });
    res.status(500).json({ success: false, error: error.message });
  }
});

// ==================== User Management APIs ====================

// List users
apiRouter.get('/users', requireAuth, async (req, res) => {
  try {
    const { page = 1, limit = 20, role, active } = req.query;
    
    const where: any = {};
    if (role) where.role = role;
    if (active !== undefined) where.active = active === 'true';
    
    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        select: {
          id: true,
          email: true,
          name: true,
          role: true,
          active: true,
          emailVerified: true,
          lastLoginAt: true,
          createdAt: true
        },
        orderBy: { createdAt: 'desc' },
        skip: (parseInt(page as string) - 1) * parseInt(limit as string),
        take: parseInt(limit as string)
      }),
      prisma.user.count({ where })
    ]);
    
    const stats = await getUserStats();
    
    res.json({
      success: true,
      data: users,
      pagination: {
        page: parseInt(page as string),
        limit: parseInt(limit as string),
        total,
        totalPages: Math.ceil(total / parseInt(limit as string))
      },
      stats
    });
  } catch (error: any) {
    logger.error('[API] Failed to list users', { error: error.message });
    res.status(500).json({ success: false, error: error.message });
  }
});

// Create user
apiRouter.post('/users', requireAuth, async (req, res) => {
  try {
    const { email, password, name, role = 'VIEWER' } = req.body;
    
    if (!email || !password) {
      return res.status(400).json({ 
        success: false, 
        error: 'Email and password are required' 
      });
    }
    
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return res.status(400).json({ success: false, error: 'User already exists' });
    }
    
    const bcrypt = require('bcryptjs');
    const passwordHash = await bcrypt.hash(password, 10);
    
    const user = await prisma.user.create({
      data: {
        email,
        name,
        passwordHash,
        role,
        emailVerified: true,
        active: true
      },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        active: true,
        createdAt: true
      }
    });
    
    logger.info('[API] User created', { userId: user.id });
    res.status(201).json({ success: true, data: user });
  } catch (error: any) {
    logger.error('[API] Failed to create user', { error: error.message });
    res.status(500).json({ success: false, error: error.message });
  }
});

// Update user
apiRouter.patch('/users/:id', requireAuth, async (req, res) => {
  try {
    const { name, role, active } = req.body;
    
    const user = await prisma.user.update({
      where: { id: req.params.id },
      data: { name, role, active },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        active: true
      }
    });
    
    logger.info('[API] User updated', { userId: user.id });
    res.json({ success: true, data: user });
  } catch (error: any) {
    logger.error('[API] Failed to update user', { error: error.message });
    res.status(500).json({ success: false, error: error.message });
  }
});

// Delete user
apiRouter.delete('/users/:id', requireAuth, async (req, res) => {
  try {
    await prisma.user.delete({ where: { id: req.params.id } });
    logger.info('[API] User deleted', { userId: req.params.id });
    res.json({ success: true });
  } catch (error: any) {
    logger.error('[API] Failed to delete user', { error: error.message });
    res.status(500).json({ success: false, error: error.message });
  }
});

async function getUserStats() {
  const [total, byRole, active] = await Promise.all([
    prisma.user.count(),
    prisma.user.groupBy({ by: ['role'], _count: true }),
    prisma.user.count({ where: { active: true } })
  ]);
  
  return {
    total,
    byRole: Object.fromEntries(byRole.map(r => [r.role, r._count])),
    active,
    inactive: total - active
  };
}

// ==================== Audit Log APIs ====================

apiRouter.get('/audit-logs', requireAuth, async (req, res) => {
  try {
    const { page = 1, limit = 50, userId, action, success, dateFrom, dateTo } = req.query;
    
    const where: any = {};
    if (userId) where.userId = userId;
    if (action) where.action = action;
    if (success !== undefined) where.success = success === 'true';
    if (dateFrom || dateTo) {
      where.timestamp = {};
      if (dateFrom) where.timestamp.gte = new Date(dateFrom);
      if (dateTo) where.timestamp.lte = new Date(dateTo);
    }
    
    const [logs, total] = await Promise.all([
      prisma.auditLog.findMany({
        where,
        include: { user: { select: { id: true, email: true, name: true } } },
        orderBy: { timestamp: 'desc' },
        skip: (parseInt(page as string) - 1) * parseInt(limit as string),
        take: parseInt(limit as string)
      }),
      prisma.auditLog.count({ where })
    ]);
    
    res.json({
      success: true,
      data: logs.map(log => ({ ...log, userName: log.user?.email || log.userName })),
      pagination: {
        page: parseInt(page as string),
        limit: parseInt(limit as string),
        total,
        totalPages: Math.ceil(total / parseInt(limit as string))
      }
    });
  } catch (error: any) {
    logger.error('[API] Failed to list audit logs', { error: error.message });
    res.status(500).json({ success: false, error: error.message });
  }
});

apiRouter.get('/audit-logs/export', requireAuth, async (req, res) => {
  try {
    const logs = await prisma.auditLog.findMany({ where: {}, orderBy: { timestamp: 'desc' }, take: 10000 });
    
    const csv = [
      ['Timestamp', 'User', 'Action', 'Resource', 'IP', 'Status'],
      ...logs.map(log => [
        log.timestamp,
        log.userName || 'System',
        log.action,
        `${log.resourceType}#${log.resourceId || 'N/A'}`,
        log.ipAddress || '-',
        log.success ? 'Success' : 'Failed'
      ])
    ].map(row => row.map(cell => `"${cell}"`).join(',')).join('\n');
    
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename=audit-logs.csv');
    res.send(csv);
  } catch (error: any) {
    logger.error('[API] Failed to export audit logs', { error: error.message });
    res.status(500).json({ success: false, error: error.message });
  }
});

// ==================== Authentication APIs ====================

apiRouter.post('/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    if (!email || !password) {
      return res.status(400).json({ success: false, error: 'Email and password are required' });
    }
    
    const user = await prisma.user.findUnique({ where: { email } });
    
    if (!user || !user.passwordHash) {
      return res.status(401).json({ success: false, error: 'Invalid credentials' });
    }
    
    const bcrypt = require('bcryptjs');
    const valid = await bcrypt.compare(password, user.passwordHash);
    
    if (!valid) {
      return res.status(401).json({ success: false, error: 'Invalid credentials' });
    }
    
    const crypto = require('crypto');
    const token = crypto.randomBytes(32).toString('hex');
    
    await prisma.session.create({
      data: {
        userId: user.id,
        token,
        ipAddress: req.ip,
        userAgent: req.headers['user-agent'],
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000)
      }
    });
    
    await prisma.user.update({ where: { id: user.id }, data: { lastLoginAt: new Date() } });
    
    logger.info('[API] User logged in', { userId: user.id });
    
    res.json({
      success: true,
      data: {
        token,
        user: { id: user.id, email: user.email, name: user.name, role: user.role }
      }
    });
  } catch (error: any) {
    logger.error('[API] Login failed', { error: error.message });
    res.status(500).json({ success: false, error: error.message });
  }
});

apiRouter.post('/auth/logout', requireAuth, async (req, res) => {
  try {
    const token = req.cookies?.dashboard_session;
    if (token) await prisma.session.deleteMany({ where: { token } });
    logger.info('[API] User logged out', { userId: req.user?.id });
    res.json({ success: true });
  } catch (error: any) {
    logger.error('[API] Logout failed', { error: error.message });
    res.status(500).json({ success: false, error: error.message });
  }
});

apiRouter.get('/auth/me', requireAuth, async (req, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user?.id },
      select: { id: true, email: true, name: true, role: true, emailVerified: true, mfaEnabled: true }
    });
    res.json({ success: true, data: user });
  } catch (error: any) {
    logger.error('[API] Get current user failed', { error: error.message });
    res.status(500).json({ success: false, error: error.message });
  }
});

export default apiRouter;
