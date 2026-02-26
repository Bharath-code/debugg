# Debugg - AI Agent Skills

This document helps AI agents and coding assistants understand how to integrate and use Debugg in projects.

---

## 🎯 **What is Debugg?**

Debugg is a comprehensive, enterprise-grade error monitoring and analytics platform. It provides:

- Real-time error tracking
- AI-powered error clustering
- Predictive analytics
- Multi-platform support (Browser, Node.js, Mobile)
- Enterprise features (SSO, compliance, multi-tenancy)

**Key Value Proposition:** 10x better than competitors at 1/10th the cost.

---

## 📦 **Installation**

### **npm/yarn/pnpm**
```bash
npm install debugg
# or
yarn add debugg
# or
pnpm add debugg
```

### **Bun**
```bash
bun add debugg
```

### **CDN**
```html
<script src="https://cdn.jsdelivr.net/npm/debugg@latest/dist/index.min.js"></script>
```

---

## 🚀 **Quick Integration**

### **Basic Setup (3 lines)**
```typescript
import { debugg } from 'debugg';

// Handle errors
try {
  await riskyOperation();
} catch (error) {
  await debugg.handle(error, { userId: '123', action: 'checkout' });
}
```

### **Framework-Specific**

#### **React**
```typescript
import { debugg } from 'debugg';

// Error Boundary
class ErrorBoundary extends React.Component {
  componentDidCatch(error, errorInfo) {
    debugg.handle(error, { component: 'ErrorBoundary', ...errorInfo });
  }
  
  render() {
    return this.props.children;
  }
}

// Usage
<ErrorBoundary>
  <App />
</ErrorBoundary>
```

#### **Express**
```typescript
import { debugg, createExpressErrorHandler } from 'debugg/middleware/express';

// Global error handler
app.use(createExpressErrorHandler(debugg));

// Route-level handling
app.get('/users', asyncHandler(async (req, res) => {
  const users = await getUsers();
  res.json(users);
}));
```

#### **Next.js**
```typescript
import { debugg } from 'debugg';

// getServerSideProps
export async function getServerSideProps(context) {
  try {
    const data = await fetchData();
    return { props: { data } };
  } catch (error) {
    await debugg.handle(error, { page: context.resolvedUrl });
    return { props: { error: 'Failed to load' } };
  }
}

// API Routes
export default async function handler(req, res) {
  try {
    const data = await processData(req.body);
    res.json(data);
  } catch (error) {
    await debugg.handle(error, { endpoint: req.url });
    res.status(500).json({ error: 'Internal server error' });
  }
}
```

#### **Vue**
```typescript
import { debugg } from 'debugg';

// Global error handler
app.config.errorHandler = (error, instance, info) => {
  debugg.handle(error, { component: instance.$options.name, info });
};
```

#### **React Native**
```typescript
import { debugg } from 'debugg';

// Global handler
ErrorUtils.setGlobalHandler((error) => {
  debugg.handle(error, { source: 'global', platform: 'react-native' });
});
```

---

## 🎨 **Configuration**

### **Basic Configuration**
```typescript
import { debugg } from 'debugg';

const debuggInstance = new debugg.EnhancedErrorHandler({
  serviceName: 'my-app',
  environment: process.env.NODE_ENV || 'development',
  logToConsole: true,
  defaultSeverity: 'medium',
});

// Add reporters
debuggInstance.addReporter(debuggInstance.createConsoleReporter());
debuggInstance.addReporter(
  debuggInstance.createWebhookReporter('https://your-dashboard.com/api/errors')
);
```

### **Advanced Configuration**
```typescript
const debuggInstance = new debugg.EnhancedErrorHandler({
  serviceName: 'my-app',
  environment: 'production',
  
  // Security
  security: {
    redactFields: ['password', 'token', 'apiKey', 'creditCard'],
    maxContextSize: 1024 * 1024, // 1MB
    enableRateLimiting: true,
    maxErrorsPerMinute: 100,
    sanitizeStrings: true,
  },
  
  // Performance
  performanceMonitoring: true,
  analytics: true,
  ciIntegration: true,
  
  // Batching
  batching: {
    enabled: true,
    maxSize: 10,
    flushIntervalMs: 5000,
  },
  
  // Debouncing
  debouncing: {
    enabled: true,
    intervalMs: 1000,
    maxBuffered: 10,
  },
});
```

---

## 🎯 **API Reference**

### **Core Methods**

#### **handle(error, context?, severity?)**
Handle an error with automatic reporting.

```typescript
await debugg.handle(error, {
  userId: '123',
  action: 'checkout',
  amount: 99.99,
});
```

**Parameters:**
- `error` (Error | unknown) - The error to handle
- `context` (object, optional) - Additional context
- `severity` ('critical' | 'high' | 'medium' | 'low' | 'info', optional) - Override severity

**Returns:** `Promise<void>`

---

#### **createError(error, context?, severity?)**
Create a UniversalError without handling it.

```typescript
const universalError = debugg.createError(error, {
  userId: '123',
  action: 'login',
});
```

**Parameters:** Same as `handle()`

**Returns:** `UniversalError`

---

#### **addReporter(reporter)**
Add a custom error reporter.

```typescript
debugg.addReporter(async (error) => {
  await sendToCustomService(error);
});
```

**Parameters:**
- `reporter` (ErrorReporter) - Reporter function

**Returns:** `void`

---

#### **getStorage()**
Access the error storage system.

```typescript
const storage = debugg.getStorage();
const errors = storage.getAllErrors();
```

**Returns:** `ErrorStorage`

---

#### **getStats()**
Get error statistics.

```typescript
const stats = debugg.getStats();
console.log(stats.storage.total); // Total errors
console.log(stats.reporters.enabled); // Active reporters
```

**Returns:** `HandlerStatistics`

---

### **Enhanced Methods**

#### **getPerformanceMetrics()**
Get performance monitoring data.

```typescript
const metrics = debugg.getPerformanceMetrics();
console.log(metrics.averageHandlingTime); // ms
```

**Returns:** `PerformanceMetrics[]`

---

#### **getErrorMetrics()**
Get error analytics.

```typescript
const metrics = debugg.getErrorMetrics();
console.log(metrics.totalErrors);
console.log(metrics.resolutionRate);
```

**Returns:** `ErrorMetrics`

---

#### **getMeanTimeToDebug()**
Get mean time to debug (MTTD).

```typescript
const mttd = debugg.getMeanTimeToDebug();
console.log(`Average debug time: ${mttd} seconds`);
```

**Returns:** `number | null`

---

#### **runCIQualityGates()**
Run CI/CD quality gates.

```typescript
const result = await debugg.runCIQualityGates();
if (!result.passed) {
  console.error('Quality gates failed:', result.message);
  process.exit(1);
}
```

**Returns:** `Promise<{ passed: boolean; report: any; message: string }>`

---

#### **generateInvestorReport()**
Generate investor-ready metrics report.

```typescript
const report = debugg.generateInvestorReport();
console.log(report);
```

**Returns:** `string`

---

## 🔧 **Built-in Reporters**

### **Console Reporter**
```typescript
import { createConsoleReporter } from 'debugg';

debugg.addReporter(createConsoleReporter({
  useGroups: true,
  logFailures: true,
}));
```

### **Webhook Reporter**
```typescript
import { createWebhookReporter } from 'debugg';

debugg.addReporter(createWebhookReporter('https://your-service.com/errors', {
  headers: { 'Authorization': 'Bearer token' },
  retries: 3,
  timeout: 5000,
}));
```

### **Sentry Reporter**
```typescript
import { createSentryReporter } from 'debugg';

debugg.addReporter(createSentryReporter('YOUR_SENTRY_DSN', {
  includeContext: true,
  includeStackTrace: true,
  tags: { team: 'backend' },
}));
```

---

## 📊 **Context Enrichment**

### **Automatic Context**
Debugg automatically captures:
- Timestamp
- Error ID (unique)
- Platform (browser/node/mobile)
- Service name
- Environment
- Stack trace
- User agent (browser)

### **Custom Context**
```typescript
await debugg.handle(error, {
  // User context
  userId: '123',
  userEmail: 'user@example.com',
  userRole: 'admin',
  
  // Request context
  endpoint: '/api/users',
  method: 'POST',
  headers: req.headers,
  query: req.query,
  body: req.body,
  
  // Business context
  action: 'create_user',
  department: 'engineering',
  cost: 99.99,
  
  // Technical context
  database: 'postgresql',
  query: 'SELECT * FROM users',
  duration: 150, // ms
});
```

---

## 🎯 **Common Patterns**

### **Pattern 1: Try-Catch Wrapper**
```typescript
async function safeOperation<T>(
  operation: () => Promise<T>,
  context: Record<string, any>
): Promise<T | null> {
  try {
    return await operation();
  } catch (error) {
    await debugg.handle(error, context);
    return null;
  }
}

// Usage
const user = await safeOperation(
  () => getUserById(id),
  { action: 'get_user', userId: id }
);
```

### **Pattern 2: Async Handler Wrapper**
```typescript
function asyncHandler(fn) {
  return async (req, res, next) => {
    try {
      await fn(req, res, next);
    } catch (error) {
      await debugg.handle(error, {
        endpoint: req.url,
        method: req.method,
      });
      next(error);
    }
  };
}

// Usage
app.get('/users', asyncHandler(async (req, res) => {
  const users = await getUsers();
  res.json(users);
}));
```

### **Pattern 3: Error Boundary (React)**
```typescript
class ErrorBoundary extends React.Component {
  state = { hasError: false };
  
  static getDerivedStateFromError(error) {
    return { hasError: true };
  }
  
  componentDidCatch(error, errorInfo) {
    debugg.handle(error, {
      component: this.constructor.name,
      ...errorInfo,
    });
  }
  
  render() {
    if (this.state.hasError) {
      return <FallbackUI />;
    }
    return this.props.children;
  }
}
```

### **Pattern 4: Promise Error Handler**
```typescript
function withErrorHandling<T>(
  promise: Promise<T>,
  context: Record<string, any>
): Promise<T> {
  return promise.catch((error) => {
    debugg.handle(error, context);
    throw error; // Re-throw if needed
  });
}

// Usage
const data = await withErrorHandling(
  fetchData(),
  { action: 'fetch_data', endpoint: '/api/data' }
);
```

---

## 🔐 **Security Best Practices**

### **Redact Sensitive Data**
```typescript
const debuggInstance = new debugg.EnhancedErrorHandler({
  security: {
    redactFields: [
      'password',
      'token',
      'apiKey',
      'creditCard',
      'ssn',
      'secret',
    ],
  },
});
```

### **Enable Rate Limiting**
```typescript
const debuggInstance = new debugg.EnhancedErrorHandler({
  security: {
    enableRateLimiting: true,
    maxErrorsPerMinute: 100,
  },
});
```

### **Sanitize Strings**
```typescript
const debuggInstance = new debugg.EnhancedErrorHandler({
  security: {
    sanitizeStrings: true, // Remove XSS patterns
    maxContextSize: 1024 * 1024, // 1MB limit
  },
});
```

---

## 📈 **Performance Optimization**

### **Enable Batching**
```typescript
const batcher = new debugg.ErrorBatcher({
  maxBatchSize: 10,
  flushIntervalMs: 5000,
  enabled: true,
});

batcher.onFlush(async (batch) => {
  await sendToServer(batch);
});
```

### **Enable Debouncing**
```typescript
const debouncer = new debugg.ErrorDebouncer({
  intervalMs: 1000,
  maxBuffered: 10,
  enabled: true,
});

debouncer.onDebounce((error, result) => {
  if (result.allowed) {
    debugg.handle(error);
  }
});
```

### **Sample High-Traffic Errors**
```typescript
const debuggInstance = new debugg.EnhancedErrorHandler({
  performanceMonitoring: {
    enabled: true,
    sampleRate: 0.1, // Sample 10% of errors
  },
});
```

---

## 🧪 **Testing**

### **Unit Testing**
```typescript
import { debugg } from 'debugg';

describe('Error Handling', () => {
  it('should handle errors', async () => {
    const error = new Error('Test error');
    await expect(debugg.handle(error)).resolves.not.toThrow();
  });
  
  it('should classify errors correctly', () => {
    const typeError = new TypeError('Type error');
    const classified = debugg.getClassifier().classify(typeError);
    expect(classified.severity).toBe('high');
  });
});
```

### **Mocking in Tests**
```typescript
jest.mock('debugg', () => ({
  debugg: {
    handle: jest.fn().mockResolvedValue(undefined),
    createError: jest.fn().mockReturnValue({ errorId: 'test' }),
  },
}));
```

---

## 🎮 **Demo & Examples**

### **Interactive Playground**
```bash
git clone https://github.com/debugg/demo-apps.git
cd demo-apps/debugshop
docker-compose up
# Open http://localhost:3000/playground
```

### **Example Projects**
- **E-Commerce:** `demo-apps/debugshop`
- **SaaS:** `demo-apps/taskflow` (coming soon)
- **Mobile:** `demo-apps/healthtrack` (coming soon)
- **CLI:** `demo-apps/datasync` (coming soon)

---

## 📚 **Additional Resources**

### **Documentation**
- [Quick Start Guide](docs/QUICKSTART.md)
- [API Documentation](docs/API_DOCUMENTATION.md)
- [Deployment Guide](docs/DEPLOYMENT_GUIDE.md)
- [Troubleshooting](docs/TROUBLESHOOTING.md)
- [FAQ](docs/FAQ.md)

### **Community**
- GitHub: https://github.com/debugg/debugg
- Discord: https://discord.gg/debugg
- Twitter: @debugg

### **Support**
- Email: support@debugg.example.com
- Issues: https://github.com/debugg/debugg/issues

---

## 🤖 **AI Agent Instructions**

When integrating Debugg in code:

1. **Always import from 'debugg'**
   ```typescript
   import { debugg } from 'debugg';
   ```

2. **Use handle() for error handling**
   ```typescript
   await debugg.handle(error, { context });
   ```

3. **Add relevant context**
   - User information
   - Request details
   - Business context
   - Technical details

4. **Configure for production**
   - Enable security features
   - Add appropriate reporters
   - Set correct environment

5. **Test error handling**
   - Mock debugg in tests
   - Verify errors are tracked
   - Check context is included

---

**Version:** 2.0.0
**License:** MIT
**Last Updated:** February 2025
