# Security Policy

## 🔒 Supported Versions

We release patches for security vulnerabilities. Which versions are currently supported:

| Version | Supported          |
| ------- | ------------------ |
| 1.x.x   | :white_check_mark: |
| < 1.0   | :x:                |

## 🛡️ Security Best Practices

When using Debugg in production, follow these security best practices:

### 1. Sensitive Data Redaction

Debugg automatically redacts common sensitive fields, but you should configure additional fields:

```typescript
import { debugg } from 'debugg';

debugg.updateEnhancedConfig({
  security: {
    redactFields: ['password', 'token', 'secret', 'apiKey', 'creditCard', 'ssn'],
    maxContextSize: 1024 * 1024, // 1MB
    enableRateLimiting: true,
    maxErrorsPerMinute: 100,
  },
});
```

### 2. Secure Webhook Configuration

When using the webhook reporter:

```typescript
import { createWebhookReporter } from 'debugg';

debugg.addReporter(
  createWebhookReporter('https://your-domain.com/errors', {
    headers: {
      'Authorization': 'Bearer YOUR_SECRET_TOKEN',
      'X-API-Key': 'YOUR_API_KEY',
    },
    retries: 3,
    timeout: 5000,
  })
);
```

### 3. Environment-Specific Configuration

```typescript
const config = {
  serviceName: 'my-app',
  environment: process.env.NODE_ENV,
  logToConsole: process.env.NODE_ENV === 'development',
  includeStackTrace: process.env.NODE_ENV !== 'production',
  maxContextDepth: process.env.NODE_ENV === 'production' ? 3 : 10,
};
```

### 4. Rate Limiting

Enable rate limiting to prevent error flooding:

```typescript
debugg.updateEnhancedConfig({
  security: {
    enableRateLimiting: true,
    maxErrorsPerMinute: 100,
  },
});
```

## 🚨 Reporting a Vulnerability

We take the security of Debugg seriously. If you believe you have found a security vulnerability, please report it to us as described below.

### How to Report

**Please do NOT report security vulnerabilities through public GitHub issues.**

Instead, please report them via email at [bharath@debugg.example.com](mailto:bharath@debugg.example.com) with the following information:

1. **Type of issue** (e.g., buffer overflow, SQL injection, cross-site scripting, etc.)
2. **Full paths of source file(s)** related to the issue
3. **Location of the affected source code** (tag/branch/commit or direct URL)
4. **Step-by-step instructions** to reproduce the issue
5. **Proof-of-concept or exploit code** (if possible)
6. **Impact of the issue**, including how an attacker might exploit it

### What to Expect

- **Initial Response**: You will receive an acknowledgment within 48 hours
- **Status Update**: We will send you a more detailed response within 5 business days
- **Resolution Timeline**: We aim to resolve critical issues within 30 days

### Process

1. Confirm the problem and determine the affected versions
2. Audit code to find any potential similar problems
3. Prepare fixes for all supported versions
4. Release new versions and publish security advisories

## 📢 Security Advisories

Security advisories will be published on our GitHub repository and website. To receive notifications about security updates:

1. Watch the repository on GitHub
2. Subscribe to our security mailing list
3. Monitor npm audit reports

## 🔐 Secure Development

When contributing to Debugg, follow these security guidelines:

### Input Validation

Always validate and sanitize user input:

```typescript
// Good - validate configuration
if (!webhookUrl || typeof webhookUrl !== 'string') {
  throw new Error('Webhook URL is required and must be a string');
}

try {
  const url = new URL(webhookUrl);
  if (!['http:', 'https:'].includes(url.protocol)) {
    throw new Error('Webhook URL must use http or https protocol');
  }
} catch {
  throw new Error('Invalid webhook URL format');
}
```

### Error Messages

Never expose sensitive information in error messages:

```typescript
// Bad - exposes internal details
throw new Error(`Database connection failed: ${dbCredentials.host}:${dbCredentials.port}`);

// Good - generic error message
throw new Error('Database connection failed. Please check your configuration.');
```

### Dependencies

Keep dependencies up to date and monitor for security vulnerabilities:

```bash
# Check for outdated packages
bun outdated

# Check for vulnerabilities
bun audit

# Update packages
bun update
```

## 🛠️ Security Tools

We use the following security tools:

- **ESLint**: Static code analysis
- **npm audit / bun audit**: Dependency vulnerability scanning
- **GitHub Security Alerts**: Automated vulnerability detection

## 📚 Additional Resources

- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [Node.js Security Best Practices](https://nodejs.org/en/docs/guides/security/)
- [GitHub Security Features](https://docs.github.com/en/code-security)

## 🙏 Acknowledgments

We would like to thank the following for their contributions to our security:

- All security researchers who responsibly disclose vulnerabilities
- Our community members who help improve our security
- The open-source security community

---

**Thank you for helping keep Debugg and our users safe!**
