#!/usr/bin/env node

/**
 * Post-Publish Script
 * Runs after npm publish to perform cleanup and notifications
 */

const fs = require('fs');
const path = require('path');

const packageJson = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'package.json'), 'utf8'));

console.log('\n🎉 Post-Publish Tasks\n');

console.log(`✓ Published: ${packageJson.name}@${packageJson.version}`);
console.log(`✓ Registry: ${packageJson.publishConfig?.registry || 'https://registry.npmjs.org/'}`);

// Clean up dist folder if needed
const distDir = path.join(__dirname, '..', 'dist');
if (fs.existsSync(distDir)) {
  const files = fs.readdirSync(distDir);
  console.log(`\n✓ Build artifacts in dist/:`);
  files.forEach((file) => {
    const stats = fs.statSync(path.join(distDir, file));
    const size = (stats.size / 1024).toFixed(2);
    console.log(`  - ${file} (${size} KB)`);
  });
}

console.log('\n📋 Next Steps:');
console.log('  1. Verify npm package: https://www.npmjs.com/package/debugg');
console.log('  2. Check GitHub release');
console.log('  3. Update documentation if needed');
console.log('  4. Notify team members\n');

console.log('✅ Post-publish tasks complete\n');
