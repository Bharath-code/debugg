# Troubleshooting Guide

Common issues and solutions when using Debugg.

## Installation Issues

### Issue: "Cannot find module 'debugg'"

**Cause:** Package not installed or incorrect import path.

**Solution:**
```bash
# Reinstall package
npm install debugg
# or
yarn add debugg
# or
bun add debugg

# Check import
import { debugg } from 'debugg'; // Correct
import { debugg } from 'debug';  // Wrong
```

### Issue: TypeScript errors

**Cause:** Missing type definitions or incompatible TypeScript version.

**Solution:**
```bash
# Ensure TypeScript >= 5.0
npm install -D typescript@^5.0.0

# Clear cache and rebuild
rm -rf node_modules dist
npm install
npm run build
```

---

## Configuration Issues

### Issue: Errors not being reported

**Possible Causes:**
1. Reporters not added
2. Console logging disabled
3. Errors being swallowed

**Solution:**
```typescript
// Verify reporter setup
const debugg = new EnhancedErrorHandler({
  logToConsole: true, // Enable for debugging
});

debugg.addReporter(createConsoleReporter());

// Test
await debugg.handle(new Error('Test error'), {});
```

### Issue: Too many errors reported

**Solution:** Use severity levels and filtering:
```typescript
// Use appropriate severity
debugg.handle(error, context, 'low'); // For minor issues

// Or filter in reporter
debugg.addReporter(async (error) => {
  if (error.severity === 'info') return; // Skip info errors
  // Report others
});
```

### Issue: Sensitive data being logged

**Solution:** Configure field redaction:
```typescript
const debugg = new EnhancedErrorHandler({
  security: {
    redactFields: ['password', 'token', 'apiKey', 'secret'],
    sanitizeStrings: true,
  },
});
```

---

## Runtime Issues

### Issue: Application crashes on error

**Cause:** Unhandled promise rejection or uncaught exception.

**Solution:**
```typescript
// Setup global handlers
process.on('uncaughtException', (error) => {
  debugg.handle(error, { source: 'uncaughtException' });
  setTimeout(() => process.exit(1), 1000);
});

process.on('unhandledrejection', (event) => {
  debugg.handle(event.reason, { source: 'unhandledRejection' });
});
```

### Issue: Performance degradation

**Cause:** Too many errors being reported synchronously.

**Solution:** Enable batching and rate limiting:
```typescript
const debugg = new EnhancedErrorHandler({
  security: {
    enableRateLimiting: true,
    maxErrorsPerMinute: 100,
  },
});

// Use error debouncer
const debouncer = new ErrorDebouncer({
  intervalMs: 1000,
  enabled: true,
});
```

### Issue: Memory leaks

**Cause:** Errors being stored but never cleaned up.

**Solution:**
```typescript
// Configure storage limits
const debugg = new EnhancedErrorHandler({
  // Default max is 1000 errors
});

// Or manually clear
setInterval(() => {
  debugg.getStorage().clearAllErrors();
}, 60000); // Clear every minute
```

---

## Framework-Specific Issues

### React: Error Boundary not catching errors

**Cause:** Error boundary not wrapping component tree.

**Solution:**
```typescript
// In index.tsx
root.render(
  <ErrorBoundary>
    <App />
  </ErrorBoundary>
);
```

### Express: Errors not reaching middleware

**Cause:** Missing next() call or async handler wrapper.

**Solution:**
```typescript
// Use async handler wrapper
app.get('/route', asyncHandler(async (req, res) => {
  // Errors will be caught
}));

// Or manually call next()
app.get('/route', async (req, res, next) => {
  try {
    // code
  } catch (error) {
    next(error);
  }
});
```

### Next.js: getServerSideProps errors

**Cause:** Not wrapping getServerSideProps.

**Solution:**
```typescript
export const getServerSideProps = withErrorHandler(async (context) => {
  try {
    // code
  } catch (error) {
    await debugg.handle(error, { page: context.resolvedUrl });
    return { props: { error: 'An error occurred' } };
  }
});
```

---

## Reporter Issues

### Sentry reporter not sending errors

**Possible Causes:**
1. Invalid DSN
2. Sentry not installed
3. Network issues

**Solution:**
```typescript
// Verify DSN format
const reporter = createSentryReporter('https://key@sentry.io/project');

// Check if Sentry is installed
try {
  await import('@sentry/node');
} catch {
  console.warn('Sentry not installed');
}
```

### Webhook reporter failing

**Cause:** Invalid URL or network issues.

**Solution:**
```typescript
// Validate URL
const reporter = createWebhookReporter('https://example.com/webhook', {
  retries: 3,
  timeout: 5000,
  logFailures: true,
});
```

---

## Build Issues

### Issue: Build fails with "Module not found"

**Solution:**
```bash
# Clear cache
rm -rf node_modules dist
npm install

# Rebuild
npm run build
```

### Issue: Bundle size too large

**Solution:**
```bash
# Analyze bundle
npm run build:size

# Check for large dependencies
npm ls --depth=0
```

---

## Debugging Tips

### Enable verbose logging

```typescript
const debugg = new EnhancedErrorHandler({
  logToConsole: true,
});

debugg.addReporter(createConsoleReporter({
  useGroups: true,
}));
```

### Inspect error object

```typescript
await debugg.handle(error, {
  debug: true,
});

// Get stored errors
const errors = debugg.getStorage().getAllErrors();
console.log(errors[0]);
```

### Check configuration

```typescript
console.log(debugg.getConfig());
console.log(debugg.getStats());
```

---

## Getting Help

If you can't find a solution:

1. **Check the [FAQ](./FAQ.md)**
2. **Search [GitHub Issues](https://github.com/your-org/debugg/issues)**
3. **Review [API Documentation](../api/)**
4. **Create a minimal reproduction**
5. **Open a new issue with details**

---

## Quick Reference

| Issue | Quick Fix |
|-------|-----------|
| Not reporting | Check reporters added |
| Too many errors | Use severity levels |
| Sensitive data | Configure redaction |
| Performance | Enable rate limiting |
| Memory | Clear storage periodically |
| Build fails | Clear cache, reinstall |
