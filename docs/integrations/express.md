# Express Integration Guide

Complete guide for integrating Debugg into Express applications.

## Installation

```bash
npm install debugg
# or
yarn add debugg
# or  
bun add debugg
```

## Basic Setup

### 1. Create Error Handler

```typescript
// src/utils/errorHandler.ts
import { EnhancedErrorHandler } from 'debugg';

export const debugg = new EnhancedErrorHandler({
  serviceName: 'my-express-api',
  environment: process.env.NODE_ENV || 'development',
  logToConsole: process.env.NODE_ENV === 'development',
  security: {
    redactFields: ['password', 'token', 'apiKey'],
    enableRateLimiting: true,
    maxErrorsPerMinute: 100,
  },
});

// Add reporters
import { createConsoleReporter, createSentryReporter } from 'debugg';

debugg.addReporter(createConsoleReporter());

if (process.env.SENTRY_DSN) {
  debugg.addReporter(createSentryReporter(process.env.SENTRY_DSN));
}

export default debugg;
```

### 2. Setup Express Middleware

```typescript
// src/middleware/errorHandler.ts
import { Request, Response, NextFunction } from 'express';
import { debugg } from '../utils/errorHandler';

export function expressErrorHandler(
  err: Error,
  req: Request,
  res: Response,
  next: NextFunction
) {
  // Handle the error with Debugg
  debugg.handle(err, {
    endpoint: req.path,
    method: req.method,
    headers: req.headers,
    query: req.query,
    body: req.body,
    userAgent: req.get('user-agent'),
    ip: req.ip,
  });

  // Send appropriate response
  if (err.name === 'ValidationError') {
    res.status(400).json({
      error: 'Validation Error',
      message: err.message,
    });
  } else if (err.name === 'UnauthorizedError') {
    res.status(401).json({
      error: 'Unauthorized',
      message: err.message,
    });
  } else {
    res.status(500).json({
      error: 'Internal Server Error',
      message: process.env.NODE_ENV === 'production' 
        ? 'An unexpected error occurred' 
        : err.message,
    });
  }
}
```

### 3. Apply Middleware to Express App

```typescript
// src/app.ts
import express from 'express';
import { expressErrorHandler } from './middleware/errorHandler';
import routes from './routes';

const app = express();

// Your routes
app.use('/api', routes);

// Error handler middleware (must be last)
app.use(expressErrorHandler);

export default app;
```

## Usage in Routes

### Async Route Handler Wrapper

```typescript
// src/utils/asyncHandler.ts
import { Request, Response, NextFunction } from 'express';

export const asyncHandler = (
  fn: (req: Request, res: Response, next: NextFunction) => Promise<void>
) => {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

// Usage
import { Router } from 'express';
import { asyncHandler } from '../utils/asyncHandler';

const router = Router();

router.get('/users/:id', asyncHandler(async (req, res) => {
  const user = await getUserById(req.params.id);
  if (!user) {
    const error = new Error('User not found');
    (error as any).status = 404;
    throw error;
  }
  res.json(user);
}));
```

### Manual Error Handling

```typescript
router.post('/users', async (req, res, next) => {
  try {
    const user = await createUser(req.body);
    res.status(201).json(user);
  } catch (error) {
    next(error); // Pass to error handler middleware
  }
});
```

### With Context

```typescript
router.post('/payments', async (req, res, next) => {
  try {
    const payment = await processPayment(req.body);
    res.json(payment);
  } catch (error) {
    // Add additional context before passing to middleware
    (error as any).debuggContext = {
      amount: req.body.amount,
      currency: req.body.currency,
      userId: req.user?.id,
    };
    next(error);
  }
});

// In error handler middleware
export function expressErrorHandler(
  err: any,
  req: Request,
  res: Response,
  next: NextFunction
) {
  debugg.handle(err, {
    endpoint: req.path,
    method: req.method,
    ...(err.debuggContext || {}),
  });
  // ... rest of handler
}
```

## Advanced Features

### Request Validation

```typescript
import { body, validationResult } from 'express-validator';

router.post(
  '/users',
  [
    body('email').isEmail(),
    body('password').isLength({ min: 8 }),
  ],
  asyncHandler(async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      const error = new Error('Validation failed');
      (error as any).status = 400;
      (error as any).details = errors.array();
      throw error;
    }
    
    const user = await createUser(req.body);
    res.status(201).json(user);
  })
);
```

### Database Error Handling

```typescript
import { QueryFailedError } from 'typeorm';

router.post('/data', asyncHandler(async (req, res) => {
  try {
    const data = await repository.save(req.body);
    res.json(data);
  } catch (error) {
    if (error instanceof QueryFailedError) {
      const dbError = new Error('Database operation failed');
      (dbError as any).status = 500;
      throw dbError;
    }
    throw error;
  }
}));
```

### Rate Limiting Integration

```typescript
import rateLimit from 'express-rate-limit';

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  handler: (req, res) => {
    const error = new Error('Too many requests');
    (error as any).status = 429;
    throw error;
  },
});

app.use('/api/', limiter);
```

## Process-Level Error Handlers

```typescript
// src/utils/setupProcessHandlers.ts
import { debugg } from './errorHandler';

export function setupProcessHandlers() {
  // Uncaught exceptions
  process.on('uncaughtException', (error) => {
    debugg.handle(error, {
      source: 'uncaughtException',
      process: 'main',
    });
    console.error('Uncaught Exception:', error);
    // Graceful shutdown
    setTimeout(() => process.exit(1), 1000);
  });

  // Unhandled promise rejections
  process.on('unhandledRejection', (reason, promise) => {
    debugg.handle(reason, {
      source: 'unhandledRejection',
      process: 'main',
    });
    console.error('Unhandled Rejection at:', promise, 'reason:', reason);
  });
}

// Call in your main file
setupProcessHandlers();
```

## Best Practices

1. **Always use asyncHandler** - Prevents unhandled promise rejections
2. **Add context to errors** - Include request details, user info
3. **Use appropriate status codes** - Helps with error classification
4. **Don't expose internal errors** - Generic messages in production
5. **Implement graceful shutdown** - Handle uncaught exceptions
6. **Redact sensitive data** - Configure security settings

## Example Project Structure

```
src/
├── middleware/
│   └── errorHandler.ts
├── routes/
│   └── index.ts
├── utils/
│   ├── errorHandler.ts
│   ├── asyncHandler.ts
│   └── setupProcessHandlers.ts
├── app.ts
└── index.ts
```

## Complete Example

```typescript
// src/index.ts
import app from './app';
import { debugg } from './utils/errorHandler';
import { setupProcessHandlers } from './utils/setupProcessHandlers';

const PORT = process.env.PORT || 3000;

// Setup process-level handlers
setupProcessHandlers();

// Start server
app.listen(PORT, () => {
  debugg.createError(null, {
    event: 'server_start',
    port: PORT,
    environment: process.env.NODE_ENV,
  }, 'info');
  
  console.log(`Server running on port ${PORT}`);
});
```

## Next Steps

- [API Documentation](../api/)
- [Security Best Practices](./security.md)
- [Performance Monitoring](./performance.md)
