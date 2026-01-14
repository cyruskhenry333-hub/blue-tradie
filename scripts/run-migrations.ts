/**
 * Non-interactive migration runner
 * Runs all pending SQL migrations without prompts
 */
import { migrate } from 'drizzle-orm/node-postgres/migrator';
import { pool, db } from '../server/db';
import fs from 'fs';
import path from 'path';

/**
 * Repair mechanism for token_ledger table
 * Only runs when MIGRATION_REPAIR_TOKEN_LEDGER=true
 */
async function repairTokenLedger() {
  console.log('[Migration Repair] Checking token_ledger table...');

  // Check if table exists
  const checkResult = await pool.query(`
    SELECT to_regclass('public.token_ledger') as exists;
  `);

  const tableExists = checkResult.rows[0]?.exists !== null;

  if (tableExists) {
    console.log('[Migration Repair] ✅ token_ledger already exists, skipping repair');
    return;
  }

  console.log('[Migration Repair] ⚠️ token_ledger missing, applying repair...');

  // Read and execute the SQL file
  const sqlFilePath = path.resolve(import.meta.dirname, '..', 'migrations', '0001_create_token_ledger.sql');
  const sqlContent = fs.readFileSync(sqlFilePath, 'utf-8');

  // Execute the SQL (handle multi-statement with DO blocks)
  await pool.query(sqlContent);
  console.log('[Migration Repair] ✅ Executed 0001_create_token_ledger.sql');

  // Ensure UNIQUE constraint exists on drizzle.__drizzle_migrations.hash
  await pool.query(`
    DO $$
    BEGIN
      IF NOT EXISTS (
        SELECT 1 FROM pg_constraint
        WHERE conname = '__drizzle_migrations_hash_unique'
        AND conrelid = 'drizzle.__drizzle_migrations'::regclass
      ) THEN
        ALTER TABLE drizzle.__drizzle_migrations
        ADD CONSTRAINT __drizzle_migrations_hash_unique UNIQUE (hash);
      END IF;
    END $$;
  `);
  console.log('[Migration Repair] ✅ Ensured UNIQUE constraint on drizzle.__drizzle_migrations.hash');

  // Insert ledger row to mark migration as applied
  const insertResult = await pool.query(`
    INSERT INTO drizzle.__drizzle_migrations (hash, created_at)
    VALUES ('0001_create_token_ledger', 1736819400000)
    ON CONFLICT (hash) DO NOTHING
    RETURNING hash;
  `);

  if (insertResult.rowCount && insertResult.rowCount > 0) {
    console.log('[Migration Repair] ✅ Marked 0001_create_token_ledger as applied in ledger');
  } else {
    console.log('[Migration Repair] ℹ️ 0001_create_token_ledger already in ledger');
  }

  // Verify table now exists
  const verifyResult = await pool.query(`
    SELECT to_regclass('public.token_ledger') as exists;
  `);
  const nowExists = verifyResult.rows[0]?.exists !== null;

  if (nowExists) {
    console.log('[Migration Repair] ✅ token_ledger table repair completed successfully');
  } else {
    throw new Error('Migration repair failed: token_ledger still does not exist');
  }
}

async function runMigrations() {
  try {
    console.log('[Migration] Running all pending migrations...');
    await migrate(db, { migrationsFolder: './migrations' });
    console.log('✅ All migrations completed successfully');

    // Run repair if enabled
    if (process.env.MIGRATION_REPAIR_TOKEN_LEDGER === 'true') {
      console.log('\n[Migration Repair] MIGRATION_REPAIR_TOKEN_LEDGER=true, running repair...');
      await repairTokenLedger();
    }

  } catch (error: any) {
    console.error('❌ Migration failed:', error?.message || error);
    process.exit(1);
  } finally {
    await pool.end();
    process.exit(0);
  }
}

runMigrations();
