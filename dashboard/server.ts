/**
 * Debugg Dashboard Server v2.0
 * Production-ready error monitoring with database support and authentication
 */

import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import cookieParser from 'cookie-parser';
import { checkDatabaseHealth, disconnectDatabase } from './database/client.js';
import {
  storeError,
  getErrorById,
  getErrorByErrorId,
  listErrors,
  getStatistics,
  getErrorGroups,
  updateErrorStatus,
  deleteError,
  clearAllErrors,
  type ErrorListOptions,
  type ErrorFilters,
} from './database/error-repository.js';
import {
  requireAuth,
  requireUIAuth,
  handleLogin,
  handleLogout,
  checkAuthStatus,
  isAuthEnabled,
  getAuthStatus,
} from './middleware/auth.js';
import {
  apiRateLimiter,
  loginRateLimiter,
  strictRateLimiter,
} from './middleware/rateLimiter.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Initialize Express app
const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(express.json({ limit: '10mb' }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

// Apply global API rate limiting
app.use('/api', apiRateLimiter);

// Log auth status
const authStatus = getAuthStatus();
console.log(`🔐 Authentication: ${authStatus.enabled ? '✅ Enabled' : '⚠️  Disabled (dev mode)'}`);
if (!authStatus.configured && authStatus.enabled) {
  console.log('⚠️  Warning: Using default API key. Change DASHBOARD_API_KEY in production!');
}

// Health check endpoint
app.get('/health', async (req, res) => {
  const dbHealthy = await checkDatabaseHealth();
  const authStatus = getAuthStatus();
  res.json({
    status: 'ok',
    database: dbHealthy ? 'connected' : 'disconnected',
    authentication: authStatus,
    timestamp: new Date().toISOString(),
  });
});

// ==================== Authentication Routes ====================

// Login page
app.get('/login', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'login.html'));
});

// Login API (with strict rate limiting)
app.post('/api/auth/login', loginRateLimiter, handleLogin);

// Logout API
app.post('/api/auth/logout', handleLogout);

// Auth status API
app.get('/api/auth/status', checkAuthStatus);

// ==================== Protected API Routes ====================

// Apply authentication to all API routes below
app.use('/api', requireAuth);

/**
 * Get error statistics
 */
app.get('/api/errors/stats', async (req, res) => {
  try {
    const { from, to } = req.query;
    const timeRange = from && to ? { from: String(from), to: String(to) } : undefined;
    
    const stats = await getStatistics(timeRange);
    res.json({ success: true, stats });
  } catch (error) {
    console.error('Error fetching stats:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch statistics' });
  }
});

/**
 * List errors with pagination and filtering
 */
app.get('/api/errors', async (req, res) => {
  try {
    const options: ErrorListOptions = {
      page: parseInt(req.query.page as string) || 1,
      limit: parseInt(req.query.limit as string) || 20,
      sortBy: (req.query.sortBy as 'timestamp' | 'severity' | 'count') || 'timestamp',
      sortOrder: (req.query.sortOrder as 'asc' | 'desc') || 'desc',
      filters: {} as ErrorFilters,
    };
    
    // Parse filters
    if (req.query.severity) {
      options.filters!.severity = (req.query.severity as string).split(',') as any;
    }
    if (req.query.status) {
      options.filters!.status = (req.query.status as string).split(',');
    }
    if (req.query.platform) {
      options.filters!.platform = (req.query.platform as string).split(',');
    }
    if (req.query.search) {
      options.filters!.search = String(req.query.search);
    }
    if (req.query.dateFrom) {
      options.filters!.dateFrom = String(req.query.dateFrom);
    }
    if (req.query.dateTo) {
      options.filters!.dateTo = String(req.query.dateTo);
    }
    if (req.query.projectId) {
      options.filters!.projectId = String(req.query.projectId);
    }
    
    const result = await listErrors(options);
    res.json({ success: true, ...result });
  } catch (error) {
    console.error('Error listing errors:', error);
    res.status(500).json({ success: false, error: 'Failed to list errors' });
  }
});

/**
 * Get error groups (clustered errors)
 */
app.get('/api/errors/groups', async (req, res) => {
  try {
    const { projectId } = req.query;
    const groups = await getErrorGroups(projectId ? String(projectId) : undefined);
    res.json({ success: true, groups });
  } catch (error) {
    console.error('Error fetching error groups:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch error groups' });
  }
});

/**
 * Get single error by ID
 */
app.get('/api/errors/:id', async (req, res) => {
  try {
    const error = await getErrorByErrorId(req.params.id);
    
    if (!error) {
      return res.status(404).json({ success: false, error: 'Error not found' });
    }
    
    res.json({ success: true, error });
  } catch (error) {
    console.error('Error fetching error:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch error' });
  }
});

/**
 * Receive new error from external sources
 */
app.post('/api/errors', async (req, res) => {
  try {
    const error = req.body;
    
    // Validate required fields
    if (!error.errorId || !error.message) {
      return res.status(400).json({ 
        success: false, 
        error: 'Invalid error format. Required fields: errorId, message' 
      });
    }
    
    // Store error in database
    const storedError = await storeError(error, error.metadata?.projectId);
    
    res.json({ 
      success: true, 
      message: 'Error received', 
      errorId: storedError.errorId,
      fingerprint: storedError.fingerprint,
    });
  } catch (error) {
    console.error('Error storing error:', error);
    res.status(500).json({ success: false, error: 'Failed to store error' });
  }
});

/**
 * Update error status
 */
app.patch('/api/errors/:id/status', async (req, res) => {
  try {
    const { status, assignedTo } = req.body;
    
    if (!status) {
      return res.status(400).json({ success: false, error: 'Status is required' });
    }
    
    const updatedError = await updateErrorStatus(req.params.id, status, assignedTo);
    res.json({ success: true, error: updatedError });
  } catch (error) {
    console.error('Error updating status:', error);
    res.status(500).json({ success: false, error: 'Failed to update status' });
  }
});

/**
 * Delete error
 */
app.delete('/api/errors/:id', async (req, res) => {
  try {
    await deleteError(req.params.id);
    res.json({ success: true, message: 'Error deleted' });
  } catch (error) {
    console.error('Error deleting error:', error);
    res.status(500).json({ success: false, error: 'Failed to delete error' });
  }
});

/**
 * Clear all errors (development only)
 */
app.post('/api/errors/clear', async (req, res) => {
  if (process.env.NODE_ENV === 'production') {
    return res.status(403).json({ success: false, error: 'Not allowed in production' });
  }
  
  try {
    const { projectId } = req.body;
    const count = await clearAllErrors(projectId);
    res.json({ success: true, message: `Cleared ${count} errors` });
  } catch (error) {
    console.error('Error clearing errors:', error);
    res.status(500).json({ success: false, error: 'Failed to clear errors' });
  }
});

// Serve dashboard UI (protected)
app.get('/', requireUIAuth, (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Error handler for uncaught exceptions
process.on('uncaughtException', async (error) => {
  console.error('Uncaught Exception:', error);
  try {
    await storeError({
      name: error.name,
      message: error.message,
      stack: error.stack,
      severity: 'critical',
      context: { source: 'uncaught_exception' },
      metadata: { platform: 'node', serviceName: 'debugg-dashboard' },
      timestamp: new Date(),
      errorId: `err_${Date.now()}_uncaught`,
    });
  } catch {}
  setTimeout(() => process.exit(1), 1000);
});

process.on('unhandledRejection', async (reason) => {
  console.error('Unhandled Rejection:', reason);
  try {
    await storeError({
      name: 'UnhandledRejection',
      message: String(reason),
      severity: 'high',
      context: { source: 'unhandled_rejection' },
      metadata: { platform: 'node', serviceName: 'debugg-dashboard' },
      timestamp: new Date(),
      errorId: `err_${Date.now()}_rejection`,
    });
  } catch {}
});

// Start server
async function startServer() {
  // Check database connection
  const dbHealthy = await checkDatabaseHealth();
  console.log(`📊 Database: ${dbHealthy ? '✅ Connected' : '❌ Disconnected'}`);
  
  app.listen(PORT, () => {
    console.log(`🚀 Debugg Dashboard v2.0 running on http://localhost:${PORT}`);
    console.log(`📊 API: http://localhost:${PORT}/api/errors`);
    console.log(`🏥 Health: http://localhost:${PORT}/health`);
    console.log(`\nPhase 1 Features:`);
    console.log(`  ✅ Database storage (SQLite)`);
    console.log(`  ✅ Pagination`);
    console.log(`  ✅ Error grouping`);
    console.log(`  ✅ Advanced filtering`);
    console.log(`  ✅ Error detail view`);
  });
}

// Graceful shutdown
process.on('SIGINT', async () => {
  console.log('\nShutting down gracefully...');
  await disconnectDatabase();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  console.log('\nShutting down gracefully...');
  await disconnectDatabase();
  process.exit(0);
});

// Start
startServer().catch(console.error);

export { app };
