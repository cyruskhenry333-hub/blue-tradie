-- Migration: Create token_ledger table
-- This table was missing from production after 0000_motionless_cerise was marked as applied
-- Schema source: shared/schema.ts lines 809-830

-- Create token_ledger table
CREATE TABLE IF NOT EXISTS "token_ledger" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" varchar(255) NOT NULL,
	"amount" integer NOT NULL,
	"balance_after" integer NOT NULL,
	"reason" varchar(50) NOT NULL,
	"metadata" jsonb,
	"idempotency_key" varchar(255),
	"transaction_id" varchar(255) NOT NULL,
	"reconciliation_status" varchar(20) DEFAULT 'pending',
	"created_at" timestamp DEFAULT now(),
	CONSTRAINT "token_ledger_idempotency_key_unique" UNIQUE("idempotency_key")
);

-- Add foreign key constraint (safe idempotent pattern)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'token_ledger_user_id_users_id_fk'
  ) THEN
    ALTER TABLE "token_ledger"
    ADD CONSTRAINT "token_ledger_user_id_users_id_fk"
    FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE cascade;
  END IF;
END $$;

-- Create indexes (from shared/schema.ts lines 844-846)
CREATE INDEX IF NOT EXISTS "idx_token_ledger_user"
ON "token_ledger" ("user_id", "created_at" DESC);

CREATE INDEX IF NOT EXISTS "idx_token_ledger_transaction"
ON "token_ledger" ("transaction_id");

-- Partial index for pending reconciliation status
CREATE INDEX IF NOT EXISTS "idx_token_ledger_reconcile"
ON "token_ledger" ("reconciliation_status")
WHERE "reconciliation_status" = 'pending';
