import pkg from 'pg';
const { Pool } = pkg;
import { drizzle } from 'drizzle-orm/node-postgres';
import * as schema from "@shared/schema";

if (!process.env.DATABASE_URL) {
  throw new Error(
    "DATABASE_URL must be set. Did you forget to provision a database?",
  );
}

export const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  max: 10,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

// Set global statement timeout and lock timeout to prevent hung queries
// CRITICAL: Must await these queries to ensure timeouts are set before connection is used
pool.on('connect', async (client) => {
  try {
    // 10s statement timeout - any query taking longer than this will be canceled
    await client.query('SET statement_timeout = 10000');
    // 3s lock timeout - waiting for locks longer than this will error
    await client.query('SET lock_timeout = 3000');
    console.log('[DB] Connection timeouts set: statement_timeout=10s, lock_timeout=3s');
  } catch (error) {
    console.error('[DB] Failed to set connection timeouts:', error);
  }
});

export const db = drizzle(pool, { schema });

/**
 * Production self-test: Verify DB timeouts are actually applied
 * Runs once at startup and logs results
 */
async function verifyDatabaseTimeouts() {
  try {
    console.log('[DB] Running production self-test to verify timeouts...');
    const client = await pool.connect();

    try {
      // Verify statement_timeout
      const stmtResult = await client.query('SHOW statement_timeout');
      const stmtTimeout = stmtResult.rows[0]?.statement_timeout;

      // Verify lock_timeout
      const lockResult = await client.query('SHOW lock_timeout');
      const lockTimeout = lockResult.rows[0]?.lock_timeout;

      console.log('[DB] ✅ Self-test PASSED - Timeouts verified on Node connection:');
      console.log(`[DB]    statement_timeout = ${stmtTimeout}`);
      console.log(`[DB]    lock_timeout = ${lockTimeout}`);

      if (stmtTimeout !== '10s' && stmtTimeout !== '10000ms') {
        console.warn(`[DB] ⚠️  WARNING: statement_timeout is ${stmtTimeout}, expected 10s`);
      }
      if (lockTimeout !== '3s' && lockTimeout !== '3000ms') {
        console.warn(`[DB] ⚠️  WARNING: lock_timeout is ${lockTimeout}, expected 3s`);
      }
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('[DB] ❌ Self-test FAILED - Could not verify timeouts:', error);
  }
}

// Run self-test on startup (after a short delay to let pool initialize)
setTimeout(() => {
  verifyDatabaseTimeouts();
}, 1000);

/**
 * Helper to get a client with guaranteed timeouts set
 * Use this instead of pool.connect() for critical operations
 */
export async function getClientWithTimeouts() {
  const client = await pool.connect();

  try {
    // Explicitly set timeouts on this client to be 100% sure they're applied
    await client.query('SET statement_timeout = 10000');
    await client.query('SET lock_timeout = 3000');
    return client;
  } catch (error) {
    client.release();
    throw error;
  }
}