# Debugg Development Quick Reference

## 🚀 Quick Commands

```bash
# Development
bun run dev              # Start development watcher
bun run build            # Build for production
bun run clean            # Remove dist folder

# Testing
bun test                 # Run all tests
bun run test:coverage    # Run tests with coverage
bun run test:watch       # Run tests in watch mode

# Code Quality
bun run lint             # Check code with ESLint
bun run lint:fix         # Fix ESLint errors
bun run format           # Format code with Prettier
bun run format:check     # Check formatting
bun run typecheck        # Type-check without emitting

# Git Hooks
bun run prepare          # Install Husky hooks
bun run commitlint       # Lint commit messages
```

## 📁 Project Structure

```
src/
├── types/           # Type definitions
├── core/            # Core error handling (ErrorHandler, ErrorBuilder, ErrorClassifier)
├── reporters/       # Error reporters (Console, Sentry, Webhook)
├── storage/         # Storage implementations (Memory, LocalStorage)
├── middleware/      # Framework middleware (Express)
├── utils/           # Utilities (classify, format, platform)
├── constants/       # Constants and defaults
├── enhanced/        # Enhanced ErrorHandler with advanced features
├── performance/     # Performance monitoring
├── analytics/       # Error analytics and metrics
└── ci/              # CI/CD integration
```

## 🎯 Common Tasks

### Adding a New Reporter

1. Create `src/reporters/MyReporter.ts`:
```typescript
import { UniversalError, ErrorReporter } from '../types';

export const createMyReporter = (options: MyOptions = {}): ErrorReporter => {
  return async (error: UniversalError) => {
    // Your implementation
  };
};
```

2. Export from `src/reporters/index.ts`:
```typescript
export * from './MyReporter';
```

3. Add to main index:
```typescript
export { createMyReporter } from './reporters';
```

### Adding a New Storage Type

1. Create `src/storage/MyStorage.ts`:
```typescript
import { BaseStorage } from './BaseStorage';
import { UniversalError } from '../types';

export class MyStorage extends BaseStorage {
  storeError(error: UniversalError): void {
    // Your implementation
  }
  
  // Implement other required methods
}
```

2. Export from `src/storage/index.ts`

### Adding Middleware for a Framework

1. Create `src/middleware/framework.ts`:
```typescript
import { ErrorHandler } from '../core/ErrorHandler';

export const createFrameworkMiddleware = (handler: ErrorHandler) => {
  return (error: Error, req: Request, res: Response, next: NextFunction) => {
    // Your implementation
  };
};
```

## 📝 Code Style Guidelines

### Imports Order (Enforced by ESLint)
```typescript
// 1. Built-in modules
import { join } from 'path';

// 2. External packages
import express from 'express';

// 3. Internal modules
import { ErrorHandler } from '../core/ErrorHandler';

// 4. Parent directory
import { types } from '../../types';

// 5. Sibling files
import { utils } from './utils';

// 6. Index files
import * as index from './index';
```

### Naming Conventions
- **Classes**: PascalCase (`ErrorHandler`, `BaseReporter`)
- **Functions**: camelCase (`createError`, `handleError`)
- **Constants**: UPPER_SNAKE_CASE (`MAX_ERRORS`, `DEFAULT_SEVERITY`)
- **Types**: PascalCase (`UniversalError`, `ErrorContext`)
- **Files**: PascalCase or camelCase for implementations, lowercase for index

### Error Handling
```typescript
// ✅ Good: Specific error types
if (!config.serviceName) {
  throw new Error('Service name is required');
}

// ❌ Bad: Silent failures
try {
  riskyOperation();
} catch (e) {
  // Don't do this
}
```

### Type Annotations
```typescript
// ✅ Good: Explicit return types for public APIs
public createError(error: unknown, context: ErrorContext = {}): UniversalError {
  return error;
}

// ✅ Good: Inferred types for simple variables
const count = 0;  // number inferred

// ❌ Bad: Using 'any'
function process(data: any) {  // Don't do this
```

## 🧪 Testing Guidelines

### Test File Structure
```typescript
import { describe, test, expect, beforeEach } from 'bun:test';
import { ErrorHandler } from '../src';

describe('ErrorHandler', () => {
  let handler: ErrorHandler;

  beforeEach(() => {
    handler = new ErrorHandler({ serviceName: 'test' });
  });

  describe('createError', () => {
    test('should create error with correct structure', () => {
      const error = handler.createError(new Error('test'));
      
      expect(error).toHaveProperty('errorId');
      expect(error.severity).toBe('medium');
    });
  });
});
```

### Running Specific Tests
```bash
# Run specific test file
bun test __tests__/error-handler.test.ts

# Run tests matching pattern
bun test --test-name-pattern="Error Creation"
```

## 🔧 Configuration Files

| File | Purpose |
|------|---------|
| `.eslintrc.json` | ESLint configuration |
| `.prettierrc` | Prettier configuration |
| `tsconfig.json` | TypeScript configuration |
| `tsup.config.ts` | Build configuration |
| `commitlint.config.js` | Commit message linting |
| `.husky/` | Git hooks |
| `.gitignore` | Git ignore patterns |

## 📚 Documentation

- `README.md` - Main documentation
- `CONTRIBUTING.md` - Contribution guidelines
- `CODE_OF_CONDUCT.md` - Community standards
- `SECURITY.md` - Security policy
- `PHASE1_COMPLETE.md` - Phase 1 implementation details
- `docs/` - Additional documentation

## 🐛 Debugging Tips

### Enable Debug Logging
```typescript
const handler = new ErrorHandler({
  logToConsole: true,
  includeStackTrace: true,
});
```

### Inspect Error Structure
```typescript
const error = handler.createError(new Error('test'), { key: 'value' });
console.log(JSON.stringify(error, null, 2));
```

### Test Reporters
```typescript
const reporter = createConsoleReporter();
await reporter(error);
```

## 📊 Build Output

After running `bun run build`:
```
dist/
├── index.js          # CommonJS bundle
├── index.mjs         # ESM bundle
├── index.d.ts        # Type declarations
├── index.js.map      # Source maps
└── index.mjs.map     # Source maps
```

## 🎯 Quality Checks

Before committing:
```bash
# Full quality check
bun run typecheck && bun run lint && bun run format:check && bun test

# Or use the all-in-one (if configured)
bun run check
```

## 🚦 Git Workflow

```bash
# Create feature branch
git checkout -b feature/your-feature

# Make changes and commit (hooks will validate)
git add .
git commit -m "feat: add new feature"

# Push and create PR
git push origin feature/your-feature
```

## 📞 Need Help?

- Check existing issues on GitHub
- Review CONTRIBUTING.md
- Read the code comments (JSDoc)
- Ask in team chat

---

**Happy Coding! 🚀**
