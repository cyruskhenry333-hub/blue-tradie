/**
 * Non-interactive migration runner
 * Runs all pending SQL migrations without prompts
 */
import { migrate } from 'drizzle-orm/node-postgres/migrator';
import { pool, db } from '../server/db';

async function runMigrations() {
  try {
    console.log('[Migration] Running all pending migrations...');
    await migrate(db, { migrationsFolder: './migrations' });
    console.log('✅ All migrations completed successfully');
  } catch (error: any) {
    console.error('❌ Migration failed:', error?.message || error);
    process.exit(1);
  } finally {
    await pool.end();
    process.exit(0);
  }
}

runMigrations();
