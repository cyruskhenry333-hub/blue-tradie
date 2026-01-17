#!/usr/bin/env node

/**
 * BlueTradie Status Script
 * Prints current repo state and working state from docs/engineering/WORKING_STATE.md
 *
 * Note: Uses execSync with fixed commands only (no user input) - safe from injection.
 */

import { execSync } from 'child_process';
import { readFileSync, existsSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const repoRoot = join(__dirname, '..');

// Safe: only executes fixed git commands, no user input
function run(cmd) {
  try {
    return execSync(cmd, { cwd: repoRoot, encoding: 'utf8' }).trim();
  } catch {
    return '(command failed)';
  }
}

function parseWorkingState(content) {
  const result = {
    currentPR: '',
    now: '',
    next: '',
  };

  // Extract Current PR
  const prMatch = content.match(/## Current PR\s*\n\n\*\*([^*]+)\*\*/);
  if (prMatch) result.currentPR = prMatch[1].trim();

  // Extract NOW section
  const nowMatch = content.match(/### NOW\s*\n([\s\S]*?)(?=\n### |---)/);
  if (nowMatch) {
    result.now = nowMatch[1]
      .split('\n')
      .filter(line => line.trim().match(/^\d+\./))
      .map(line => line.trim())
      .join('\n');
  }

  // Extract NEXT section
  const nextMatch = content.match(/### NEXT\s*\n([\s\S]*?)(?=\n---)/);
  if (nextMatch) {
    result.next = nextMatch[1]
      .split('\n')
      .filter(line => line.trim().startsWith('-'))
      .map(line => line.trim())
      .join('\n');
  }

  return result;
}

console.log('═══════════════════════════════════════════════════════════════');
console.log('                    BLUETRADIE STATUS');
console.log('═══════════════════════════════════════════════════════════════\n');

// Repo info
console.log('📁 REPO ROOT:', repoRoot);
console.log('🌿 BRANCH:', run('git branch --show-current'));

// Dirty status
const status = run('git status --porcelain');
console.log('📝 DIRTY:', status ? 'Yes (uncommitted changes)' : 'No (clean)');

// Last 3 commits
console.log('\n📜 LAST 3 COMMITS:');
console.log(run('git log --oneline -3'));

// Working state
const workingStatePath = join(repoRoot, 'docs/engineering/WORKING_STATE.md');
if (existsSync(workingStatePath)) {
  const content = readFileSync(workingStatePath, 'utf8');
  const state = parseWorkingState(content);

  console.log('\n═══════════════════════════════════════════════════════════════');
  console.log('                    WORKING STATE');
  console.log('═══════════════════════════════════════════════════════════════\n');

  console.log('🎯 CURRENT PR:', state.currentPR || '(not set)');

  if (state.now) {
    console.log('\n📌 NOW:');
    console.log(state.now);
  }

  if (state.next) {
    console.log('\n⏭️  NEXT:');
    console.log(state.next);
  }
} else {
  console.log('\n⚠️  WORKING_STATE.md not found at:', workingStatePath);
}

console.log('\n═══════════════════════════════════════════════════════════════\n');
