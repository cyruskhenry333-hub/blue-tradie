import { Client } from "pg";

/**
 * Runtime bootstrap to ensure critical tables exist in production.
 * This ensures webhook_events table exists even if drizzle-kit push fails
 * or encounters interactive prompts during build.
 */
export async function bootstrapDb(): Promise<void> {
  const databaseUrl = process.env.DRIZZLE_DATABASE_URL ?? process.env.DATABASE_URL;

  if (!databaseUrl) {
    console.log("[BOOTSTRAP] No DATABASE_URL found, skipping bootstrap");
    return;
  }

  const client = new Client({ connectionString: databaseUrl });

  try {
    await client.connect();
    console.log("[BOOTSTRAP] Connected to database");

    // Create webhook_events table if it doesn't exist (idempotent)
    await client.query(`
      CREATE TABLE IF NOT EXISTS webhook_events (
        id SERIAL PRIMARY KEY,
        provider TEXT NOT NULL,
        provider_event_id TEXT NOT NULL,
        event_type TEXT NOT NULL,
        event_data JSONB NOT NULL,
        status TEXT NOT NULL DEFAULT 'pending',
        processed_at TIMESTAMP,
        error_message TEXT,
        retry_count INTEGER NOT NULL DEFAULT 0,
        created_at TIMESTAMP NOT NULL DEFAULT NOW()
      );
    `);

    // Create unique index for idempotency (idempotent)
    await client.query(`
      CREATE UNIQUE INDEX IF NOT EXISTS webhook_events_provider_event_id_uq
        ON webhook_events(provider, provider_event_id);
    `);

    console.log("[BOOTSTRAP] ✅ webhook_events ensured");
  } catch (error: any) {
    // Log error but don't throw - allow app to start even if bootstrap fails
    console.error("[BOOTSTRAP] ❌ Failed to bootstrap database:", error?.message || error);
    console.error("[BOOTSTRAP] App will continue startup, but webhook_events may not exist");
  } finally {
    try {
      await client.end();
    } catch (endError) {
      // Ignore errors when closing connection
    }
  }
}
