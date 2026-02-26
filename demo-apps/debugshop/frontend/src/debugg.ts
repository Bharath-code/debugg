/**
 * Debugg Configuration for DebugShop
 * 
 * This file initializes Debugg error monitoring for the frontend.
 * All errors will be sent to your Debugg dashboard.
 */

import { debugg } from 'debugg';

// Initialize Debugg
const debuggInstance = new debugg.EnhancedErrorHandler({
  serviceName: 'debugshop-frontend',
  environment: import.meta.env.DEV ? 'development' : 'production',
  logToConsole: true,
  defaultSeverity: 'medium',
  performanceMonitoring: true,
  analytics: true,
});

// Add webhook reporter to send errors to Debugg dashboard
const debuggDashboardUrl = import.meta.env.VITE_DEBUGG_URL || 'http://localhost:3001';

debuggInstance.addReporter(
  debugg.createWebhookReporter(`${debuggDashboardUrl}/api/errors`, {
    retries: 3,
    timeout: 5000,
    logFailures: true
  })
);

// Also add console reporter for development
if (import.meta.env.DEV) {
  debuggInstance.addReporter(debugg.createConsoleReporter());
}

// Global error handler - catches all unhandled errors
window.addEventListener('error', (event) => {
  debuggInstance.handle(event.error, {
    source: 'window',
    filename: event.filename,
    lineno: event.lineno,
    colno: event.colno,
    message: event.message
  });
});

// Unhandled promise rejections
window.addEventListener('unhandledrejection', (event) => {
  debuggInstance.handle(event.reason, {
    source: 'unhandledrejection',
    promise: event.promise
  });
});

// Performance monitoring - track slow operations
const observer = new PerformanceObserver((list) => {
  for (const entry of list.getEntries()) {
    if (entry.duration > 1000) { // Log operations taking > 1 second
      debuggInstance.createError(null, {
        type: 'slow_operation',
        name: entry.name,
        duration: entry.duration,
        entryType: entry.entryType
      }, 'low');
    }
  }
});

observer.observe({ entryTypes: ['measure', 'longtask'] });

// Network request monitoring
const originalFetch = window.fetch;
window.fetch = async function(...args) {
  const start = performance.now();
  const url = args[0] instanceof Request ? args[0].url : String(args[0]);
  
  try {
    const response = await originalFetch.apply(this, args);
    const duration = performance.now() - start;
    
    // Log slow requests
    if (duration > 3000) {
      debuggInstance.createError(null, {
        type: 'slow_request',
        url,
        method: args[1]?.method || 'GET',
        duration,
        status: response.status
      }, 'medium');
    }
    
    return response;
  } catch (error) {
    // Log failed requests
    debuggInstance.handle(error, {
      type: 'fetch_error',
      url,
      method: args[1]?.method || 'GET'
    });
    throw error;
  }
};

export default debuggInstance;
