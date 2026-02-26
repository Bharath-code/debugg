#!/usr/bin/env node

/**
 * Tree-Shaking Verification Script
 * Verifies that the library supports tree-shaking
 */

const fs = require('fs');
const path = require('path');

const DIST_DIR = path.join(__dirname, '..', 'dist');

console.log('\n🌳 Tree-Shaking Verification\n');

// Check package.json for tree-shaking hints
const packageJsonPath = path.join(__dirname, '..', 'package.json');
const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));

console.log('Package Configuration:\n');

// Check sideEffects
const sideEffects = packageJson.sideEffects;
if (sideEffects === false) {
  console.log('✓ sideEffects: false (optimal for tree-shaking)');
} else if (Array.isArray(sideEffects)) {
  console.log(`✓ sideEffects: [${sideEffects.join(', ')}] (selective)`);
} else {
  console.log('✗ sideEffects not configured (may prevent tree-shaking)');
}

// Check module exports
console.log('\nModule Exports:\n');

if (packageJson.exports) {
  const exports = packageJson.exports['.'];
  console.log(`  types:  ${exports.types || '✗ missing'}`);
  console.log(`  import: ${exports.import || '✗ missing'}`);
  console.log(`  require: ${exports.require || '✗ missing'}`);
  
  if (exports.types && exports.import && exports.require) {
    console.log('\n✓ All export conditions present');
  } else {
    console.log('\n✗ Some export conditions missing');
  }
} else {
  console.log(`  main:   ${packageJson.main || '✗ missing'}`);
  console.log(`  module: ${packageJson.module || '✗ missing'}`);
  console.log(`  types:  ${packageJson.types || '✗ missing'}`);
}

// Check built files
console.log('\nBuilt Files:\n');

const files = ['index.js', 'index.mjs', 'index.d.ts'];
files.forEach((file) => {
  const filePath = path.join(DIST_DIR, file);
  if (fs.existsSync(filePath)) {
    const stats = fs.statSync(filePath);
    console.log(`✓ ${file} (${(stats.size / 1024).toFixed(2)} KB)`);
  } else {
    console.log(`✗ ${file} (missing)`);
  }
});

// Check for pure annotations (helps tree-shaking)
const esmPath = path.join(DIST_DIR, 'index.mjs');
if (fs.existsSync(esmPath)) {
  const content = fs.readFileSync(esmPath, 'utf8');
  
  console.log('\nTree-Shaking Hints:\n');
  
  // Check for /*#__PURE__*/ annotations
  const pureAnnotations = (content.match(/\/\*\+#__PURE__\*\//g) || []).length;
  console.log(`  PURE annotations: ${pureAnnotations}`);
  
  // Check for use strict
  const useStrict = content.includes('"use strict"');
  console.log(`  "use strict": ${useStrict ? '✓' : '✗'}`);
  
  // Check exports are named
  const namedExports = content.includes('export {');
  console.log(`  Named exports: ${namedExports ? '✓' : '✗'}`);
}

console.log('\nRecommendations:\n');
console.log('  1. Keep sideEffects: false in package.json');
console.log('  2. Use ES modules (import/export) in source');
console.log('  3. Avoid top-level side effects');
console.log('  4. Add /*#__PURE__*/ annotations for pure functions');
console.log('  5. Use named exports instead of default exports\n');

console.log('✅ Tree-shaking verification complete\n');
