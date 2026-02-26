# 🚀 CLI & API Release Package

Complete guide to releasing the Debugg CLI and Public API.

---

## 📦 **What's Being Released**

### **1. Debugg CLI** (`debugg-cli`)
- ✅ Login/logout commands
- ✅ Error management (list, get, resolve)
- ✅ Analytics commands
- ✅ Configuration management
- ✅ JSON output support

### **2. Public API** (`debugg-api`)
- ✅ Error endpoints (CRUD)
- ✅ User management endpoints
- ✅ Audit log endpoints
- ✅ Analytics endpoints
- ✅ Authentication endpoints
- ✅ Webhook endpoints
- ✅ API key management

### **3. Supporting Infrastructure**
- ✅ OpenAPI documentation
- ✅ SDK templates (JS, Python, Go, Ruby)
- ✅ CLI documentation
- ✅ API testing suite

---

## 🎯 **Pre-Release Verification**

### **CLI Testing**
```bash
# Test all commands
debugg --help
debugg login --help
debugg errors:list --help
debugg errors:get --help
debugg errors:resolve --help
debugg analytics --help
debugg config --help
debugg logout --help

# Test actual functionality
debugg login -u http://localhost:3001
debugg errors:list --limit 5
debugg errors:get <error-id>
debugg analytics
```

### **API Testing**
```bash
# Test health
curl http://localhost:3001/health

# Test errors API
curl -H "X-API-Key: test-key" \
  "http://localhost:3001/api/errors?limit=5"

# Test users API
curl -H "X-API-Key: test-key" \
  http://localhost:3001/api/users

# Test audit logs API
curl -H "X-API-Key: test-key" \
  http://localhost:3001/api/audit-logs

# Test analytics API
curl -H "X-API-Key: test-key" \
  http://localhost:3001/api/analytics/overview
```

### **UI ↔ API Connection Testing**
1. ✅ Open dashboard: `http://localhost:3001`
2. ✅ Login with credentials
3. ✅ View errors list
4. ✅ Click error to view detail
5. ✅ Resolve an error
6. ✅ Create test error
7. ✅ Search/filter errors
8. ✅ Check real-time updates

---

## 📝 **Package Configuration**

### **1. CLI Package (`package.json`)**
```json
{
  "name": "debugg-cli",
  "version": "2.0.0",
  "description": "Debugg Dashboard CLI",
  "bin": {
    "debugg": "./dist/cli.js"
  },
  "files": ["dist"],
  "scripts": {
    "build": "tsc",
    "test": "bun test",
    "prepublishOnly": "npm run build"
  },
  "dependencies": {
    "commander": "^11.0.0",
    "chalk": "^5.3.0",
    "ora": "^7.0.0"
  },
  "engines": {
    "node": ">=18.0.0"
  }
}
```

### **2. API Package (`package.json`)**
```json
{
  "name": "debugg-api",
  "version": "2.0.0",
  "description": "Debugg Dashboard Public API",
  "main": "dist/routes/api.js",
  "types": "dist/routes/api.d.ts",
  "files": ["dist"],
  "scripts": {
    "build": "tsc",
    "test": "bun test"
  }
}
```

---

## 🚀 **Release Steps**

### **Step 1: Build Packages**
```bash
cd dashboard

# Build CLI
tsc -p tsconfig.cli.json

# Build API
tsc -p tsconfig.api.json

# Verify builds
ls -la dist/
```

### **Step 2: Test Locally**
```bash
# Test CLI
node dist/cli.js --help

# Test API
node dist/server.js &
curl http://localhost:3001/health
```

### **Step 3: Publish CLI to npm**
```bash
# Login to npm
npm login

# Navigate to CLI directory
cd cli

# Publish
npm publish

# Verify
npm view debugg-cli
```

### **Step 4: Publish API to npm**
```bash
# Navigate to API directory
cd api

# Publish
npm publish

# Verify
npm view debugg-api
```

### **Step 5: Create GitHub Release**
```bash
# Tag release
git tag -a v2.0.0 -m "Release CLI & API v2.0.0"

# Push tag
git push origin v2.0.0

# Create release on GitHub
# Go to: https://github.com/your-org/debugg/releases/new
# Tag: v2.0.0
# Title: Debugg CLI & API v2.0.0
# Description: Copy from CHANGELOG.md
```

### **Step 6: Update Documentation**
```bash
# Update README with installation
echo "npm install -g debugg-cli" >> README.md

# Update API docs
# Add new endpoints to docs/API_DOCUMENTATION.md

# Create release announcement
# Post to Discord, Twitter, Reddit
```

---

## 📊 **API Endpoints Summary**

### **System**
- `GET /health` - Health check
- `GET /status` - System status

### **Errors**
- `GET /api/errors` - List errors
- `GET /api/errors/:id` - Get error
- `POST /api/errors` - Create error
- `PATCH /api/errors/:id/status` - Update status
- `DELETE /api/errors/:id` - Delete error

### **Users**
- `GET /api/users` - List users
- `POST /api/users` - Create user
- `PATCH /api/users/:id` - Update user
- `DELETE /api/users/:id` - Delete user

### **Audit Logs**
- `GET /api/audit-logs` - List audit logs
- `GET /api/audit-logs/export` - Export CSV

### **Analytics**
- `GET /api/analytics/overview` - Overview stats
- `GET /api/analytics/trends` - Error trends
- `GET /api/analytics/clusters` - Error clusters

### **Authentication**
- `POST /api/auth/login` - Login
- `POST /api/auth/logout` - Logout
- `GET /api/auth/me` - Current user

### **API Keys**
- `POST /api/api-keys` - Create API key

### **Webhooks**
- `POST /api/webhooks` - Create webhook

---

## 📚 **CLI Commands Summary**

```bash
# Authentication
debugg login -u <url> -k <api-key>
debugg logout
debugg config

# Errors
debugg errors:list [-l limit] [-s severity] [--json]
debugg errors:get <id> [--json]
debugg errors:resolve <id>

# Analytics
debugg analytics [--json]

# Help
debugg --help
debugg <command> --help
```

---

## 🎨 **UX Improvements for Delight**

### **1. CLI UX**
```javascript
// Add colorful output
import chalk from 'chalk';
console.log(chalk.green('✅ Login successful!'));

// Add spinners
import ora from 'ora';
const spinner = ora('Loading errors...').start();
spinner.succeed('Errors loaded!');

// Add tables
import Table from 'cli-table3';
const table = new Table();
table.push(['ID', 'Severity', 'Message']);
console.log(table.toString());
```

### **2. API UX**
```typescript
// Add helpful error messages
if (!email) {
  return res.status(400).json({
    success: false,
    error: 'Email is required',
    hint: 'Please provide a valid email address',
    example: 'user@example.com'
  });
}

// Add pagination metadata
res.json({
  success: true,
  data: users,
  pagination: {
    page: 1,
    limit: 20,
    total: 100,
    totalPages: 5,
    hasMore: true,
    nextUrl: '/api/users?page=2&limit=20'
  }
});
```

### **3. UI UX**
```javascript
// Add optimistic updates
async function resolveError(errorId) {
  // Update UI immediately
  const error = errors.find(e => e.id === errorId);
  error.status = 'RESOLVED';
  
  // Then make API call
  await api.resolveError(errorId);
  
  // Show success toast
  showToast('Error resolved successfully!', 'success');
}

// Add keyboard shortcuts
document.addEventListener('keydown', (e) => {
  if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
    e.preventDefault();
    document.querySelector('.search-input').focus();
  }
  if (e.key === 'Escape') {
    selectedError.value = null;
  }
});
```

---

## ✅ **Release Checklist**

### **Code Quality**
- [x] ✅ All tests passing
- [x] ✅ TypeScript compilation successful
- [x] ✅ No console errors
- [x] ✅ No security vulnerabilities
- [x] ✅ Performance benchmarks met

### **Documentation**
- [x] ✅ API documentation complete
- [x] ✅ CLI documentation complete
- [x] ✅ Examples added
- [x] ✅ Changelog updated
- [x] ✅ README updated

### **Testing**
- [x] ✅ CLI commands tested
- [x] ✅ API endpoints tested
- [x] ✅ UI ↔ API connections verified
- [x] ✅ Error handling tested
- [x] ✅ Edge cases covered

### **UX Polish**
- [x] ✅ Loading states added
- [x] ✅ Error messages helpful
- [x] ✅ Success messages clear
- [x] ✅ Keyboard shortcuts work
- [x] ✅ Responsive design works

### **Release**
- [ ] ⏳ npm publish (CLI)
- [ ] ⏳ npm publish (API)
- [ ] ⏳ GitHub release created
- [ ] ⏳ Docker image published
- [ ] ⏳ Announcement posted

---

## 🎉 **Post-Release**

### **Monitor**
- npm downloads
- GitHub stars
- Issue reports
- User feedback
- Performance metrics

### **Engage**
- Respond to issues
- Review PRs
- Answer questions
- Share success stories
- Update documentation

### **Improve**
- Fix bugs
- Add requested features
- Optimize performance
- Expand documentation
- Plan next release

---

## 🚀 **You're Ready to Release!**

**Everything is connected and working:**
- ✅ UI ↔ API ↔ Database (100% connected)
- ✅ CLI commands working
- ✅ API endpoints complete
- ✅ UX polished and delightful
- ✅ Documentation complete
- ✅ Tests passing

**Release with confidence!** 🎊

---

**Happy Releasing!** 🚀
