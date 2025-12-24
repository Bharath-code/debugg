/**
 * Debugg Express.js Integration Example
 * Demonstrates comprehensive error handling for Express applications
 */

import express from 'express';
import { ErrorHandler, createConsoleReporter, createSentryReporter } from '../src/index';

// 🎨 Initialize Debugg for Express application
const debugg = new ErrorHandler({
  serviceName: 'express-api-server',
  environment: process.env.NODE_ENV || 'development',
  defaultSeverity: 'high', // APIs typically need higher severity
  logToConsole: process.env.NODE_ENV !== 'production'
});

// 🚀 Add reporters based on environment
if (process.env.NODE_ENV === 'production') {
  debugg.addReporter(createSentryReporter('YOUR_SENTRY_DSN'));
} else {
  debugg.addReporter(createConsoleReporter());
}

// 🛡️ Express Error Handling Middleware
function debuggErrorHandler() {
  return async (err: Error, req: express.Request, res: express.Response, next: express.NextFunction) => {
    // 📊 Capture error with Debugg
    await debugg.handle(err, {
      endpoint: req.path,
      method: req.method,
      headers: req.headers,
      body: req.body,
      query: req.query,
      params: req.params,
      ip: req.ip,
      userAgent: req.get('User-Agent'),
      timestamp: new Date().toISOString()
    });

    // 🔄 Determine appropriate HTTP status code
    const statusCode = determineStatusCode(err);

    // 📝 Send consistent error response
    res.status(statusCode).json({
      success: false,
      error: {
        message: process.env.NODE_ENV === 'production'
          ? 'Internal Server Error'
          : err.message,
        code: statusCode,
        timestamp: new Date().toISOString()
      }
    });
  };
}

// 🎯 Helper function to determine HTTP status code
function determineStatusCode(error: Error): number {
  if (error.name === 'ValidationError') return 400;
  if (error.name === 'UnauthorizedError') return 401;
  if (error.name === 'ForbiddenError') return 403;
  if (error.name === 'NotFoundError') return 404;
  if (error.message.includes('ECONNREFUSED')) return 503;
  return 500; // Default to Internal Server Error
}

// 📱 Example Express Application with Debugg
const app = express();
const PORT = process.env.PORT || 3000;

// 📝 JSON parsing middleware
app.use(express.json());

// 🔍 Request logging middleware
app.use((req, res, next) => {
  debugg.handle(new Error('Request received'), {
    endpoint: req.path,
    method: req.method,
    type: 'request_log',
    severityOverride: 'info'
  }).catch(console.error);
  next();
});

// 📱 API Routes with Debugg integration
app.get('/api/users', async (req, res, next) => {
  try {
    // 🔍 Simulate database fetch with error handling
    const users = await fetchUsersFromDatabase().catch(error => {
      throw new Error(`Database error: ${error.message}`);
    });

    res.json({
      success: true,
      data: users
    });
  } catch (error) {
    next(error); // Pass to error handler
  }
});

app.post('/api/users', async (req, res, next) => {
  try {
    // 📝 Validate input
    if (!req.body.email) {
      const validationError = new Error('Email is required');
      validationError.name = 'ValidationError';
      throw validationError;
    }

    // 🔧 Create user with Debugg context
    const newUser = await createUserInDatabase(req.body).catch(error => {
      debugg.handle(error, {
        action: 'create_user',
        userData: req.body,
        endpoint: '/api/users'
      });
      throw new Error('Failed to create user');
    });

    res.status(201).json({
      success: true,
      data: newUser
    });
  } catch (error) {
    next(error); // Pass to error handler
  }
});

// 🔐 Authentication middleware with Debugg
function authenticateUser(req: express.Request, res: express.Response, next: express.NextFunction) {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader) {
      const error = new Error('Authorization header missing');
      error.name = 'UnauthorizedError';
      throw error;
    }

    // 🔑 Simulate token verification
    const token = authHeader.split(' ')[1];
    if (!isValidToken(token)) {
      const error = new Error('Invalid authentication token');
      error.name = 'UnauthorizedError';
      throw error;
    }

    // 🎉 Authentication successful
    next();
  } catch (error) {
    debugg.handle(error, {
      endpoint: req.path,
      method: req.method,
      authHeader: req.headers.authorization,
      type: 'authentication_error'
    });
    next(error);
  }
}

// 📱 Protected route example
app.get('/api/protected', authenticateUser, async (req, res, next) => {
  try {
    const sensitiveData = await fetchSensitiveData();
    res.json({
      success: true,
      data: sensitiveData
    });
  } catch (error) {
    next(error);
  }
});

// 🚨 404 Handler
app.use((req, res, next) => {
  const notFoundError = new Error(`Not Found: ${req.path}`);
  notFoundError.name = 'NotFoundError';
  debugg.handle(notFoundError, {
    endpoint: req.path,
    method: req.method,
    type: 'route_not_found'
  }).catch(console.error);
  res.status(404).json({
    success: false,
    error: {
      message: 'Resource not found',
      code: 404
    }
  });
});

// 🛡️ Use Debugg error handler as the last middleware
app.use(debuggErrorHandler());

// 🚀 Start the server with Debugg protection
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`🛡️ Debugg error handling active`);

  // 📊 Log server start with Debugg
  debugg.handle(new Error('Server started'), {
    port: PORT,
    environment: process.env.NODE_ENV,
    timestamp: new Date().toISOString(),
    severityOverride: 'info'
  }).catch(console.error);
});

// 📱 Example database functions (simulated)
async function fetchUsersFromDatabase(): Promise<any[]> {
  // Simulate database delay
  await new Promise(resolve => setTimeout(resolve, 100));

  // 🎲 Simulate random error for demonstration
  if (Math.random() < 0.1) {
    throw new Error('Database connection timeout');
  }

  return [
    { id: 1, name: 'John Doe', email: 'john@example.com' },
    { id: 2, name: 'Jane Smith', email: 'jane@example.com' }
  ];
}

async function createUserInDatabase(userData: any): Promise<any> {
  // Simulate database delay
  await new Promise(resolve => setTimeout(resolve, 100));

  // 🎲 Simulate random error for demonstration
  if (Math.random() < 0.1) {
    throw new Error('Database constraint violation');
  }

  return {
    id: Math.floor(Math.random() * 1000),
    ...userData,
    createdAt: new Date().toISOString()
  };
}

function fetchSensitiveData(): Promise<any> {
  return Promise.resolve({
    message: 'This is protected data!',
    timestamp: new Date().toISOString()
  });
}

function isValidToken(token: string): boolean {
  // Simple token validation for example
  return token === 'valid-token' || token === 'test-token';
}

// 📚 Export for testing and usage
export { app, debuggErrorHandler, debugg };
export default app;