# Quick Start Guide

Get up and running with Debugg in under 5 minutes.

## 1. Installation

```bash
# Using npm
npm install debugg

# Using yarn
yarn add debugg

# Using Bun (recommended)
bun add debugg
```

## 2. Basic Setup

Create an error handler instance:

```typescript
// src/errorHandler.ts
import { EnhancedErrorHandler } from 'debugg';

export const debugg = new EnhancedErrorHandler({
  serviceName: 'my-app',
  environment: process.env.NODE_ENV || 'development',
  logToConsole: true,
});
```

## 3. Add Reporters

Configure where errors should be sent:

```typescript
import { createConsoleReporter, createSentryReporter } from 'debugg';

// Console reporter (great for development)
debugg.addReporter(createConsoleReporter());

// Sentry reporter (for production)
if (process.env.SENTRY_DSN) {
  debugg.addReporter(
    createSentryReporter(process.env.SENTRY_DSN)
  );
}
```

## 4. Start Handling Errors

```typescript
import { debugg } from './errorHandler';

try {
  await riskyOperation();
} catch (error) {
  await debugg.handle(error, {
    userId: '123',
    action: 'login',
  });
}
```

That's it! You're now handling errors like a pro. 🎉

---

## Next Steps

### Add Context for Better Debugging

```typescript
await debugg.handle(error, {
  userId: user.id,
  email: user.email,
  endpoint: '/api/users',
  method: 'POST',
  body: req.body,
  timestamp: new Date().toISOString(),
});
```

### Use Severity Levels

```typescript
// Let Debugg classify automatically
await debugg.handle(error, context);

// Or override
await debugg.handle(error, context, 'high');
```

### Create Custom Reporters

```typescript
import { ErrorReporter } from 'debugg';

const myReporter: ErrorReporter = async (error) => {
  await fetch('https://my-service.com/errors', {
    method: 'POST',
    body: JSON.stringify(error),
  });
};

debugg.addReporter(myReporter);
```

---

## Framework Quick Starts

### React

```typescript
// Wrap your app
import { ErrorBoundary } from './ErrorBoundary';

function App() {
  return (
    <ErrorBoundary>
      <MyComponent />
    </ErrorBoundary>
  );
}

// Handle errors in components
function MyComponent() {
  const handleError = useErrorHandler('MyComponent');
  
  useEffect(() => {
    fetchData().catch(handleError);
  }, []);
}
```

### Express

```typescript
import { createExpressErrorHandler } from 'debugg/middleware/express';

// Add as last middleware
app.use(createExpressErrorHandler(debugg));

// Use in routes
app.get('/users', asyncHandler(async (req, res) => {
  const users = await getUsers();
  res.json(users);
}));
```

### Next.js

```typescript
// pages/_error.tsx
export default function Error({ statusCode, hasGetInitialPropsRun }) {
  useEffect(() => {
    debugg.createError(new Error(`Error ${statusCode}`), {
      page: window.location.pathname,
    });
  }, []);
  
  return <div>Error occurred</div>;
}
```

---

## Configuration Quick Reference

### Development

```typescript
new EnhancedErrorHandler({
  serviceName: 'my-app',
  environment: 'development',
  logToConsole: true,
  includeStackTrace: true,
  maxContextDepth: 10,
});
```

### Production

```typescript
new EnhancedErrorHandler({
  serviceName: 'my-app',
  environment: 'production',
  logToConsole: false,
  includeStackTrace: false,
  maxContextDepth: 3,
  security: {
    redactFields: ['password', 'token'],
    enableRateLimiting: true,
    maxErrorsPerMinute: 100,
  },
});
```

---

## Common Patterns

### Async/Await

```typescript
async function fetchData() {
  try {
    const data = await api.get('/data');
    return data;
  } catch (error) {
    await debugg.handle(error, { endpoint: '/data' });
    throw error; // Re-throw if needed
  }
}
```

### Promise Chains

```typescript
api.get('/data')
  .then(data => console.log(data))
  .catch(error => debugg.handle(error, { endpoint: '/data' }));
```

### Event Handlers

```typescript
button.addEventListener('click', async () => {
  try {
    await performAction();
  } catch (error) {
    await debugg.handle(error, { action: 'click' });
  }
});
```

---

## Testing Your Setup

```typescript
// Test error handling
await debugg.handle(new Error('Test error'), {
  test: true,
});

// Check if error was reported
const errors = debugg.getStorage().getAllErrors();
console.log('Errors captured:', errors.length);

// Get statistics
const stats = debugg.getStats();
console.log('Statistics:', stats);
```

---

## Troubleshooting

**Not seeing errors?**
- Check that reporters are added
- Ensure `logToConsole` is true in development
- Verify errors are being caught

**Too many errors?**
- Use appropriate severity levels
- Implement rate limiting
- Filter in custom reporters

**Performance concerns?**
- Enable batching for high-traffic apps
- Use debouncing for rapid errors
- Configure storage limits

---

## Learn More

- [Full Documentation](../docs/)
- [API Reference](../api/)
- [Integration Guides](../docs/integrations/)
- [Examples](../examples/)

---

## Need Help?

- [FAQ](./FAQ.md)
- [Troubleshooting](./TROUBLESHOOTING.md)
- [GitHub Issues](https://github.com/your-org/debugg/issues)

Happy debugging! 🐞
