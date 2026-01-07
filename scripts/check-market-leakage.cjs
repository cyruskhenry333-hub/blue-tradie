#!/usr/bin/env node
/**
 * Market Leakage Prevention Script
 *
 * Scans codebase for hardcoded AU-specific strings outside allowed config files.
 * Run: node scripts/check-market-leakage.cjs
 * Or add to CI: npm run lint:market
 *
 * Fails with exit code 1 if forbidden strings found outside allowed locations.
 */

const fs = require('fs');
const path = require('path');

// Forbidden tokens that should only appear in config files
const FORBIDDEN_TOKENS = [
  'Sydney',
  'NSW',
  'Melbourne',
  'ABN',
  'ATO',
  'BAS',
  '"AUD"',  // Quoted to avoid matching "AUD" in comments
  '"AU Australia"'
];

// Files/directories where these tokens ARE allowed
const ALLOWED_LOCATIONS = [
  'shared/market-config.ts',
  'client/src/utils/language-utils.ts',
  'shared/schema.ts',  // Database schema can have country enum
  'docs/',  // Documentation
  'scripts/check-market-leakage.cjs',  // This script itself
  'node_modules/',
  'dist/',
  'build/',
  '.git/',
  'migrations/',  // DB migrations may have historical data
  'package-lock.json',
  'BLUE_TRADIE_HANDOVER_PACK_FINAL.md',  // Historical docs
  'attached_assets/',  // Archived files
  'README.md',  // Project docs may reference both markets
  '.env.example',  // Example env vars
];

// Directories to scan
const SCAN_DIRS = ['client/src', 'server', 'shared'];

let violations = [];

function isAllowedLocation(filePath) {
  return ALLOWED_LOCATIONS.some(allowed => filePath.includes(allowed));
}

function scanFile(filePath) {
  if (isAllowedLocation(filePath)) {
    return;
  }

  const content = fs.readFileSync(filePath, 'utf8');
  const lines = content.split('\n');

  lines.forEach((line, index) => {
    FORBIDDEN_TOKENS.forEach(token => {
      if (line.includes(token)) {
        violations.push({
          file: filePath,
          line: index + 1,
          token,
          snippet: line.trim()
        });
      }
    });
  });
}

function scanDirectory(dir) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });

  entries.forEach(entry => {
    const fullPath = path.join(dir, entry.name);

    if (entry.isDirectory()) {
      if (!isAllowedLocation(fullPath)) {
        scanDirectory(fullPath);
      }
    } else if (entry.isFile()) {
      // Only scan source files
      const ext = path.extname(entry.name);
      if (['.ts', '.tsx', '.js', '.jsx'].includes(ext)) {
        scanFile(fullPath);
      }
    }
  });
}

console.log('🔍 Scanning for market-specific leakage...\n');

SCAN_DIRS.forEach(dir => {
  if (fs.existsSync(dir)) {
    console.log(`Scanning ${dir}/...`);
    scanDirectory(dir);
  }
});

if (violations.length === 0) {
  console.log('\n✅ No market leakage detected. All AU-specific strings are in allowed config files.\n');
  process.exit(0);
} else {
  console.error('\n❌ Market leakage detected!\n');
  console.error('The following AU-specific strings were found outside allowed config files:\n');

  violations.forEach(v => {
    console.error(`  ${v.file}:${v.line}`);
    console.error(`    Token: "${v.token}"`);
    console.error(`    Code: ${v.snippet}`);
    console.error('');
  });

  console.error('These strings should be moved to shared/market-config.ts or client/src/utils/language-utils.ts');
  console.error('and accessed via helper functions.\n');
  console.error(`Total violations: ${violations.length}\n`);
  process.exit(1);
}
