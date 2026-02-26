/**
 * Debugg Configuration for DebugShop Backend
 * 
 * This file initializes Debugg error monitoring for the backend.
 * All errors will be sent to your Debugg dashboard.
 */

import { debugg } from 'debugg';

// Initialize Debugg
const debuggInstance = new debugg.EnhancedErrorHandler({
  serviceName: 'debugshop-backend',
  environment: process.env.NODE_ENV || 'development',
  logToConsole: true,
  defaultSeverity: 'medium',
  performanceMonitoring: true,
  analytics: true,
  security: {
    redactFields: ['password', 'cardNumber', 'cvv', 'ssn'],
    enableRateLimiting: true,
    maxErrorsPerMinute: 100
  }
});

// Add console reporter for development
if (process.env.NODE_ENV === 'development') {
  debuggInstance.addReporter(debuggInstance.createConsoleReporter());
}

// Add webhook reporter to send errors to Debugg dashboard
const debuggDashboardUrl = process.env.DEBUGG_DASHBOARD_URL || 'http://localhost:3001';

debuggInstance.addReporter(
  debuggInstance.createWebhookReporter(`${debuggDashboardUrl}/api/errors`, {
    retries: 3,
    timeout: 5000,
    logFailures: true
  })
);

// Global error handlers
process.on('uncaughtException', (error) => {
  debuggInstance.handle(error, {
    source: 'uncaughtException',
    process: 'main'
  });
  console.error('Uncaught Exception:', error);
  setTimeout(() => process.exit(1), 1000);
});

process.on('unhandledRejection', (reason) => {
  debuggInstance.handle(reason, {
    source: 'unhandledRejection',
    process: 'main'
  });
  console.error('Unhandled Rejection:', reason);
});

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('SIGTERM received, shutting down gracefully...');
  await debuggInstance.handle(new Error('Server shutting down'), {
    source: 'graceful_shutdown',
    signal: 'SIGTERM'
  });
  process.exit(0);
});

export default debuggInstance;
