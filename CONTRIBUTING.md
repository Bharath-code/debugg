# Contributing to Debugg

Thank you for your interest in contributing to Debugg! This document provides guidelines and instructions for contributing.

## 🌟 Code of Conduct

Please read and follow our [Code of Conduct](CODE_OF_CONDUCT.md) to keep our community approachable and respectable.

## 📋 Table of Contents

- [Getting Started](#getting-started)
- [Development Setup](#development-setup)
- [Making Changes](#making-changes)
- [Commit Guidelines](#commit-guidelines)
- [Pull Request Process](#pull-request-process)
- [Testing](#testing)
- [Documentation](#documentation)

## 🚀 Getting Started

1. Fork the repository
2. Clone your fork: `git clone https://github.com/your-username/debugg.git`
3. Install dependencies: `bun install`
4. Create a branch: `git checkout -b feature/your-feature-name`

## 🛠️ Development Setup

### Prerequisites

- [Bun](https://bun.sh/) >= 1.3.0
- Node.js >= 18.0.0 (optional, for compatibility testing)

### Installation

```bash
# Install dependencies
bun install

# Set up git hooks (recommended)
bun run prepare
```

### Build

```bash
# Build the library
bun run build

# Build in watch mode
bun run dev
```

### Testing

```bash
# Run all tests
bun test

# Run tests with coverage
bun run test:coverage

# Run tests in watch mode
bun run test:watch
```

### Linting & Formatting

```bash
# Lint code
bun run lint

# Fix linting issues
bun run lint:fix

# Format code
bun run format

# Check formatting
bun run format:check
```

## ✏️ Making Changes

1. **Follow the code style**: We use ESLint and Prettier to enforce consistent code style
2. **Write tests**: Add tests for new features or bug fixes
3. **Update documentation**: Update README.md and add JSDoc comments
4. **Check types**: Ensure TypeScript compilation succeeds

## 📝 Commit Guidelines

We follow [Conventional Commits](https://www.conventionalcommits.org/) specification:

### Commit Message Format

```
<type>(<scope>): <subject>

<body>

<footer>
```

### Types

- `feat`: A new feature
- `fix`: A bug fix
- `docs`: Documentation changes
- `style`: Code style changes (formatting, etc.)
- `refactor`: Code refactoring
- `perf`: Performance improvements
- `test`: Adding or updating tests
- `build`: Build system changes
- `ci`: CI/CD configuration
- `chore`: Maintenance tasks
- `revert`: Reverting changes

### Examples

```bash
feat(core): add error batching support

This commit adds support for batching multiple errors
into a single report for better performance.

Closes #123
```

```bash
fix(reporters): handle circular references in webhook reporter

The webhook reporter now properly serializes errors
with circular references.
```

```bash
docs(readme): update installation instructions
```

### Using Commitlint

We use Commitlint to enforce commit message standards:

```bash
# Your commit will be validated automatically
git commit -m "feat(core): add new feature"

# Or manually check
bun run commitlint --from HEAD~1
```

## 🔄 Pull Request Process

1. **Update your branch**: Rebase or merge from main
2. **Run tests**: Ensure all tests pass
3. **Check linting**: Run `bun run lint` and `bun run format`
4. **Update documentation**: Update README and add JSDoc comments
5. **Request review**: Tag relevant maintainers
6. **Address feedback**: Make requested changes
7. **Squash commits**: If needed, squash related commits

### PR Title Format

PR titles should follow Conventional Commits:

```
feat: add error batching support
fix: resolve circular reference issue in webhook reporter
```

### PR Description Template

```markdown
## Description
Brief description of changes

## Type of Change
- [ ] Bug fix
- [ ] New feature
- [ ] Breaking change
- [ ] Documentation update

## Testing
- [ ] Tests added
- [ ] Tests updated
- [ ] Manually tested

## Checklist
- [ ] Code follows style guidelines
- [ ] Self-review completed
- [ ] Documentation updated
- [ ] No new warnings
```

## 🧪 Testing

### Writing Tests

- Use Bun's test runner
- Follow existing test patterns
- Test edge cases
- Mock external dependencies

### Example Test

```typescript
import { describe, test, expect } from 'bun:test';
import { ErrorHandler } from '../src';

describe('ErrorHandler', () => {
  test('should create error with correct structure', () => {
    const handler = new ErrorHandler({ serviceName: 'test' });
    const error = handler.createError(new Error('test'));

    expect(error).toHaveProperty('errorId');
    expect(error.severity).toBe('medium');
  });
});
```

## 📚 Documentation

### Code Comments

- Use JSDoc for public APIs
- Explain "why" not "what"
- Include examples for complex logic

### README Updates

Update README.md when:
- Adding new features
- Changing APIs
- Adding configuration options
- Adding examples

## 🐛 Reporting Bugs

### Bug Report Template

```markdown
**Description**
Clear description of the bug

**Reproduction**
Steps to reproduce:
1. Step 1
2. Step 2

**Expected Behavior**
What should happen

**Actual Behavior**
What actually happens

**Environment**
- Debugg version: x.x.x
- Node/Bun version: x.x.x
- OS: xxx

**Additional Context**
Any other relevant information
```

## 💡 Feature Requests

### Feature Request Template

```markdown
**Problem Statement**
What problem does this solve?

**Proposed Solution**
How should it work?

**Alternatives Considered**
Other solutions you've thought about

**Use Cases**
Who will benefit from this?

**Additional Context**
Any other relevant information
```

## 📦 Release Process

Releases are automated using semantic-release:

1. Commits are analyzed for version bumps
2. Changelog is generated
3. Package is published to npm
4. GitHub release is created

## 🤝 Questions?

- Open an issue for questions
- Check existing issues and discussions
- Join our community discussions

## 🙏 Thank You!

Your contributions make Debugg better for everyone. We appreciate your time and effort!

---

**Happy Coding! 🚀**
