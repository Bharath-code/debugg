# React Integration Guide

Complete guide for integrating Debugg into React applications.

## Installation

```bash
# Using npm
npm install debugg

# Using yarn
yarn add debugg

# Using Bun
bun add debugg
```

## Basic Setup

### 1. Create Error Handler Instance

Create a dedicated file for your Debugg configuration:

```typescript
// src/utils/errorHandler.ts
import { EnhancedErrorHandler } from 'debugg';

export const debugg = new EnhancedErrorHandler({
  serviceName: 'my-react-app',
  environment: process.env.NODE_ENV || 'development',
  defaultSeverity: 'medium',
  logToConsole: process.env.NODE_ENV === 'development',
  performanceMonitoring: true,
  analytics: true,
  ciIntegration: process.env.NODE_ENV !== 'production',
});

// Add reporters
import { createConsoleReporter, createSentryReporter } from 'debugg';

if (process.env.NODE_ENV === 'development') {
  debugg.addReporter(createConsoleReporter());
}

if (process.env.REACT_APP_SENTRY_DSN) {
  debugg.addReporter(
    createSentryReporter(process.env.REACT_APP_SENTRY_DSN)
  );
}

export default debugg;
```

### 2. Create Error Boundary Component

```typescript
// src/components/ErrorBoundary.tsx
import React, { Component, ErrorInfo, ReactNode } from 'react';
import { debugg } from '../utils/errorHandler';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: undefined,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    debugg.handle(error, {
      component: 'ErrorBoundary',
      ...errorInfo,
    });
  }

  public render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="error-fallback">
          <h1>Something went wrong</h1>
          <p>Our team has been notified.</p>
          <button onClick={() => window.location.reload()}>
            Reload Page
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
```

### 3. Wrap Your Application

```typescript
// src/index.tsx
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { ErrorBoundary } from './components/ErrorBoundary';

const root = ReactDOM.createRoot(
  document.getElementById('root') as HTMLElement
);

root.render(
  <React.StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </React.StrictMode>
);
```

## Usage in Components

### Class Components

```typescript
import React, { Component } from 'react';
import { debugg } from '../utils/errorHandler';

export class UserProfile extends Component {
  async componentDidMount() {
    try {
      const user = await fetchUser(this.props.userId);
      this.setState({ user });
    } catch (error) {
      debugg.handle(error, {
        component: 'UserProfile',
        action: 'fetch_user',
        userId: this.props.userId,
      });
    }
  }

  render() {
    return <div>{/* ... */}</div>;
  }
}
```

### Functional Components with Hooks

```typescript
import React, { useEffect, useState } from 'react';
import { debugg } from '../utils/errorHandler';

export function UserProfile({ userId }: { userId: string }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchUser() {
      try {
        const response = await fetch(`/api/users/${userId}`);
        const data = await response.json();
        setUser(data);
      } catch (error) {
        debugg.handle(error, {
          component: 'UserProfile',
          action: 'fetch_user',
          userId,
        });
      } finally {
        setLoading(false);
      }
    }

    fetchUser();
  }, [userId]);

  if (loading) return <div>Loading...</div>;
  return <div>{user?.name}</div>;
}
```

### Custom Hook for Error Handling

```typescript
// src/hooks/useErrorHandler.ts
import { useCallback } from 'react';
import { debugg, ErrorContext } from 'debugg';

export function useErrorHandler(componentName: string) {
  const handleError = useCallback(
    async (error: unknown, context?: ErrorContext) => {
      await debugg.handle(error, {
        component: componentName,
        ...context,
      });
    },
    [componentName]
  );

  return handleError;
}

// Usage
export function MyComponent() {
  const handleError = useErrorHandler('MyComponent');

  const fetchData = async () => {
    try {
      const data = await api.fetch();
    } catch (error) {
      await handleError(error, { action: 'fetch_data' });
    }
  };

  return <div>{/* ... */}</div>;
}
```

## Advanced Features

### Performance Monitoring

```typescript
import { debugg } from '../utils/errorHandler';

// Track component render time
export function SlowComponent() {
  useEffect(() => {
    const start = performance.now();
    return () => {
      const duration = performance.now() - start;
      if (duration > 1000) {
        debugg.createError(null, {
          component: 'SlowComponent',
          metric: 'render_time',
          duration,
        }, 'high');
      }
    };
  }, []);

  return <div>{/* ... */}</div>;
}
```

### User Action Tracking

```typescript
export function ActionButton() {
  const handleError = useErrorHandler('ActionButton');

  const handleClick = async () => {
    try {
      await performAction();
      
      // Track success
      debugg.createError(null, {
        component: 'ActionButton',
        action: 'click',
        status: 'success',
      }, 'info');
    } catch (error) {
      await handleError(error, {
        action: 'click',
        status: 'failed',
      });
    }
  };

  return <button onClick={handleClick}>Click Me</button>;
}
```

### Global Error Handlers

```typescript
// src/utils/setupGlobalHandlers.ts
import { debugg } from './errorHandler';

export function setupGlobalHandlers() {
  // Unhandled promise rejections
  window.addEventListener('unhandledrejection', (event) => {
    debugg.handle(event.reason, {
      source: 'unhandledrejection',
      promise: event.promise,
    });
  });

  // Global errors
  window.addEventListener('error', (event) => {
    debugg.handle(event.error, {
      source: 'error',
      filename: event.filename,
      lineno: event.lineno,
      colno: event.colno,
    });
  });
}

// Call in index.tsx
setupGlobalHandlers();
```

## Best Practices

1. **Wrap your app with ErrorBoundary** - Catch all React errors
2. **Use meaningful context** - Include component name, action, relevant data
3. **Don't over-report** - Use appropriate severity levels
4. **Redact sensitive data** - Configure field redaction
5. **Monitor performance** - Track slow renders and API calls
6. **Test error scenarios** - Ensure errors are properly caught

## Example Project Structure

```
src/
├── components/
│   └── ErrorBoundary.tsx
├── hooks/
│   └── useErrorHandler.ts
├── utils/
│   └── errorHandler.ts
├── App.tsx
└── index.tsx
```

## Troubleshooting

### Issue: Errors not being reported

**Solution:** Check that:
1. Error handler is initialized before errors occur
2. Reporters are added correctly
3. Console logging is enabled in development

### Issue: Too many errors reported

**Solution:** 
1. Use appropriate severity levels
2. Implement error debouncing
3. Filter out expected errors

## Next Steps

- [API Documentation](../api/)
- [Performance Monitoring](./performance.md)
- [Security Best Practices](./security.md)
