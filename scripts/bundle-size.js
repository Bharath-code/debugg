#!/usr/bin/env node

/**
 * Bundle Size Analysis Script
 * Analyzes the built bundle sizes and reports metrics
 */

const fs = require('fs');
const path = require('path');
const gzipSize = require('gzip-size');

const DIST_DIR = path.join(__dirname, '..', 'dist');

// Color codes for console output
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
};

/**
 * Format bytes to human-readable string
 */
function formatBytes(bytes) {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
}

/**
 * Get file size
 */
function getFileSize(filePath) {
  try {
    const stats = fs.statSync(filePath);
    return stats.size;
  } catch (error) {
    return 0;
  }
}

/**
 * Get gzip size
 */
async function getGzipSize(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    return await gzipSize(content);
  } catch (error) {
    return 0;
  }
}

/**
 * Analyze bundles
 */
async function analyzeBundles() {
  console.log(`\n${colors.cyan}╔════════════════════════════════════════╗${colors.reset}`);
  console.log(`${colors.cyan}║   Debugg Bundle Size Analysis          ║${colors.reset}`);
  console.log(`${colors.cyan}╚════════════════════════════════════════╝${colors.reset}\n`);

  const files = [
    { name: 'CommonJS Bundle', path: 'index.js' },
    { name: 'ESM Bundle', path: 'index.mjs' },
    { name: 'TypeScript Definitions', path: 'index.d.ts' },
  ];

  const results = [];
  let totalSize = 0;
  let totalGzipSize = 0;

  for (const file of files) {
    const filePath = path.join(DIST_DIR, file.path);
    const size = getFileSize(filePath);
    const gzip = await getGzipSize(filePath);

    totalSize += size;
    totalGzipSize += gzip;

    results.push({
      name: file.name,
      size,
      gzip,
      path: file.path,
    });
  }

  // Display results
  console.log(`${colors.blue}Bundle Files:${colors.reset}\n`);
  console.log(`${colors.yellow}┌─────────────────────────────────┬──────────────┬──────────────┐${colors.reset}`);
  console.log(`${colors.yellow}│${colors.reset} File                            ${colors.yellow}│${colors.reset} Size         ${colors.yellow}│${colors.reset} Gzip         ${colors.yellow}│${colors.reset}`);
  console.log(`${colors.yellow}├─────────────────────────────────┼──────────────┼──────────────┤${colors.reset}`);

  for (const result of results) {
    const sizeStr = formatBytes(result.size).padStart(12);
    const gzipStr = formatBytes(result.gzip).padStart(12);
    console.log(`${colors.yellow}│${colors.reset} ${result.name.padEnd(31)} ${colors.yellow}│${colors.reset} ${sizeStr} ${colors.yellow}│${colors.reset} ${gzipStr} ${colors.yellow}│${colors.reset}`);
  }

  console.log(`${colors.yellow}└─────────────────────────────────┴──────────────┴──────────────┘${colors.reset}\n`);

  // Summary
  console.log(`${colors.blue}Summary:${colors.reset}\n`);
  console.log(`  Total Size:  ${formatBytes(totalSize)}`);
  console.log(`  Total Gzip:  ${formatBytes(totalGzipSize)}`);
  console.log(`  Compression: ${((1 - totalGzipSize / totalSize) * 100).toFixed(2)}% reduction\n`);

  // Thresholds
  const thresholds = {
    js: 100 * 1024, // 100 KB
    mjs: 80 * 1024, // 80 KB
    dts: 50 * 1024, // 50 KB
  };

  console.log(`${colors.blue}Threshold Check:${colors.reset}\n`);

  let allPassed = true;

  const jsResult = results.find((r) => r.path === 'index.js');
  const mjsResult = results.find((r) => r.path === 'index.mjs');
  const dtsResult = results.find((r) => r.path === 'index.d.ts');

  if (jsResult && jsResult.size > thresholds.js) {
    console.log(`${colors.red}✗${colors.reset} CommonJS bundle exceeds ${formatBytes(thresholds.js)} (${formatBytes(jsResult.size)})`);
    allPassed = false;
  } else if (jsResult) {
    console.log(`${colors.green}✓${colors.reset} CommonJS bundle within threshold`);
  }

  if (mjsResult && mjsResult.size > thresholds.mjs) {
    console.log(`${colors.red}✗${colors.reset} ESM bundle exceeds ${formatBytes(thresholds.mjs)} (${formatBytes(mjsResult.size)})`);
    allPassed = false;
  } else if (mjsResult) {
    console.log(`${colors.green}✓${colors.reset} ESM bundle within threshold`);
  }

  if (dtsResult && dtsResult.size > thresholds.dts) {
    console.log(`${colors.red}✗${colors.reset} Type definitions exceed ${formatBytes(thresholds.dts)} (${formatBytes(dtsResult.size)})`);
    allPassed = false;
  } else if (dtsResult) {
    console.log(`${colors.green}✓${colors.reset} Type definitions within threshold`);
  }

  console.log('');

  // Save results to JSON
  const reportPath = path.join(__dirname, '..', 'bundle-report.json');
  const report = {
    timestamp: new Date().toISOString(),
    bundles: results.map((r) => ({
      name: r.name,
      path: r.path,
      size: r.size,
      gzip: r.gzip,
      sizeFormatted: formatBytes(r.size),
      gzipFormatted: formatBytes(r.gzip),
    })),
    summary: {
      totalSize,
      totalGzipSize,
      compressionRatio: (1 - totalGzipSize / totalSize) * 100,
    },
    thresholds: {
      passed: allPassed,
      limits: thresholds,
    },
  };

  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
  console.log(`${colors.green}✓${colors.reset} Report saved to ${reportPath}\n`);

  // Exit with error if thresholds not met
  if (!allPassed) {
    console.log(`${colors.red}⚠ Bundle size thresholds exceeded!${colors.reset}\n`);
    process.exit(1);
  } else {
    console.log(`${colors.green}✓ All bundle size thresholds passed!${colors.reset}\n`);
    process.exit(0);
  }
}

// Run analysis
analyzeBundles().catch((error) => {
  console.error(`${colors.red}Error analyzing bundles:${colors.reset}`, error);
  process.exit(1);
});
