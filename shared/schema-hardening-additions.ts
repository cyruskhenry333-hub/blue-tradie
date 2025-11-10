// Production Hardening - Schema Additions
// Add these to shared/schema.ts

import { pgTable, text, serial, integer, jsonb, timestamp, varchar, index, unique } from "drizzle-orm/pg-core";

// ============================================================================
// IDEMPOTENCY KEYS - Prevent duplicate operations
// ============================================================================

export const idempotencyKeys = pgTable("idempotency_keys", {
  id: text("id").primaryKey(), // Format: "{scope}:{identifier}"
  scope: text("scope").notNull(), // quote_accept, invoice_update, stripe_webhook, etc.
  resourceId: text("resource_id"), // ID of resource being operated on
  requestFingerprint: text("request_fingerprint"), // Hash of request params
  responseData: jsonb("response_data"), // Cached response for replay
  status: text("status").notNull().default("processing"), // processing, completed, failed
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  completedAt: timestamp("completed_at", { withTimezone: true }),
  expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
}, (table) => [
  index("idx_idempotency_scope").on(table.scope, table.createdAt),
  index("idx_idempotency_expires").on(table.expiresAt),
]);

// ============================================================================
// WEBHOOK EVENTS - Track external webhooks (Stripe, Twilio, etc.)
// ============================================================================

export const webhookEvents = pgTable("webhook_events", {
  id: serial("id").primaryKey(),
  provider: text("provider").notNull(), // stripe, twilio, sendgrid
  providerEventId: text("provider_event_id").notNull(), // evt_xxx from Stripe
  eventType: text("event_type").notNull(), // payment_intent.succeeded, etc.
  eventData: jsonb("event_data").notNull(), // Full webhook payload
  status: text("status").notNull().default("pending"), // pending, processing, processed, failed
  processedAt: timestamp("processed_at", { withTimezone: true }),
  errorMessage: text("error_message"),
  retryCount: integer("retry_count").notNull().default(0),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
}, (table) => [
  index("idx_webhook_events_status").on(table.status, table.createdAt),
  index("idx_webhook_events_provider_type").on(table.provider, table.eventType),
  // Unique constraint to prevent duplicate processing
  unique("webhook_events_provider_event_unique").on(table.provider, table.providerEventId),
]);

// ============================================================================
// UPDATED TABLES - Add unique constraints and indexes
// ============================================================================

// INVOICES - Add composite unique constraint and performance indexes
// Add to existing invoices table definition:
/*
}, (table) => [
  index("idx_invoices_user_id").on(table.userId),
  index("idx_invoices_status").on(table.status),
  index("idx_invoices_user_status_date").on(table.userId, table.status, table.createdAt),
  index("idx_invoices_stripe_payment_intent").on(table.stripePaymentIntentId),
  index("idx_invoices_unpaid_due").on(table.status, table.dueDate), // WHERE status IN ('sent', 'overdue')
  unique("idx_invoices_user_year_sequence").on(table.userId, table.yearSequence),
  unique("idx_invoices_number_unique").on(table.invoiceNumber),
]);
*/

// QUOTES - Add composite unique constraint and performance indexes
// Add to existing quotes table definition:
/*
}, (table) => [
  index("idx_quotes_user_id").on(table.userId),
  index("idx_quotes_status").on(table.status),
  index("idx_quotes_customer_email").on(table.customerEmail),
  index("idx_quotes_user_status_date").on(table.userId, table.status, table.createdAt),
  index("idx_quotes_pending_response").on(table.userId, table.sentAt), // WHERE status = 'sent' AND responded_at IS NULL
  unique("idx_quotes_user_year_sequence").on(table.userId, table.yearSequence),
  // quoteNumber already has unique constraint
]);
*/

// CUSTOMER PORTAL TOKENS - Add performance index
// Add to existing customerPortalTokens table definition:
/*
}, (table) => [
  index("idx_portal_tokens_hash").on(table.tokenHash),
  index("idx_portal_tokens_customer_email").on(table.customerEmail),
  index("idx_portal_tokens_user_expires").on(table.userId, table.expiresAt), // WHERE consumed_at IS NULL
]);
*/

// ANALYTICS EVENTS - Add performance index
// Add to existing analyticsEvents table definition:
/*
}, (table) => [
  index("idx_analytics_user_id").on(table.userId),
  index("idx_analytics_event_type").on(table.eventType),
  index("idx_analytics_created_at").on(table.createdAt),
  index("idx_analytics_session_id").on(table.sessionId),
  index("idx_analytics_user_date").on(table.userId, table.createdAt),
]);
*/

// JOBS - Add performance indexes
// Add to existing jobs table definition:
/*
}, (table) => [
  index("idx_jobs_user_id").on(table.userId),
  index("idx_jobs_status").on(table.status),
  index("idx_jobs_status_scheduled").on(table.status, table.scheduledDate),
]);
*/

// EXPENSES - Add performance index
// Add to existing expenses table definition:
/*
}, (table) => [
  index("idx_expenses_user_id").on(table.userId),
  index("idx_expenses_user_date").on(table.userId, table.date),
]);
*/

// ============================================================================
// TYPE UPDATES - Use timestamptz and numeric(12,2)
// ============================================================================

/*
IMPORTANT: Update all existing timestamp fields to use { withTimezone: true }:

Examples:
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),

Update all money fields to use numeric with precision 12, scale 2:
  subtotal: numeric("subtotal", { precision: 12, scale: 2 }).notNull(),
  total: numeric("total", { precision: 12, scale: 2 }).notNull(),
*/

// ============================================================================
// ZOD SCHEMAS for new tables
// ============================================================================

import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { z } from "zod";

// Idempotency key schemas
export const insertIdempotencyKeySchema = createInsertSchema(idempotencyKeys);
export const selectIdempotencyKeySchema = createSelectSchema(idempotencyKeys);
export type IdempotencyKey = z.infer<typeof selectIdempotencyKeySchema>;
export type InsertIdempotencyKey = z.infer<typeof insertIdempotencyKeySchema>;

// Webhook event schemas
export const insertWebhookEventSchema = createInsertSchema(webhookEvents);
export const selectWebhookEventSchema = createSelectSchema(webhookEvents);
export type WebhookEvent = z.infer<typeof selectWebhookEventSchema>;
export type InsertWebhookEvent = z.infer<typeof insertWebhookEventSchema>;

// ============================================================================
// USAGE EXAMPLES
// ============================================================================

/*
// 1. Check idempotency before processing quote acceptance
const idempotencyKey = `quote:accept:${quoteId}:${requestFingerprint}`;
const existing = await db.select().from(idempotencyKeys)
  .where(eq(idempotencyKeys.id, idempotencyKey))
  .limit(1);

if (existing[0]) {
  if (existing[0].status === 'completed') {
    // Return cached response
    return existing[0].responseData;
  } else {
    // Operation in progress
    return { error: 'Operation already in progress' };
  }
}

// Create idempotency record
await db.insert(idempotencyKeys).values({
  id: idempotencyKey,
  scope: 'quote_accept',
  resourceId: quoteId.toString(),
  requestFingerprint,
  expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours
});

// Process operation...
// Update record when complete
await db.update(idempotencyKeys)
  .set({
    status: 'completed',
    responseData: result,
    completedAt: new Date(),
  })
  .where(eq(idempotencyKeys.id, idempotencyKey));

// 2. Process Stripe webhook with idempotency
const webhookIdempotencyKey = `stripe_webhook:${event.id}`;

// Check if already processed
const existingWebhook = await db.select().from(webhookEvents)
  .where(and(
    eq(webhookEvents.provider, 'stripe'),
    eq(webhookEvents.providerEventId, event.id)
  ))
  .limit(1);

if (existingWebhook[0]) {
  return { status: 'already_processed' };
}

// Record webhook
await db.insert(webhookEvents).values({
  provider: 'stripe',
  providerEventId: event.id,
  eventType: event.type,
  eventData: event,
  status: 'pending',
});

// Process webhook...
// Update status
await db.update(webhookEvents)
  .set({ status: 'processed', processedAt: new Date() })
  .where(and(
    eq(webhookEvents.provider, 'stripe'),
    eq(webhookEvents.providerEventId, event.id)
  ));

// 3. Cleanup old idempotency keys (run daily)
await db.delete(idempotencyKeys)
  .where(and(
    lt(idempotencyKeys.expiresAt, new Date()),
    eq(idempotencyKeys.status, 'completed')
  ));
*/
