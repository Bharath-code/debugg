# 🐞 Debugg - Smart Error Handling for Developers

**Debug smarter, not harder!** A comprehensive, cross-platform error handling and monitoring library that makes debugging enjoyable.

[![npm version](https://badge.fury.io/js/debugg.svg)](https://badge.fury.io/js/debugg)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0+-blue.svg)](https://www.typescriptlang.org/)
[![Bun Optimized](https://img.shields.io/badge/Optimized%20for-Bun-ff69b4.svg)](https://bun.sh)
[![Test Coverage](https://img.shields.io/badge/Coverage-180+-tests-success.svg)](https://github.com/your-org/debugg)

## 🚀 Why Debugg?

**We believe error handling should be enjoyable, not frustrating!** Debugg solves universal developer pain points:

1. ❌ **Inconsistent error handling** across different parts of applications
2. ❌ **Lack of context** when errors occur
3. ❌ **No standardized severity levels**
4. ❌ **Multiple monitoring tools** with different APIs
5. ❌ **Cross-platform challenges**

## ✨ Solution

A **single, unified library** that provides:

- ✅ **Consistent error format** across all platforms
- ✅ **Automatic error classification** with severity levels
- ✅ **Rich context attachment** for better debugging
- ✅ **Unique error IDs** for tracking
- ✅ **Multiple reporter support** (Sentry, webhooks, console, custom)
- ✅ **Cross-platform detection** (Browser, Node.js, Mobile)
- ✅ **Type-safe API** with comprehensive TypeScript support
- ✅ **Production-ready** with security features

## 📦 Installation

```bash
# Using npm
npm install debugg

# Using yarn
yarn add debugg

# Using Bun (recommended)
bun add debugg
```

## 🏗️ Quick Start

### 1. Basic Setup

```typescript
import { debugg } from 'debugg';

// Debugg is ready to use with sensible defaults
try {
  await riskyOperation();
} catch (error) {
  await debugg.handle(error, {
    userId: '123',
    action: 'login',
  });
}
```

### 2. Configure for Your App

```typescript
import { EnhancedErrorHandler, createConsoleReporter, createSentryReporter } from 'debugg';

const debugg = new EnhancedErrorHandler({
  serviceName: 'my-awesome-app',
  environment: process.env.NODE_ENV || 'development',
  logToConsole: true,
  security: {
    redactFields: ['password', 'token', 'apiKey'],
    enableRateLimiting: true,
  },
});

// Add reporters
debugg.addReporter(createConsoleReporter());

if (process.env.SENTRY_DSN) {
  debugg.addReporter(createSentryReporter(process.env.SENTRY_DSN));
}
```

### 3. That's It!

Enjoy beautiful, structured error handling! 🎉

## 🎯 Key Features

### Automatic Error Classification

```typescript
debugg.handle(new TypeError('...'));        // → 'high' severity
debugg.handle(new SyntaxError('...'));      // → 'critical' severity
debugg.handle(new Error('Network error'));  // → 'high' (auto-detected)
debugg.handle({ status: 500 });            // → 'critical' severity
```

### Rich Context Support

```typescript
await debugg.handle(error, {
  userId: user.id,
  operation: 'update_profile',
  database: 'postgresql',
  query: 'UPDATE users SET name = $1',
  parameters: ['John Doe'],
  // Add anything that helps debugging!
});
```

### Multiple Reporters

```typescript
// Send errors everywhere
debugg.addReporter(createConsoleReporter());
debugg.addReporter(createSentryReporter('YOUR_DSN'));
debugg.addReporter(createWebhookReporter('https://api.example.com/errors'));
```

### Cross-Platform Detection

```typescript
const error = debugg.createError(new Error('test'));
console.log(error.metadata.platform);
// Returns: 'browser' | 'node' | 'mobile' | 'unknown'
```

### Security Features

```typescript
const debugg = new EnhancedErrorHandler({
  security: {
    redactFields: ['password', 'token', 'secret'],
    maxContextSize: 1024 * 1024, // 1MB
    enableRateLimiting: true,
    maxErrorsPerMinute: 100,
    sanitizeStrings: true, // XSS prevention
  },
});
```

### Performance Optimization

```typescript
// Error batching for high-traffic apps
const batcher = new ErrorBatcher({
  maxBatchSize: 10,
  flushIntervalMs: 5000,
});

// Error debouncing to prevent flooding
const debouncer = new ErrorDebouncer({
  intervalMs: 1000,
  maxBuffered: 10,
});
```

## 📚 Documentation

- **[Quick Start Guide](docs/QUICKSTART.md)** - Get started in 5 minutes
- **[API Documentation](docs/api/)** - Complete API reference
- **[Integration Guides](docs/integrations/)** - React, Vue, Express, Next.js
- **[Migration Guide](docs/MIGRATION.md)** - From other error handlers
- **[Troubleshooting](docs/TROUBLESHOOTING.md)** - Common issues
- **[FAQ](docs/FAQ.md)** - Frequently asked questions

## 🛠️ Framework Integration

### React

```typescript
import { ErrorBoundary } from 'debugg/react';

<ErrorBoundary>
  <App />
</ErrorBoundary>
```

[See React Integration Guide →](docs/integrations/react.md)

### Express

```typescript
import { createExpressErrorHandler } from 'debugg/middleware/express';

app.use(createExpressErrorHandler(debugg));
```

[See Express Integration Guide →](docs/integrations/express.md)

### Next.js

```typescript
import { withErrorHandler } from 'debugg/next';

export const getServerSideProps = withErrorHandler(async (context) => {
  // Your code
});
```

[See Next.js Integration Guide →](docs/integrations/nextjs.md)

## 📊 Built-in Reporters

| Reporter | Description | Installation |
|----------|-------------|--------------|
| **Console** | Formatted console output | Built-in |
| **Sentry** | Sentry.io integration | `bun add @sentry/node` |
| **Webhook** | HTTP webhook endpoint | Built-in |
| **Custom** | Your own reporter | Built-in |

## 🔍 Error Classification

| Error Type | Severity | Description |
|------------|----------|-------------|
| `SyntaxError` | Critical | Code syntax issues |
| `TypeError` | High | Type-related errors |
| `ReferenceError` | High | Undefined variables |
| `RangeError` | Medium | Invalid ranges |
| Network errors | High | Connection issues |
| HTTP 5xx | Critical | Server errors |
| HTTP 4xx | Medium | Client errors |

## 🚀 Advanced Usage

### Custom Error Reporters

```typescript
import { ErrorReporter } from 'debugg';

const myReporter: ErrorReporter = async (error) => {
  await fetch('https://my-service.com/errors', {
    method: 'POST',
    body: JSON.stringify(error),
    headers: { 'Content-Type': 'application/json' },
  });
};

debugg.addReporter(myReporter);
```

### Error Analytics

```typescript
// Get error metrics
const metrics = debugg.getErrorMetrics();
console.log(`Total errors: ${metrics.totalErrors}`);
console.log(`Resolution rate: ${metrics.resolutionRate}%`);

// Get mean time to debug
const mttd = debugg.getMeanTimeToDebug();
console.log(`Mean time to debug: ${mttd}s`);
```

### CI Quality Gates

```typescript
// Set baseline
debugg.setCIBaseline(10); // 10 errors in previous build

// Run quality gates
const result = await debugg.runCIQualityGates();

if (!result.passed) {
  console.error('Quality gates failed:', result.message);
  process.exit(1);
}
```

## 📈 Performance

Debugg is optimized for production:

- **Error Creation:** < 0.1ms per error
- **Error Handling:** < 1ms per error
- **Memory Usage:** < 1KB per error
- **Bundle Size:** ~73 KB (gzipped)

## 🧪 Testing

```bash
# Run tests
bun test

# Run with coverage
bun run test:coverage

# Run specific test suite
bun run test:integration
bun run test:e2e
bun run test:performance
```

## 🏗️ Build

```bash
# Build library
bun run build

# Development mode
bun run dev

# Analyze bundle size
bun run build:size

# Verify tree-shaking
bun run build:verify
```

## 🤝 Contributing

Contributions are welcome! Please read our [Contributing Guide](CONTRIBUTING.md) for details.

### Quick Start for Contributors

```bash
# Clone repository
git clone https://github.com/your-org/debugg.git
cd debugg

# Install dependencies
bun install

# Start development
bun run dev

# Run tests
bun test
```

## 📄 License

MIT License - see [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgements

- Inspired by developer pain points worldwide
- Built with love for the JavaScript/TypeScript community
- Designed to make error handling enjoyable

---

## 🎨 Brand Identity

- **Mascot:** Debugg the Bug 🐞 - friendly, helpful
- **Mission:** Make error handling enjoyable
- **Colors:** Vibrant red (#FF4757) for energy
- **Typography:** Inter for clean readability

---

**🔥 Ready to debug smarter? Install Debugg today!**

```bash
bun add debugg
```

**Star this repository if you love debugging again! ⭐**

[![Debugg Logo](https://via.placeholder.com/200x200?text=Debugg+🐞)](https://github.com/your-org/debugg)
