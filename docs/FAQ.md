# Debugg FAQ

Frequently Asked Questions about Debugg.

## General

### What is Debugg?

Debugg is a comprehensive, cross-platform error handling and monitoring library for JavaScript and TypeScript applications. It provides unified error handling with automatic classification, multiple reporters, and production-ready features.

### Why should I use Debugg?

- **Unified API** - Same error handling across browser, Node.js, and mobile
- **Automatic Classification** - Errors are automatically classified by severity
- **Multiple Reporters** - Send errors to Sentry, webhooks, console, or custom services
- **Production Ready** - Rate limiting, batching, security features built-in
- **Type Safe** - Full TypeScript support
- **Performance Optimized** - Minimal overhead (< 1ms per error)

### Is Debugg free?

Yes, Debugg is open-source under the MIT license.

---

## Installation

### Which package managers are supported?

Debugg supports all major package managers:
- npm: `npm install debugg`
- yarn: `yarn add debugg`
- Bun: `bun add debugg`
- pnpm: `pnpm add debugg`

### What are the system requirements?

- Node.js >= 18.0.0
- Bun >= 1.3.0
- TypeScript >= 5.0.0 (for TypeScript projects)

### Does Debugg work with React Native?

Yes! Debugg has cross-platform support including React Native.

---

## Usage

### How do I get started?

```typescript
import { debugg } from 'debugg';

try {
  // Your code
} catch (error) {
  await debugg.handle(error, {
    userId: '123',
    action: 'login',
  });
}
```

See [Quick Start Guide](./QUICKSTART.md) for detailed instructions.

### How do I add Sentry?

```typescript
import { debugg, createSentryReporter } from 'debugg';

debugg.addReporter(createSentryReporter('YOUR_SENTRY_DSN'));
```

### Can I use Debugg without Sentry?

Absolutely! Debugg works standalone with just the console reporter, or you can add any combination of reporters.

### How do I create custom reporters?

```typescript
import { ErrorReporter } from 'debugg';

const customReporter: ErrorReporter = async (error) => {
  // Your custom logic
  await sendToYourService(error);
};

debugg.addReporter(customReporter);
```

---

## Features

### What error severity levels are available?

- **critical** - System crashes, syntax errors
- **high** - Type errors, reference errors, network failures
- **medium** - Standard errors (default)
- **low** - Range errors, minor issues
- **info** - Informational messages

### How does automatic classification work?

Debugg analyzes the error type and characteristics:

```typescript
debugg.handle(new TypeError('...'));    // → 'high'
debugg.handle(new SyntaxError('...'));  // → 'critical'
debugg.handle(new Error('...'));        // → 'medium' (default)
```

### What security features are included?

- **Field Redaction** - Automatically redact passwords, tokens, etc.
- **Rate Limiting** - Prevent error flooding
- **XSS Prevention** - Sanitize strings
- **Size Validation** - Limit context size

### Does Debugg support error batching?

Yes! Use the ErrorBatcher for high-traffic scenarios:

```typescript
const batcher = new ErrorBatcher({
  maxBatchSize: 10,
  flushIntervalMs: 5000,
});
```

---

## Performance

### What is the performance overhead?

Debugg adds minimal overhead:
- Error creation: < 0.1ms per error
- Error handling: < 1ms per error
- Memory: < 1KB per error

### Will Debugg slow down my application?

No. Debugg is optimized for production use with:
- Async reporting (non-blocking)
- Batching for efficiency
- Rate limiting to prevent overload
- Configurable performance monitoring

### How much memory does Debugg use?

By default, Debugg stores up to 1000 errors in memory (~1MB). This is configurable:

```typescript
const debugg = new EnhancedErrorHandler({
  // Adjust as needed
});
```

---

## Integration

### Does Debugg work with Express?

Yes! Debugg has built-in Express middleware:

```typescript
import { createExpressErrorHandler } from 'debugg/middleware/express';

app.use(createExpressErrorHandler(debugg));
```

See [Express Integration Guide](./integrations/express.md).

### Can I use Debugg with Next.js?

Absolutely! Debugg supports Next.js getServerSideProps and API routes.

See [Next.js Integration Guide](./integrations/nextjs.md).

### Is there React support?

Yes! Debugg provides ErrorBoundary components and hooks for React.

See [React Integration Guide](./integrations/react.md).

---

## Configuration

### How do I configure Debugg for production?

```typescript
const debugg = new EnhancedErrorHandler({
  serviceName: 'my-app',
  environment: 'production',
  logToConsole: false, // Disable in production
  includeStackTrace: false, // Reduce payload size
  maxContextDepth: 3, // Limit context
  security: {
    redactFields: ['password', 'token'],
    enableRateLimiting: true,
    maxErrorsPerMinute: 100,
  },
});
```

### Can I change the configuration at runtime?

Yes:

```typescript
debugg.updateConfig({
  logToConsole: true,
});

debugg.updateSecurityConfig({
  enableRateLimiting: false,
});
```

### How do I disable Debugg in development?

```typescript
const debugg = new EnhancedErrorHandler({
  environment: process.env.NODE_ENV === 'production' ? 'production' : 'development',
  logToConsole: process.env.NODE_ENV === 'development',
});

// Or conditionally add reporters
if (process.env.NODE_ENV === 'production') {
  debugg.addReporter(createSentryReporter(process.env.SENTRY_DSN));
}
```

---

## Troubleshooting

### Why aren't my errors being reported?

Check:
1. Reporters are added
2. Console logging is enabled (for debugging)
3. Errors are being caught
4. Network connectivity (for remote reporters)

### How do I debug Debugg?

Enable verbose logging:

```typescript
const debugg = new EnhancedErrorHandler({
  logToConsole: true,
});
```

See [Troubleshooting Guide](./TROUBLESHOOTING.md).

---

## Comparison

### How does Debugg compare to Sentry SDK?

| Feature | Debugg | Sentry SDK |
|---------|--------|------------|
| Error Classification | ✅ Automatic | ⚠️ Manual |
| Multiple Reporters | ✅ Built-in | ❌ Sentry only |
| Rate Limiting | ✅ Built-in | ❌ No |
| Cross-Platform | ✅ Unified API | ⚠️ Different SDKs |
| TypeScript | ✅ First-class | ✅ Good |
| Bundle Size | ~73 KB | ~100 KB |

**Use Debugg if:** You want a unified solution with multiple reporters.
**Use Sentry SDK if:** You only use Sentry and want direct integration.

### How does Debugg compare to Winston?

| Feature | Debugg | Winston |
|---------|--------|---------|
| Error-Focused | ✅ Yes | ⚠️ General logging |
| Automatic Classification | ✅ Yes | ❌ No |
| Multiple Reporters | ✅ Built-in | ✅ Transports |
| Security Features | ✅ Yes | ⚠️ Manual |

**Use Debugg if:** You need error-specific features.
**Use Winston if:** You need general application logging.

---

## Contributing

### How can I contribute?

- Report bugs on GitHub
- Submit pull requests
- Improve documentation
- Share your use cases

See [CONTRIBUTING.md](../CONTRIBUTING.md) for guidelines.

### How do I report a bug?

1. Check existing issues
2. Create a minimal reproduction
3. Open a new issue with details
4. Include environment info (Node version, Debugg version, etc.)

---

## Support

### Where can I get help?

- [Documentation](../docs/)
- [API Reference](../api/)
- [GitHub Issues](https://github.com/your-org/debugg/issues)
- [Discussions](https://github.com/your-org/debugg/discussions)

### Is there commercial support?

Contact us at support@debugg.example.com for enterprise support options.

---

## License

### What license is Debugg under?

Debugg is licensed under the MIT license. You're free to use it in personal and commercial projects.

### Do I need to attribute Debugg?

No, but we appreciate a star on GitHub! ⭐
