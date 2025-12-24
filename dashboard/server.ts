/**
 * Debugg Dashboard Server
 * Basic UI dashboard for viewing and analyzing errors
 */

import express from 'express';
import { ErrorHandler, UniversalError } from '../src/index.ts';
import path from 'path';

// 🎨 Initialize Debugg for dashboard
const debugg = new ErrorHandler({
  serviceName: 'debugg-dashboard',
  environment: process.env.NODE_ENV || 'development',
  defaultSeverity: 'medium'
});

// 📦 In-memory error storage (replace with database in production)
let errorStore: UniversalError[] = [];

// 🛡️ Custom reporter to store errors for dashboard
debugg.addReporter(async (error) => {
  // 📊 Store error in memory
  errorStore.push(error);

  // 🗑️ Limit storage to prevent memory issues
  if (errorStore.length > 1000) {
    errorStore = errorStore.slice(-1000); // Keep last 1000 errors
  }
});

// 🚀 Create Express app
const app = express();
const PORT = process.env.PORT || 3001;

// 📂 Serve static files
app.use('/static', express.static(path.join(__dirname, 'public')));

// 📝 JSON parsing
app.use(express.json());

// 🌐 API Routes

// 📊 Get all errors
app.get('/api/errors', (req, res) => {
  try {
    // 🔍 Filter by severity if specified
    const { severity } = req.query;
    let filteredErrors = errorStore;

    if (severity && ['critical', 'high', 'medium', 'low', 'info'].includes(severity as string)) {
      filteredErrors = errorStore.filter(error => error.severity === severity);
    }

    res.json({
      success: true,
      count: filteredErrors.length,
      errors: filteredErrors
    });
  } catch (error) {
    debugg.handle(error, {
      endpoint: '/api/errors',
      method: 'GET',
      type: 'dashboard_api_error'
    });
    res.status(500).json({ success: false, error: 'Internal Server Error' });
  }
});

// 📊 Get error statistics (must come before :id route)
app.get('/api/errors/stats', (req, res) => {
  try {
    const stats = {
      total: errorStore.length,
      bySeverity: {
        critical: errorStore.filter(e => e.severity === 'critical').length,
        high: errorStore.filter(e => e.severity === 'high').length,
        medium: errorStore.filter(e => e.severity === 'medium').length,
        low: errorStore.filter(e => e.severity === 'low').length,
        info: errorStore.filter(e => e.severity === 'info').length
      },
      byPlatform: {
        browser: errorStore.filter(e => e.metadata.platform === 'browser').length,
        node: errorStore.filter(e => e.metadata.platform === 'node').length,
        mobile: errorStore.filter(e => e.metadata.platform === 'mobile').length,
        unknown: errorStore.filter(e => e.metadata.platform === 'unknown').length
      },
      recent: errorStore.slice(-10).map(e => ({
        id: e.errorId,
        message: e.message,
        severity: e.severity,
        timestamp: e.timestamp
      }))
    };

    res.json({ success: true, stats });
  } catch (error) {
    debugg.handle(error, {
      endpoint: '/api/errors/stats',
      method: 'GET',
      type: 'dashboard_api_error'
    });
    res.status(500).json({ success: false, error: 'Internal Server Error' });
  }
});

// 📊 Get error by ID
app.get('/api/errors/:id', (req, res) => {
  try {
    const errorId = req.params.id;
    const error = errorStore.find(e => e.errorId === errorId);

    if (!error) {
      return res.status(404).json({ success: false, error: 'Error not found' });
    }

    res.json({ success: true, error });
  } catch (error) {
    debugg.handle(error, {
      endpoint: `/api/errors/${req.params.id}`,
      method: 'GET',
      type: 'dashboard_api_error'
    });
    res.status(500).json({ success: false, error: 'Internal Server Error' });
  }
});

// 📤 Add POST endpoint to receive errors from external sources
app.post('/api/errors', (req, res) => {
  try {
    const error = req.body;

    // Validate the error structure
    if (!error || !error.errorId || !error.message) {
      return res.status(400).json({ success: false, error: 'Invalid error format' });
    }

    // Store the error
    errorStore.push(error);

    // Limit storage to prevent memory issues
    if (errorStore.length > 1000) {
      errorStore = errorStore.slice(-1000);
    }

    res.json({ success: true, message: 'Error received', errorId: error.errorId });
  } catch (error) {
    debugg.handle(error, {
      endpoint: '/api/errors',
      method: 'POST',
      type: 'dashboard_api_error'
    });
    res.status(500).json({ success: false, error: 'Internal Server Error' });
  }
});

// 📝 Clear all errors (for development)
if (process.env.NODE_ENV === 'development') {
  app.post('/api/errors/clear', (req, res) => {
    errorStore = [];
    res.json({ success: true, message: 'All errors cleared' });
  });
}

// 🌐 Web Interface Routes

// 📱 Dashboard home page
app.get('/', (req, res) => {
  res.send(`
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Debugg Dashboard</title>
      <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif; background: #0f0f11; color: #e4e4e7; }
        .dashboard { max-width: 1400px; margin: 0 auto; padding: 24px; }
        header { background: linear-gradient(135deg, #dc2626 0%, #2563eb 100%); color: white; padding: 24px; border-radius: 12px; margin-bottom: 24px; display: flex; justify-content: space-between; align-items: center; }
        header h1 { font-size: 1.75rem; font-weight: 700; }
        header p { opacity: 0.9; margin-top: 4px; }
        .header-actions { display: flex; gap: 12px; }
        .btn { padding: 10px 20px; border-radius: 8px; border: none; cursor: pointer; font-weight: 600; font-size: 0.875rem; transition: all 0.2s; }
        .btn-primary { background: white; color: #1f2937; }
        .btn-primary:hover { background: #f3f4f6; transform: translateY(-1px); }
        .btn-secondary { background: rgba(255,255,255,0.15); color: white; border: 1px solid rgba(255,255,255,0.3); }
        .btn-secondary:hover { background: rgba(255,255,255,0.25); }
        .stats-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); gap: 16px; margin-bottom: 24px; }
        .stat-card { background: #18181b; padding: 20px; border-radius: 12px; border: 1px solid #27272a; transition: border-color 0.2s; }
        .stat-card:hover { border-color: #3f3f46; }
        .stat-card h3 { color: #71717a; font-size: 0.8rem; text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 8px; }
        .stat-card .value { font-size: 2rem; font-weight: 700; }
        .severity-critical { color: #ef4444; }
        .severity-high { color: #f97316; }
        .severity-medium { color: #eab308; }
        .severity-low { color: #22c55e; }
        .severity-info { color: #3b82f6; }
        .filters { display: flex; gap: 8px; margin-bottom: 16px; flex-wrap: wrap; }
        .filter-btn { padding: 8px 16px; border-radius: 6px; border: 1px solid #27272a; background: #18181b; color: #a1a1aa; cursor: pointer; font-size: 0.875rem; transition: all 0.2s; }
        .filter-btn:hover { border-color: #3f3f46; color: #e4e4e7; }
        .filter-btn.active { background: #3f3f46; color: #e4e4e7; border-color: #52525b; }
        .error-list { background: #18181b; border-radius: 12px; border: 1px solid #27272a; overflow: hidden; }
        .error-list-header { padding: 16px 20px; border-bottom: 1px solid #27272a; display: flex; justify-content: space-between; align-items: center; }
        .error-list-header h2 { font-size: 1rem; font-weight: 600; }
        .error-list table { width: 100%; border-collapse: collapse; }
        .error-list th, .error-list td { padding: 14px 20px; text-align: left; border-bottom: 1px solid #27272a; }
        .error-list th { background: #1f1f23; font-weight: 600; color: #a1a1aa; font-size: 0.75rem; text-transform: uppercase; letter-spacing: 0.05em; }
        .error-list tr:hover { background: #1f1f23; }
        .error-list tr:last-child td { border-bottom: none; }
        .severity-badge { padding: 4px 10px; border-radius: 6px; font-size: 0.75rem; font-weight: 600; text-transform: uppercase; }
        .severity-badge.severity-critical { background: rgba(239,68,68,0.15); }
        .severity-badge.severity-high { background: rgba(249,115,22,0.15); }
        .severity-badge.severity-medium { background: rgba(234,179,8,0.15); }
        .severity-badge.severity-low { background: rgba(34,197,94,0.15); }
        .severity-badge.severity-info { background: rgba(59,130,246,0.15); }
        .platform-badge { padding: 4px 10px; border-radius: 6px; font-size: 0.75rem; background: #27272a; color: #a1a1aa; }
        .timestamp { color: #71717a; font-size: 0.85rem; font-family: monospace; }
        .error-id { color: #71717a; font-size: 0.75rem; font-family: monospace; }
        footer { margin-top: 24px; text-align: center; color: #52525b; font-size: 0.875rem; }
        .empty-state { text-align: center; padding: 48px 20px; color: #71717a; }
        @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.5; } }
        .loading { animation: pulse 1.5s infinite; }
      </style>
    </head>
    <body>
      <div class="dashboard">
        <header>
          <div>
            <h1>🐞 Debugg Dashboard</h1>
            <p>Smart Error Monitoring and Analysis</p>
          </div>
          <div class="header-actions">
            <button class="btn btn-secondary" onclick="fetchStats(); fetchErrors();">↻ Refresh</button>
            <button class="btn btn-primary" onclick="generateTestError();">+ Test Error</button>
          </div>
        </header>

        <div class="stats-grid">
          <div class="stat-card">
            <h3>Total Errors</h3>
            <div class="value" id="total-errors">-</div>
          </div>
          <div class="stat-card">
            <h3>Critical</h3>
            <div class="value severity-critical" id="critical-count">-</div>
          </div>
          <div class="stat-card">
            <h3>High</h3>
            <div class="value severity-high" id="high-count">-</div>
          </div>
          <div class="stat-card">
            <h3>Medium</h3>
            <div class="value severity-medium" id="medium-count">-</div>
          </div>
          <div class="stat-card">
            <h3>Low</h3>
            <div class="value severity-low" id="low-count">-</div>
          </div>
          <div class="stat-card">
            <h3>Info</h3>
            <div class="value severity-info" id="info-count">-</div>
          </div>
        </div>

        <div class="filters">
          <button class="filter-btn active" data-severity="all" onclick="setFilter('all')">All</button>
          <button class="filter-btn" data-severity="critical" onclick="setFilter('critical')">Critical</button>
          <button class="filter-btn" data-severity="high" onclick="setFilter('high')">High</button>
          <button class="filter-btn" data-severity="medium" onclick="setFilter('medium')">Medium</button>
          <button class="filter-btn" data-severity="low" onclick="setFilter('low')">Low</button>
          <button class="filter-btn" data-severity="info" onclick="setFilter('info')">Info</button>
        </div>

        <div class="error-list">
          <div class="error-list-header">
            <h2>Recent Errors</h2>
            <span id="error-count" style="color: #71717a; font-size: 0.875rem;">0 errors</span>
          </div>
          <table>
            <thead>
              <tr>
                <th>Timestamp</th>
                <th>Message</th>
                <th>Severity</th>
                <th>Platform</th>
                <th>Error ID</th>
              </tr>
            </thead>
            <tbody id="error-table">
              <tr>
                <td colspan="5" class="empty-state loading">Loading errors...</td>
              </tr>
            </tbody>
          </table>
        </div>

        <footer>
          <p>Debugg Dashboard v1.0 | Debug smarter, not harder! 🚀</p>
        </footer>
      </div>

      <script>
        // 📊 Fetch and display error statistics
        async function fetchStats() {
          try {
            const response = await fetch('/api/errors/stats');
            const data = await response.json();

            if (data.success) {
              document.getElementById('total-errors').textContent = data.stats.total;
              document.getElementById('critical-count').textContent = data.stats.bySeverity.critical;
              document.getElementById('high-count').textContent = data.stats.bySeverity.high;
              document.getElementById('medium-count').textContent = data.stats.bySeverity.medium;
              document.getElementById('low-count').textContent = data.stats.bySeverity.low;
              document.getElementById('info-count').textContent = data.stats.bySeverity.info;
            }
          } catch (error) {
            console.error('Failed to fetch stats:', error);
          }
        }

        // 📋 Fetch and display recent errors
        async function fetchErrors() {
          try {
            const response = await fetch('/api/errors');
            const data = await response.json();

            if (data.success && data.errors.length > 0) {
              const tableBody = document.getElementById('error-table');
              tableBody.innerHTML = '';

              data.errors.slice(-20).reverse().forEach((error) => {
                const row = document.createElement('tr');
                row.innerHTML = \`
                  <td class="timestamp">\${new Date(error.timestamp).toLocaleString()}</td>
                  <td>\${error.message}</td>
                  <td><span class="severity-badge severity-\${error.severity}">\${error.severity}</span></td>
                  <td><span class="platform-badge">\${error.metadata.platform}</span></td>
                  <td><code>\${error.errorId}</code></td>
                \`;
                tableBody.appendChild(row);
              });
            } else {
              document.getElementById('error-table').innerHTML = \`
                <tr>
                  <td colspan="5" style="text-align: center; padding: 20px;">No errors found</td>
                </tr>
              \`;
            }
          } catch (error) {
            console.error('Failed to fetch errors:', error);
            document.getElementById('error-table').innerHTML = \`
              <tr>
                <td colspan="5" style="text-align: center; padding: 20px;">Failed to load errors</td>
              </tr>
            \`;
          }
        }

        // 🔄 Auto-refresh data
        let currentFilter = 'all';

        function startAutoRefresh() {
          fetchStats();
          fetchErrors();

          setInterval(() => {
            fetchStats();
            fetchErrors();
          }, 5000); // Refresh every 5 seconds
        }

        // 🔍 Set severity filter
        function setFilter(severity) {
          currentFilter = severity;
          document.querySelectorAll('.filter-btn').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.severity === severity);
          });
          fetchErrors();
        }

        // 🧪 Generate test error
        async function generateTestError() {
          const severities = ['critical', 'high', 'medium', 'low', 'info'];
          const severity = severities[Math.floor(Math.random() * severities.length)];
          const testError = {
            errorId: 'err_test_' + Date.now(),
            name: 'TestError',
            message: 'Test error generated from dashboard (' + severity + ')',
            severity: severity,
            timestamp: new Date().toISOString(),
            context: { source: 'dashboard_test' },
            metadata: { platform: 'browser', serviceName: 'debugg-dashboard', environment: 'development' }
          };

          try {
            await fetch('/api/errors', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(testError)
            });
            fetchStats();
            fetchErrors();
          } catch (error) {
            console.error('Failed to create test error:', error);
          }
        }

        // 🚀 Start when page loads
        document.addEventListener('DOMContentLoaded', startAutoRefresh);
      </script>
    </body>
    </html>
  `);
});

// 🛡️ Error handling for uncaught exceptions
process.on('uncaughtException', (error) => {
  debugg.handle(error, {
    type: 'dashboard_uncaught_exception',
    process: 'dashboard_server'
  });
  console.error('Uncaught Exception:', error);
});

process.on('unhandledRejection', (reason) => {
  debugg.handle(reason, {
    type: 'dashboard_unhandled_rejection',
    process: 'dashboard_server'
  });
  console.error('Unhandled Rejection:', reason);
});

// 🚀 Start the dashboard server
app.listen(PORT, () => {
  console.log(`🚀 Debugg Dashboard running on http://localhost:${PORT}`);
  console.log(`📊 View errors at http://localhost:${PORT}`);
  console.log(`🛡️ Error collection active`);

  // 📝 Log server start
  debugg.handle(new Error('Dashboard server started'), {
    port: PORT,
    environment: process.env.NODE_ENV,
    timestamp: new Date().toISOString(),
    severityOverride: 'info'
  }).catch(console.error);
});

// 📚 Export for testing and usage
export { app, debugg, errorStore };
export default app;
