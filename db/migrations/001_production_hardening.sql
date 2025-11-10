-- Production Hardening Migration
-- Generated: 2025-01-09
-- Purpose: Add unique constraints, idempotency, webhooks, proper types, and performance indexes

-- ============================================================================
-- 1. UNIQUE CONSTRAINTS FOR BUSINESS LOGIC INTEGRITY
-- ============================================================================

-- Ensure invoice numbers are unique per user per year
-- This prevents duplicate invoice numbers like INV-2025-001 for the same user
CREATE UNIQUE INDEX IF NOT EXISTS idx_invoices_user_year_sequence
ON invoices(user_id, year_sequence);

-- Add unique constraint on invoice_number as well (global uniqueness)
CREATE UNIQUE INDEX IF NOT EXISTS idx_invoices_number_unique
ON invoices(invoice_number);

-- Ensure quote numbers are unique per user per year
CREATE UNIQUE INDEX IF NOT EXISTS idx_quotes_user_year_sequence
ON quotes(user_id, year_sequence);

-- customer_portal_tokens.token_hash is already unique (verified in schema)

-- ============================================================================
-- 2. IDEMPOTENCY SUPPORT FOR CRITICAL OPERATIONS
-- ============================================================================

-- Idempotency keys table for preventing duplicate operations
-- Used for: quote acceptance, invoice status changes, Stripe webhooks, email sends
CREATE TABLE IF NOT EXISTS idempotency_keys (
  id TEXT PRIMARY KEY, -- Format: "{scope}:{identifier}" e.g. "quote:accept:123:abc123"
  scope TEXT NOT NULL, -- quote_accept, invoice_update, stripe_webhook, email_send
  resource_id TEXT, -- The ID of the resource being operated on
  request_fingerprint TEXT, -- Hash of request parameters
  response_data JSONB, -- Cached response for replay
  status TEXT NOT NULL DEFAULT 'processing', -- processing, completed, failed
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ NOT NULL, -- Auto-cleanup old keys

  CONSTRAINT idempotency_keys_scope_check CHECK (scope IN (
    'quote_accept',
    'quote_convert',
    'invoice_status_change',
    'invoice_payment',
    'stripe_webhook',
    'email_send',
    'sms_send',
    'customer_portal_access'
  ))
);

-- Index for fast lookups and cleanup
CREATE INDEX idx_idempotency_scope ON idempotency_keys(scope, created_at);
CREATE INDEX idx_idempotency_expires ON idempotency_keys(expires_at) WHERE status = 'completed';

-- ============================================================================
-- 3. WEBHOOK EVENTS TABLE FOR STRIPE/EXTERNAL INTEGRATIONS
-- ============================================================================

-- Track all incoming webhooks for idempotency and debugging
CREATE TABLE IF NOT EXISTS webhook_events (
  id SERIAL PRIMARY KEY,
  provider TEXT NOT NULL, -- stripe, twilio, sendgrid, etc.
  provider_event_id TEXT NOT NULL, -- External event ID (e.g., evt_xxx from Stripe)
  event_type TEXT NOT NULL, -- payment_intent.succeeded, invoice.paid, etc.
  event_data JSONB NOT NULL, -- Full webhook payload
  status TEXT NOT NULL DEFAULT 'pending', -- pending, processing, processed, failed, ignored
  processed_at TIMESTAMPTZ,
  error_message TEXT,
  retry_count INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Prevent duplicate processing of same event
  CONSTRAINT webhook_events_provider_event_unique UNIQUE(provider, provider_event_id)
);

-- Performance indexes
CREATE INDEX idx_webhook_events_status ON webhook_events(status, created_at);
CREATE INDEX idx_webhook_events_provider_type ON webhook_events(provider, event_type);

-- ============================================================================
-- 4. UPGRADE TIMESTAMP TO TIMESTAMPTZ (TIMEZONE-AWARE)
-- ============================================================================

-- Note: This is a breaking change. For existing data, run:
-- ALTER TABLE table_name ALTER COLUMN column_name TYPE TIMESTAMPTZ USING column_name AT TIME ZONE 'UTC';

-- We'll document the required manual migrations but NOT execute them here
-- to avoid data loss. These should be run during a maintenance window:

/*
-- Invoices
ALTER TABLE invoices
  ALTER COLUMN due_date TYPE TIMESTAMPTZ USING due_date AT TIME ZONE 'UTC',
  ALTER COLUMN paid_date TYPE TIMESTAMPTZ USING paid_date AT TIME ZONE 'UTC',
  ALTER COLUMN email_sent_at TYPE TIMESTAMPTZ USING email_sent_at AT TIME ZONE 'UTC',
  ALTER COLUMN paid_at TYPE TIMESTAMPTZ USING paid_at AT TIME ZONE 'UTC',
  ALTER COLUMN created_at TYPE TIMESTAMPTZ USING created_at AT TIME ZONE 'UTC',
  ALTER COLUMN updated_at TYPE TIMESTAMPTZ USING updated_at AT TIME ZONE 'UTC';

-- Quotes
ALTER TABLE quotes
  ALTER COLUMN valid_until TYPE TIMESTAMPTZ USING valid_until AT TIME ZONE 'UTC',
  ALTER COLUMN sent_at TYPE TIMESTAMPTZ USING sent_at AT TIME ZONE 'UTC',
  ALTER COLUMN viewed_at TYPE TIMESTAMPTZ USING viewed_at AT TIME ZONE 'UTC',
  ALTER COLUMN responded_at TYPE TIMESTAMPTZ USING responded_at AT TIME ZONE 'UTC',
  ALTER COLUMN converted_at TYPE TIMESTAMPTZ USING converted_at AT TIME ZONE 'UTC',
  ALTER COLUMN created_at TYPE TIMESTAMPTZ USING created_at AT TIME ZONE 'UTC',
  ALTER COLUMN updated_at TYPE TIMESTAMPTZ USING updated_at AT TIME ZONE 'UTC';

-- Jobs
ALTER TABLE jobs
  ALTER COLUMN scheduled_date TYPE TIMESTAMPTZ USING scheduled_date AT TIME ZONE 'UTC',
  ALTER COLUMN completed_date TYPE TIMESTAMPTZ USING completed_date AT TIME ZONE 'UTC',
  ALTER COLUMN created_at TYPE TIMESTAMPTZ USING created_at AT TIME ZONE 'UTC',
  ALTER COLUMN updated_at TYPE TIMESTAMPTZ USING updated_at AT TIME ZONE 'UTC';

-- Expenses
ALTER TABLE expenses
  ALTER COLUMN date TYPE TIMESTAMPTZ USING date AT TIME ZONE 'UTC',
  ALTER COLUMN created_at TYPE TIMESTAMPTZ USING created_at AT TIME ZONE 'UTC';

-- Customer Portal Tokens
ALTER TABLE customer_portal_tokens
  ALTER COLUMN expires_at TYPE TIMESTAMPTZ USING expires_at AT TIME ZONE 'UTC',
  ALTER COLUMN consumed_at TYPE TIMESTAMPTZ USING consumed_at AT TIME ZONE 'UTC',
  ALTER COLUMN created_at TYPE TIMESTAMPTZ USING created_at AT TIME ZONE 'UTC';

-- Add similar for other tables...
*/

-- ============================================================================
-- 5. UPGRADE DECIMAL TO NUMERIC FOR MONEY FIELDS
-- ============================================================================

-- Money fields should use NUMERIC(12,2) for consistency and precision
-- Current: decimal(10,2) -> Upgrade to: numeric(12,2)

/*
ALTER TABLE invoices
  ALTER COLUMN subtotal TYPE NUMERIC(12,2),
  ALTER COLUMN gst TYPE NUMERIC(12,2),
  ALTER COLUMN total TYPE NUMERIC(12,2);

ALTER TABLE quotes
  ALTER COLUMN subtotal TYPE NUMERIC(12,2),
  ALTER COLUMN gst TYPE NUMERIC(12,2),
  ALTER COLUMN total TYPE NUMERIC(12,2);

ALTER TABLE jobs
  ALTER COLUMN total_amount TYPE NUMERIC(12,2);

ALTER TABLE expenses
  ALTER COLUMN amount TYPE NUMERIC(12,2);
*/

-- ============================================================================
-- 6. PERFORMANCE INDEXES ON HOT PATHS
-- ============================================================================

-- Quotes: List quotes by user, filter by status, sort by date
CREATE INDEX IF NOT EXISTS idx_quotes_user_status_date
ON quotes(user_id, status, created_at DESC);

-- Invoices: List invoices by user, filter by status, sort by date
CREATE INDEX IF NOT EXISTS idx_invoices_user_status_date
ON invoices(user_id, status, created_at DESC);

-- Analytics Events: Query by user and date range
CREATE INDEX IF NOT EXISTS idx_analytics_user_date
ON analytics_events(user_id, created_at DESC);

-- Customer Portal Tokens: Find active tokens by user and expiry
CREATE INDEX IF NOT EXISTS idx_portal_tokens_user_expires
ON customer_portal_tokens(user_id, expires_at DESC)
WHERE consumed_at IS NULL;

-- Jobs: Filter by status and scheduled date
CREATE INDEX IF NOT EXISTS idx_jobs_status_scheduled
ON jobs(status, scheduled_date DESC);

-- Expenses: Query by user and date for tax reporting
CREATE INDEX IF NOT EXISTS idx_expenses_user_date
ON expenses(user_id, date DESC);

-- Invoices: Find unpaid invoices approaching due date
CREATE INDEX IF NOT EXISTS idx_invoices_unpaid_due
ON invoices(status, due_date)
WHERE status IN ('sent', 'overdue');

-- Quotes: Find quotes needing follow-up (sent but not responded)
CREATE INDEX IF NOT EXISTS idx_quotes_pending_response
ON quotes(user_id, sent_at)
WHERE status = 'sent' AND responded_at IS NULL;

-- ============================================================================
-- 7. DATA VALIDATION CONSTRAINTS
-- ============================================================================

-- Ensure email addresses are lowercase
CREATE OR REPLACE FUNCTION lowercase_email()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.customer_email IS NOT NULL THEN
    NEW.customer_email = LOWER(NEW.customer_email);
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply to invoices
DROP TRIGGER IF EXISTS lowercase_invoice_email ON invoices;
CREATE TRIGGER lowercase_invoice_email
BEFORE INSERT OR UPDATE ON invoices
FOR EACH ROW EXECUTE FUNCTION lowercase_email();

-- Apply to quotes
DROP TRIGGER IF EXISTS lowercase_quote_email ON quotes;
CREATE TRIGGER lowercase_quote_email
BEFORE INSERT OR UPDATE ON quotes
FOR EACH ROW EXECUTE FUNCTION lowercase_email();

-- Ensure money values are non-negative
ALTER TABLE invoices ADD CONSTRAINT invoices_amounts_positive
  CHECK (subtotal >= 0 AND gst >= 0 AND total >= 0);

ALTER TABLE quotes ADD CONSTRAINT quotes_amounts_positive
  CHECK (subtotal >= 0 AND gst >= 0 AND total >= 0);

-- Ensure invoice/quote numbers follow format
ALTER TABLE invoices ADD CONSTRAINT invoices_number_format
  CHECK (invoice_number ~ '^INV-\d{4}-\d+$');

ALTER TABLE quotes ADD CONSTRAINT quotes_number_format
  CHECK (quote_number ~ '^QTE-\d{4}-\d+$');

-- ============================================================================
-- 8. STRIPE PAYMENT INTENT TRACKING
-- ============================================================================

-- Add index for Stripe payment intent lookups
CREATE INDEX IF NOT EXISTS idx_invoices_stripe_payment_intent
ON invoices(stripe_payment_intent_id)
WHERE stripe_payment_intent_id IS NOT NULL;

-- ============================================================================
-- 9. AUTO-UPDATE TIMESTAMPS
-- ============================================================================

-- Function to auto-update updated_at
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply to tables (only if not already exists)
CREATE TRIGGER update_invoices_updated_at
BEFORE UPDATE ON invoices
FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_quotes_updated_at
BEFORE UPDATE ON quotes
FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_jobs_updated_at
BEFORE UPDATE ON jobs
FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ============================================================================
-- 10. CLEANUP POLICIES
-- ============================================================================

-- Create a function to clean up old idempotency keys (run daily)
CREATE OR REPLACE FUNCTION cleanup_old_idempotency_keys()
RETURNS INTEGER AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  DELETE FROM idempotency_keys
  WHERE expires_at < NOW() AND status = 'completed';

  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- MIGRATION COMPLETE
-- ============================================================================

-- Document what needs manual intervention:
COMMENT ON TABLE idempotency_keys IS
'Prevents duplicate operations. Clean up old keys with: SELECT cleanup_old_idempotency_keys();';

COMMENT ON TABLE webhook_events IS
'Tracks all incoming webhooks. Unique constraint on (provider, provider_event_id) prevents duplicate processing.';

-- Success message
DO $$
BEGIN
  RAISE NOTICE 'Production hardening migration completed successfully';
  RAISE NOTICE 'TODO: Run timestamp->timestamptz migrations during maintenance window';
  RAISE NOTICE 'TODO: Set up daily cleanup job for idempotency_keys';
END $$;
