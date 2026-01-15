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
pool.on('connect', (client) => {
  // 10s statement timeout - any query taking longer than this will be canceled
  client.query('SET statement_timeout = 10000');
  // 3s lock timeout - waiting for locks longer than this will error
  client.query('SET lock_timeout = 3000');
});

export const db = drizzle(pool, { schema });