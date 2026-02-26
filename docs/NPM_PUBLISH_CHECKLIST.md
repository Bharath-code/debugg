# NPM Publish Checklist

Complete checklist for publishing Debugg to npm.

---

## ✅ Pre-Publish Checklist

### Code Quality
- [ ] All tests passing (`bun test`)
- [ ] TypeScript compiles without errors (`bun run build:ts`)
- [ ] Linting passes (`bun run lint`)
- [ ] Code formatted (`bun run format`)
- [ ] Bundle size within limits (`bun run build:size`)
- [ ] Tree-shaking verified (`bun run build:verify`)

### Documentation
- [ ] README.md is complete and up-to-date
- [ ] CHANGELOG.md is updated with latest version
- [ ] API documentation generated (`bun run docs`)
- [ ] Integration guides complete
- [ ] Quick start guide accurate
- [ ] All links working

### Package Configuration
- [ ] package.json version is correct
- [ ] package.json has all required fields:
  - [ ] name
  - [ ] version
  - [ ] description
  - [ ] main
  - [ ] module
  - [ ] types
  - [ ] exports
  - [ ] files
  - [ ] license
  - [ ] repository
  - [ ] keywords
  - [ ] author
- [ ] .npmignore or files field configured
- [ ] .gitignore excludes node_modules, dist, etc.

### Testing
- [ ] Unit tests pass
- [ ] Integration tests pass
- [ ] E2E tests pass
- [ ] Performance tests pass
- [ ] Security tests pass
- [ ] Test coverage acceptable (>80%)

### Build
- [ ] Production build successful
- [ ] Source maps generated
- [ ] Type definitions generated
- [ ] Bundle analysis complete
- [ ] dist/ folder contains:
  - [ ] index.js
  - [ ] index.mjs
  - [ ] index.d.ts
  - [ ] index.js.map
  - [ ] index.mjs.map

### Security
- [ ] No sensitive data in code
- [ ] Dependencies audited (`bun audit`)
- [ ] No known vulnerabilities
- [ ] Security policy in place

---

## 🚀 Publish Steps

### 1. Final Verification

```bash
# Clean and install
rm -rf node_modules dist
bun install

# Run all checks
bun run typecheck
bun run lint
bun run format:check
bun test
bun run build
bun run build:size
bun run build:verify
```

### 2. Dry Run

```bash
# Test publish without actually publishing
npm publish --dry-run

# Verify package contents
npm pack --dry-run
```

### 3. Git Tag

```bash
# Create and push tag
git tag -a v1.0.0 -m "Release v1.0.0"
git push origin v1.0.0
```

### 4. GitHub Release

- [ ] Create release on GitHub
- [ ] Add release notes from CHANGELOG.md
- [ ] Attach build artifacts
- [ ] Mark as latest release

### 5. NPM Publish

```bash
# Login to npm (if not already)
npm login

# Publish to npm
npm publish

# Or publish with tag (for beta/alpha)
npm publish --tag beta
```

### 6. Verify Publication

- [ ] Check npmjs.com/package/debugg
- [ ] Verify version is correct
- [ ] Check all files included
- [ ] Test installation: `npm install debugg`
- [ ] Verify imports work

---

## 📊 Post-Publish Checklist

### Immediate (Day 1)
- [ ] Announce on Twitter
- [ ] Post on Reddit (r/javascript, r/typescript)
- [ ] Share on LinkedIn
- [ ] Post on Dev.to
- [ ] Share in Discord communities
- [ ] Send newsletter
- [ ] Update website

### Week 1
- [ ] Monitor npm downloads
- [ ] Track GitHub stars
- [ ] Respond to issues/PRs
- [ ] Gather feedback
- [ ] Collect testimonials

### Month 1
- [ ] Analyze adoption metrics
- [ ] Review community feedback
- [ ] Plan v1.1.0 features
- [ ] Write follow-up blog posts
- [ ] Create video tutorials

---

## 🔍 Verification Commands

### Check Published Package

```bash
# View package info
npm view debugg

# Check versions
npm view debugg versions

# Download and inspect
npm pack debugg
tar -xzf debugg-*.tgz
ls package/
```

### Test Installation

```bash
# Create test project
mkdir test-debugg && cd test-debugg
npm init -y
npm install debugg

# Create test file
echo "import { debugg } from 'debugg'; console.log('Works!');" > test.js
node test.js
```

---

## 📈 Metrics to Track

### npm Metrics
- Downloads (daily, weekly, monthly)
- Dependents count
- Search ranking
- Package health score

### GitHub Metrics
- Stars
- Forks
- Watchers
- Issues opened/closed
- PRs merged

### Community Metrics
- Discord members
- Twitter followers
- Newsletter subscribers
- Blog post views

---

## 🎯 Success Criteria

### Week 1 Goals
- [ ] 100+ downloads
- [ ] 50+ GitHub stars
- [ ] 5+ dependents
- [ ] 0 critical issues

### Month 1 Goals
- [ ] 1000+ downloads
- [ ] 200+ GitHub stars
- [ ] 20+ dependents
- [ ] Community contributions

### Quarter 1 Goals
- [ ] 10,000+ downloads
- [ ] 500+ GitHub stars
- [ ] 50+ dependents
- [ ] Active community

---

## 🆘 Troubleshooting

### Issue: Publish fails with "E403 Forbidden"

**Solution:**
```bash
# Verify login
npm whoami

# Check package name availability
npm view debugg

# Verify ownership
npm owner ls debugg
```

### Issue: Wrong files published

**Solution:**
```bash
# Check files field in package.json
# Or create .npmignore
npm publish --dry-run
```

### Issue: Version conflict

**Solution:**
```bash
# Bump version
npm version patch  # or minor, major

# Publish with new version
npm publish
```

---

## 📞 Support Contacts

- **npm Support:** https://www.npmjs.com/support
- **GitHub Status:** https://www.githubstatus.com
- **Registry Status:** https://status.npmjs.org

---

**Ready to publish! 🎉**
