# Migration Guide

Migrating from other error handling solutions to Debugg.

## From Sentry SDK

### Before (Sentry SDK)

```typescript
import * as Sentry from '@sentry/node';

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  environment: process.env.NODE_ENV,
});

try {
  // code
} catch (error) {
  Sentry.captureException(error, {
    tags: { key: 'value' },
    extra: { context: 'data' },
  });
}
```

### After (Debugg)

```typescript
import { debugg, createSentryReporter } from 'debugg';

debugg.addReporter(createSentryReporter(process.env.SENTRY_DSN));

try {
  // code
} catch (error) {
  await debugg.handle(error, {
    key: 'value',
    context: 'data',
  });
}
```

**Benefits:**
- ✅ Unified API across platforms
- ✅ Automatic error classification
- ✅ Built-in rate limiting
- ✅ Multiple reporters (not just Sentry)

---

## From Winston/Bunyan

### Before (Winston)

```typescript
import winston from 'winston';

const logger = winston.createLogger({
  level: 'error',
  transports: [
    new winston.transports.Console(),
    new winston.transports.File({ filename: 'error.log' }),
  ],
});

logger.error('Database error', {
  userId: 123,
  error: error.message,
  stack: error.stack,
});
```

### After (Debugg)

```typescript
import { debugg, createConsoleReporter } from 'debugg';

debugg.addReporter(createConsoleReporter());

await debugg.handle(error, {
  userId: 123,
});
```

**Benefits:**
- ✅ Structured error format
- ✅ Automatic severity classification
- ✅ Built-in console reporter
- ✅ Error tracking and analytics

---

## From Custom Error Handler

### Before

```typescript
class ErrorHandler {
  async log(error: Error, context: any) {
    console.error(error);
    await this.sendToService(error, context);
  }
  
  async sendToService(error: Error, context: any) {
    // Custom implementation
  }
}
```

### After

```typescript
import { debugg } from 'debugg';

// Debugg handles everything
await debugg.handle(error, context);
```

**Benefits:**
- ✅ Production-ready out of the box
- ✅ Multiple reporters
- ✅ Security features built-in
- ✅ Performance monitoring

---

## From express-error-handler

### Before

```typescript
import errorHandler from 'express-error-handler';

app.use(errorHandler({
  logErrors: true,
  onLog: (error, req) => {
    console.error(error, req.path);
  },
}));
```

### After

```typescript
import { createExpressErrorHandler } from 'debugg/middleware/express';

app.use(createExpressErrorHandler(debugg, {
  logErrors: true,
  includeRequestDetails: true,
}));
```

**Benefits:**
- ✅ More context captured
- ✅ Security features
- ✅ Better Express integration

---

## Step-by-Step Migration

### Step 1: Install Debugg

```bash
npm install debugg
# Keep old library temporarily for comparison
```

### Step 2: Create Configuration

```typescript
// src/utils/errorHandler.ts
import { EnhancedErrorHandler } from 'debugg';

export const debugg = new EnhancedErrorHandler({
  serviceName: 'my-app',
  environment: process.env.NODE_ENV,
  logToConsole: true,
});
```

### Step 3: Add Reporters

```typescript
import { createConsoleReporter, createSentryReporter } from 'debugg';

debugg.addReporter(createConsoleReporter());

if (process.env.SENTRY_DSN) {
  debugg.addReporter(createSentryReporter(process.env.SENTRY_DSN));
}
```

### Step 4: Replace Error Logging

**Before:**
```typescript
logger.error(error, context);
```

**After:**
```typescript
await debugg.handle(error, context);
```

### Step 5: Test Thoroughly

- Run existing tests
- Verify errors are being reported
- Check error format and context
- Monitor performance

### Step 6: Remove Old Library

```bash
npm uninstall winston @sentry/node # etc.
```

---

## Common Migration Issues

### Issue: Missing features from old library

**Solution:** Debugg has most features built-in. Check the [API Documentation](../api/) for equivalents.

### Issue: Different error format

**Solution:** Debugg uses a standardized format. Update any downstream systems that parse errors.

### Issue: Performance concerns

**Solution:** Debugg is optimized for performance. Use batching and debouncing for high-traffic apps.

---

## Migration Checklist

- [ ] Install Debugg
- [ ] Create configuration
- [ ] Add reporters
- [ ] Replace error logging calls
- [ ] Update error middleware
- [ ] Test error scenarios
- [ ] Verify error reporting
- [ ] Remove old library
- [ ] Update documentation

---

## Need Help?

- [API Documentation](../api/)
- [Troubleshooting Guide](./TROUBLESHOOTING.md)
- [FAQ](./FAQ.md)
- [GitHub Issues](https://github.com/your-org/debugg/issues)
