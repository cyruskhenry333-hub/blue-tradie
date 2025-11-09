import {
  pgTable,
  text,
  varchar,
  timestamp,
  jsonb,
  index,
  serial,
  integer,
  decimal,
  boolean,
  numeric,
} from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Session storage table (mandatory for Replit Auth)
export const sessions = pgTable(
  "sessions",
  {
    sid: varchar("sid").primaryKey(),
    sess: jsonb("sess").notNull(),
    expire: timestamp("expire").notNull(),
  },
  (table) => [index("IDX_session_expire").on(table.expire)],
);

// Auth sessions for magic-link authentication
export const authSessions = pgTable(
  "auth_sessions",
  {
    id: text("id").primaryKey(),
    userId: text("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    expiresAt: timestamp("expires_at").notNull(),
    revokedAt: timestamp("revoked_at"),
    ipAddress: text("ip_address"),
    userAgent: text("user_agent"),
  },
  (table) => [
    index("idx_auth_sessions_user_id").on(table.userId),
    index("idx_auth_sessions_expires_at").on(table.expiresAt),
  ],
);

// Magic link tokens for passwordless authentication
export const magicLinkTokens = pgTable(
  "magic_link_tokens", 
  {
    id: text("id").primaryKey(),
    email: text("email").notNull(),
    userId: text("user_id").references(() => users.id, { onDelete: "cascade" }),
    tokenHash: text("token_hash").notNull().unique(),
    purpose: text("purpose").notNull().default("login"), // Only "login" for now
    createdAt: timestamp("created_at").notNull().defaultNow(),
    expiresAt: timestamp("expires_at").notNull(),
    consumedAt: timestamp("consumed_at"),
    ipAddress: text("ip_address"),
    userAgent: text("user_agent"),
  },
  (table) => [
    index("idx_magic_tokens_hash").on(table.tokenHash),
    index("idx_magic_tokens_email").on(table.email),
    index("idx_magic_tokens_expires_at").on(table.expiresAt),
  ],
);

// User storage table (mandatory for Replit Auth)
export const users = pgTable("users", {
  id: varchar("id").primaryKey().notNull(),
  email: varchar("email").unique(),
  firstName: varchar("first_name"),
  lastName: varchar("last_name"),
  profileImageUrl: varchar("profile_image_url"),
  businessName: varchar("business_name"),
  businessLogo: varchar("business_logo"), // URL or description of business logo
  trade: varchar("trade"),
  serviceArea: varchar("service_area"),
  country: varchar("country").default("Australia"), // Australia or New Zealand
  isGstRegistered: boolean("is_gst_registered").default(false),
  isOnboarded: boolean("is_onboarded").default(false),
  businessType: varchar("business_type"), // "new" or "existing"
  experience: varchar("experience"), // "1-2", "3-5", "6-10", "10+" years
  currentRevenue: varchar("current_revenue"), // "0-5k", "5k-15k", "15k-30k", "30k+"
  isBetaUser: boolean("is_beta_user").default(false),
  betaInviteCode: varchar("beta_invite_code"),
  hasLifetimeBetaAccess: boolean("has_lifetime_beta_access").default(false), // Free access for beta testers
  stripeCustomerId: varchar("stripe_customer_id"),
  stripeSubscriptionId: varchar("stripe_subscription_id"),
  
  // Goals and Personalization
  userType: varchar("user_type"), // "tradie", "partner", "admin"
  gender: varchar("gender"), // "male", "female", "other"
  businessStructure: varchar("business_structure"), // "solo", "family", "team"
  goals: jsonb("goals"), // {financial: {monthlyTarget: 8000, savingsTarget: 5000}, work: {jobsPerWeek: 15}, personal: {holiday: "Bali", purchase: "new ute"}}
  visionSentence: text("vision_sentence"), // "In 12 months I will have $5000 saved, working 15 jobs per week, and we'll have gone on a holiday to Bali relaxing"
  visionBoardEnabled: boolean("vision_board_enabled").default(false),
  visionBoardImages: jsonb("vision_board_images"), // Array of image URLs or descriptions
  mateCheckInsEnabled: boolean("mate_check_ins_enabled").default(true),
  lastCheckInDate: timestamp("last_check_in_date"),
  tonePreference: varchar("tone_preference").default("casual"), // casual, professional, friendly
  
  // User Intelligence Calibration
  businessKnowledgeLevel: varchar("business_knowledge_level").default("beginner"), // beginner, intermediate, advanced
  ageRange: varchar("age_range"), // 18-25, 26-35, 36-45, 46-55, 56+
  techComfortLevel: varchar("tech_comfort_level").default("basic"), // basic, comfortable, advanced
  learningPreference: varchar("learning_preference").default("simple"), // simple, detailed, visual, step-by-step
  communicationTone: varchar("communication_tone").default("matey"), // matey, gentle, professional
  
  // Beta consent and compliance
  betaConsentGiven: boolean("beta_consent_given").default(false),
  betaConsentText: text("beta_consent_text"),
  betaConsentTimestamp: timestamp("beta_consent_timestamp"),
  betaConsentIpAddress: varchar("beta_consent_ip_address"),

  // Token Management and AI Usage Tracking
  tokenBalance: integer("token_balance").default(200), // Monthly token allocation
  tokenUsageThisMonth: integer("token_usage_this_month").default(0),
  tokenUsageToday: integer("token_usage_today").default(0),
  tokenPurchaseHistory: jsonb("token_purchase_history").default([]), // Array of purchase records
  tokenUsageHistory: jsonb("token_usage_history").default([]), // Array of usage records with timestamps
  tokenAlertThreshold: integer("token_alert_threshold").default(50), // Alert when tokens fall below this
  tokenAlertEnabled: boolean("token_alert_enabled").default(true),
  lastTokenReset: timestamp("last_token_reset"), // For monthly reset tracking
  subscriptionTier: varchar("subscription_tier").default("Blue Lite"), // Blue Lite, Blue Core, Blue Teams

  // Demo user system
  isDemoUser: boolean("is_demo_user").default(false),
  demoExpiresAt: timestamp("demo_expires_at"),
  demoTokensUsed: integer("demo_tokens_used").default(0),
  demoTokenLimit: integer("demo_token_limit").default(1000), // Default 1000 tokens for demo
  demoStatus: varchar("demo_status").default("active"), // active, expired, suspended
  
  // Free trial system for production users
  isFreeTrialUser: boolean("is_free_trial_user").default(false),
  freeTrialEndsAt: timestamp("free_trial_ends_at"),
  
  // UGC (User Generated Content) incentives for demo users
  ugcContributions: jsonb("ugc_contributions"), // Track testimonials, case studies, social posts
  ugcBonusTokens: integer("ugc_bonus_tokens").default(0), // Extra tokens earned through UGC
  ugcFoundingMemberStatus: boolean("ugc_founding_member_status").default(false), // Special status for UGC contributors
  
  // General user metadata for auto-demo and other features
  metadata: jsonb("metadata"), // Store temporary data like demo offers, preferences, etc.

  // 3-Tier Beta System
  betaTier: varchar("beta_tier"), // 'founding', 'earlySupporter', 'betaTester'
  betaTag: text("beta_tag"), // Full descriptive tag
  lifetimeDiscount: integer("lifetime_discount").default(0), // 0, 20, or 40 percent
  freeAccessUntil: timestamp("free_access_until"), // For tiers 2&3
  betaTrialStartDate: timestamp("beta_trial_start_date"), // Starts on public launch
  
  // Business Journey Roadmap
  currentJourneyStage: integer("current_journey_stage").default(1), // 1-5: Starting Out -> Confident Owner
  completedMilestones: jsonb("completed_milestones").default([]), // Array of milestone IDs
  lastStageUpdate: timestamp("last_stage_update"),
  
  // Free Trial System
  trialStartDate: timestamp("trial_start_date"),
  trialEndDate: timestamp("trial_end_date"),
  trialDurationDays: integer("trial_duration_days").default(14),
  isTrialActive: boolean("is_trial_active").default(false),
  hasUsedTrial: boolean("has_used_trial").default(false),
  trialEmailsSent: jsonb("trial_emails_sent").default([]), // Track which reminder emails have been sent
  subscriptionStatus: varchar("subscription_status").default("none"), // none, trial, active, expired, cancelled
  
  // Business Setup Checklist Status (using snake_case to match database columns)
  abn_registration_status: varchar("abn_registration_status").default("pending"),
  business_details_status: varchar("business_details_status").default("pending"),
  business_name_status: varchar("business_name_status").default("pending"),
  gst_registration_status: varchar("gst_registration_status").default("pending"),
  bank_account_status: varchar("bank_account_status").default("pending"),
  insurance_setup_status: varchar("insurance_setup_status").default("pending"),
  tax_setup_status: varchar("tax_setup_status").default("pending"),
  abn_registration_updated: timestamp("abn_registration_updated"),
  business_details_updated: timestamp("business_details_updated"),
  business_name_updated: timestamp("business_name_updated"),
  gst_registration_updated: timestamp("gst_registration_updated"),
  bank_account_updated: timestamp("bank_account_updated"),
  insurance_setup_updated: timestamp("insurance_setup_updated"),
  tax_setup_updated: timestamp("tax_setup_updated"),
  
  // Business profile for invoice emails
  fromEmail: varchar("from_email"),
  fromName: varchar("from_name"),
  currencyCode: varchar("currency_code").default("AUD"),
  
  // Email tracking
  welcomeSentAt: timestamp("welcome_sent_at"),
  firstLoginAt: timestamp("first_login_at"),
  
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Organizations table for multi-tenant support
export const organizations = pgTable("organizations", {
  id: varchar("id").primaryKey().notNull(), 
  name: varchar("name").notNull(),
  type: varchar("type").default("demo"), // "demo", "trial", "premium"
  isDemo: boolean("is_demo").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Organization Users table for per-org onboarding
export const organizationUsers = pgTable("organization_users", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  organizationId: varchar("organization_id").notNull().references(() => organizations.id, { onDelete: "cascade" }),
  role: varchar("role").default("member"), // "owner", "admin", "member"
  isOnboarded: boolean("is_onboarded").default(false), // PER-ORG onboarding status
  onboardedAt: timestamp("onboarded_at"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => ({
  userOrgIndex: index("user_org_idx").on(table.userId, table.organizationId),
}));

// Demo tokens table for secure magic link validation
export const demoTokens = pgTable("demo_tokens", {
  id: serial("id").primaryKey(),
  token: varchar("token").unique().notNull(),
  userId: varchar("user_id").references(() => users.id),
  organizationId: varchar("organization_id").references(() => organizations.id),
  email: varchar("email").notNull(),
  expiresAt: timestamp("expires_at").notNull(),
  usedAt: timestamp("used_at"),
  environment: varchar("environment").notNull(), // "preview", "production"
  baseUrl: varchar("base_url").notNull(), // The URL this token is valid for
  signingKey: varchar("signing_key").notNull(), // For token rotation
  createdAt: timestamp("created_at").defaultNow(),
});

// Waitlist table for users waiting for beta access
export const waitlist = pgTable("waitlist", {
  id: serial("id").primaryKey(),
  email: varchar("email").unique().notNull(),
  firstName: varchar("first_name"),
  lastName: varchar("last_name"),
  country: varchar("country").default("Australia"),
  trade: varchar("trade"),
  signupDate: timestamp("signup_date").defaultNow(),
  notified: boolean("notified").default(false),
  priority: integer("priority").default(0),
  // Email automation tracking
  demoCode: varchar("demo_code"), // Auto-generated Demo{UserNumber}
  demoCodeSent: boolean("demo_code_sent").default(false),
  demoCodeSentAt: timestamp("demo_code_sent_at"),
  earlyAccessRequested: boolean("early_access_requested").default(false),
  earlyAccessRequestedAt: timestamp("early_access_requested_at"),

  day7EmailSent: boolean("day7_email_sent").default(false),
  day7EmailSentAt: timestamp("day7_email_sent_at"),
  day14EmailSent: boolean("day14_email_sent").default(false),
  day14EmailSentAt: timestamp("day14_email_sent_at"),
  videoSubmitted: boolean("video_submitted").default(false),
  videoSubmittedAt: timestamp("video_submitted_at"),
  foundingMemberStatus: boolean("founding_member_status").default(false),
  notes: text("notes"), // Admin notes for user tracking
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const jobs = pgTable("jobs", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  customerName: varchar("customer_name").notNull(),
  customerEmail: varchar("customer_email"),
  customerPhone: varchar("customer_phone"),
  address: text("address"),
  description: text("description").notNull(),
  status: varchar("status").notNull().default("scheduled"), // scheduled, in_progress, completed, cancelled
  scheduledDate: timestamp("scheduled_date"),
  completedDate: timestamp("completed_date"),
  totalAmount: decimal("total_amount", { precision: 10, scale: 2 }),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const invoices = pgTable("invoices", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  jobId: integer("job_id").references(() => jobs.id),
  invoiceNumber: varchar("invoice_number").notNull(),
  yearSequence: integer("year_sequence").notNull(), // For tracking annual sequence
  customerName: varchar("customer_name").notNull(),
  customerEmail: varchar("customer_email"),
  status: varchar("status").notNull().default("draft"), // draft, sent, paid, overdue
  subtotal: decimal("subtotal", { precision: 10, scale: 2 }).notNull(),
  gst: decimal("gst", { precision: 10, scale: 2 }).notNull(),
  total: decimal("total", { precision: 10, scale: 2 }).notNull(),
  lineItems: jsonb("line_items").notNull(), // Array of {description, quantity, rate, amount}
  dueDate: timestamp("due_date"),
  paidDate: timestamp("paid_date"),
  stripePaymentIntentId: varchar("stripe_payment_intent_id"),
  // New fields for invoice emailing and Stripe payments
  emailTo: varchar("email_to"),
  emailSentAt: timestamp("email_sent_at"),
  paymentStatus: varchar("payment_status").notNull().default("draft"), // draft, sent, paid, failed, refunded
  stripeSessionId: varchar("stripe_session_id"),
  paidAt: timestamp("paid_at"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const expenses = pgTable("expenses", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  description: text("description").notNull(),
  amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
  category: varchar("category").notNull(), // tools, materials, fuel, insurance, etc.
  isGstClaimable: boolean("is_gst_claimable").default(false),
  linkedJobId: integer("linked_job_id").references(() => jobs.id),
  bankTransactionId: varchar("bank_transaction_id"), // For bank integration
  date: timestamp("date").notNull(),
  receiptUrl: varchar("receipt_url"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Quotes/Estimates system
export const quotes = pgTable("quotes", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  jobId: integer("job_id").references(() => jobs.id),
  quoteNumber: varchar("quote_number").notNull().unique(),
  yearSequence: integer("year_sequence").notNull(), // Annual sequence like invoices

  // Customer details
  customerName: varchar("customer_name").notNull(),
  customerEmail: varchar("customer_email"),
  customerPhone: varchar("customer_phone"),
  customerAddress: text("customer_address"),

  // Quote details
  title: varchar("title").notNull(), // e.g., "Kitchen Renovation", "Plumbing Repair"
  description: text("description"), // Overall job description
  lineItems: jsonb("line_items").notNull(), // [{description, quantity, rate, amount, type: 'labor'|'materials'}]
  subtotal: decimal("subtotal", { precision: 10, scale: 2 }).notNull(),
  gst: decimal("gst", { precision: 10, scale: 2 }).notNull(),
  total: decimal("total", { precision: 10, scale: 2 }).notNull(),

  // Status tracking
  status: varchar("status").notNull().default("draft"), // draft, sent, viewed, accepted, rejected, expired, converted
  validUntil: timestamp("valid_until"), // Quote expiry date

  // Customer interaction
  sentAt: timestamp("sent_at"),
  viewedAt: timestamp("viewed_at"),
  respondedAt: timestamp("responded_at"),
  customerNotes: text("customer_notes"), // Notes from customer when accepting/rejecting

  // Conversion to invoice
  convertedToInvoiceId: integer("converted_to_invoice_id").references(() => invoices.id),
  convertedAt: timestamp("converted_at"),

  // Communication
  portalAccessToken: varchar("portal_access_token"), // Unique token for customer portal access

  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => [
  index("idx_quotes_user_id").on(table.userId),
  index("idx_quotes_status").on(table.status),
  index("idx_quotes_customer_email").on(table.customerEmail),
]);

// Customer portal access tokens (magic links for customers)
export const customerPortalTokens = pgTable("customer_portal_tokens", {
  id: text("id").primaryKey(), // UUID
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }), // The tradie who owns this customer

  // Customer identification
  customerEmail: varchar("customer_email").notNull(),
  customerName: varchar("customer_name"),
  customerPhone: varchar("customer_phone"),

  // Token details
  tokenHash: text("token_hash").notNull().unique(), // SHA256 hash of actual token
  expiresAt: timestamp("expires_at").notNull(),
  consumedAt: timestamp("consumed_at"),

  // What customer can access
  quoteIds: jsonb("quote_ids"), // Array of quote IDs customer can view
  invoiceIds: jsonb("invoice_ids"), // Array of invoice IDs customer can view
  jobIds: jsonb("job_ids"), // Array of job IDs customer can view

  // Metadata
  ipAddress: text("ip_address"),
  userAgent: text("user_agent"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
}, (table) => [
  index("idx_customer_tokens_hash").on(table.tokenHash),
  index("idx_customer_tokens_email").on(table.customerEmail),
  index("idx_customer_tokens_expires").on(table.expiresAt),
]);

// ========== TEAMS & COLLABORATION ==========

// Team members - for Blue Teams tier
export const teamMembers = pgTable("team_members", {
  id: serial("id").primaryKey(),

  // Business owner (the paying subscriber)
  ownerId: varchar("owner_id").notNull().references(() => users.id, { onDelete: "cascade" }),

  // Team member (who gets access to owner's data)
  memberId: varchar("member_id").notNull().references(() => users.id, { onDelete: "cascade" }),

  // Role and permissions
  role: varchar("role").notNull().default("member"), // owner, admin, member, viewer
  permissions: jsonb("permissions"), // Granular permissions: { invoices: ['view', 'create'], jobs: ['view'], quotes: ['view', 'edit'] }

  // Status
  status: varchar("status").notNull().default("active"), // active, inactive, suspended

  // Metadata
  invitedBy: varchar("invited_by").references(() => users.id),
  joinedAt: timestamp("joined_at").defaultNow(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => [
  index("idx_team_members_owner").on(table.ownerId),
  index("idx_team_members_member").on(table.memberId),
  index("idx_team_members_status").on(table.status),
  // Ensure a user can't be added to the same team twice
  index("idx_team_members_unique").on(table.ownerId, table.memberId),
]);

// Team invitations - pending team member invites
export const teamInvitations = pgTable("team_invitations", {
  id: serial("id").primaryKey(),

  // Business owner sending the invite
  ownerId: varchar("owner_id").notNull().references(() => users.id, { onDelete: "cascade" }),

  // Invitee details
  email: varchar("email").notNull(),
  role: varchar("role").notNull().default("member"), // The role they'll have when they accept

  // Invitation token (unique, secure)
  token: text("token").notNull().unique(), // Secure random token for invite link
  tokenHash: text("token_hash").notNull().unique(), // SHA256 hash for database lookup

  // Status
  status: varchar("status").notNull().default("pending"), // pending, accepted, expired, cancelled

  // Who sent the invite
  invitedBy: varchar("invited_by").notNull().references(() => users.id),

  // Lifecycle
  expiresAt: timestamp("expires_at").notNull(), // 7 days default
  acceptedAt: timestamp("accepted_at"),
  cancelledAt: timestamp("cancelled_at"),
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => [
  index("idx_team_invites_owner").on(table.ownerId),
  index("idx_team_invites_email").on(table.email),
  index("idx_team_invites_token_hash").on(table.tokenHash),
  index("idx_team_invites_status").on(table.status),
]);

// ========== CALENDAR & SCHEDULING ==========

// Calendar events for job scheduling
export const calendarEvents = pgTable("calendar_events", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),

  // Event details
  title: varchar("title").notNull(),
  description: text("description"),
  location: text("location"),

  // Timing
  startTime: timestamp("start_time").notNull(),
  endTime: timestamp("end_time").notNull(),
  allDay: boolean("all_day").default(false),
  timezone: varchar("timezone").default("Australia/Sydney"),

  // Links to business data
  jobId: integer("job_id").references(() => jobs.id, { onDelete: "set null" }),
  customerId: varchar("customer_id"),
  customerName: varchar("customer_name"),

  // Event type and status
  eventType: varchar("event_type").default("job"), // job, meeting, appointment, reminder, block_time
  status: varchar("status").default("scheduled"), // scheduled, in_progress, completed, cancelled
  color: varchar("color").default("#3b82f6"), // Hex color for calendar display

  // Recurring events
  isRecurring: boolean("is_recurring").default(false),
  recurrenceRule: text("recurrence_rule"), // iCal RRULE format
  recurrenceEndDate: timestamp("recurrence_end_date"),
  parentEventId: integer("parent_event_id").references((): any => calendarEvents.id),

  // External calendar sync
  googleEventId: varchar("google_event_id"),
  outlookEventId: varchar("outlook_event_id"),
  lastSyncedAt: timestamp("last_synced_at"),
  syncStatus: varchar("sync_status").default("not_synced"), // not_synced, synced, sync_failed

  // Metadata
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => [
  index("idx_calendar_events_user").on(table.userId),
  index("idx_calendar_events_start").on(table.startTime),
  index("idx_calendar_events_job").on(table.jobId),
  index("idx_calendar_events_google").on(table.googleEventId),
  index("idx_calendar_events_outlook").on(table.outlookEventId),
]);

// Calendar sync settings for external calendars
export const calendarSyncSettings = pgTable("calendar_sync_settings", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }).unique(),

  // Google Calendar
  googleEnabled: boolean("google_enabled").default(false),
  googleAccessToken: text("google_access_token"),
  googleRefreshToken: text("google_refresh_token"),
  googleTokenExpiry: timestamp("google_token_expiry"),
  googleCalendarId: varchar("google_calendar_id"), // Primary calendar ID
  googleSyncToken: text("google_sync_token"), // For incremental sync
  googleLastSync: timestamp("google_last_sync"),

  // Outlook Calendar
  outlookEnabled: boolean("outlook_enabled").default(false),
  outlookAccessToken: text("outlook_access_token"),
  outlookRefreshToken: text("outlook_refresh_token"),
  outlookTokenExpiry: timestamp("outlook_token_expiry"),
  outlookCalendarId: varchar("outlook_calendar_id"),
  outlookDeltaToken: text("outlook_delta_token"), // For incremental sync
  outlookLastSync: timestamp("outlook_last_sync"),

  // Sync preferences
  syncDirection: varchar("sync_direction").default("both"), // both, to_external, from_external
  autoSync: boolean("auto_sync").default(true),
  syncFrequency: integer("sync_frequency").default(15), // Minutes between syncs

  // Metadata
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => [
  index("idx_calendar_sync_user").on(table.userId),
]);

// ========== DOCUMENTS & FILES ==========

// Document storage for job photos, invoices, quotes, etc.
export const documents = pgTable("documents", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),

  // File details
  fileName: varchar("file_name").notNull(),
  originalFileName: varchar("original_file_name").notNull(),
  fileSize: integer("file_size").notNull(), // in bytes
  mimeType: varchar("mime_type").notNull(),
  fileExtension: varchar("file_extension"),

  // Storage location
  storageProvider: varchar("storage_provider").notNull().default("local"), // local, s3, gcs
  storagePath: text("storage_path").notNull(), // Full path or URL
  storageKey: text("storage_key"), // S3/GCS object key
  bucketName: varchar("bucket_name"), // S3/GCS bucket

  // Document categorization
  documentType: varchar("document_type").notNull(), // photo, invoice, quote, receipt, contract, other
  category: varchar("category"), // before, after, progress, damage, etc.

  // Relationships
  jobId: integer("job_id").references(() => jobs.id, { onDelete: "set null" }),
  invoiceId: integer("invoice_id").references(() => invoices.id, { onDelete: "set null" }),
  quoteId: integer("quote_id").references(() => quotes.id, { onDelete: "set null" }),
  expenseId: integer("expense_id").references(() => expenses.id, { onDelete: "set null" }),

  // Metadata
  title: varchar("title"),
  description: text("description"),
  tags: jsonb("tags"), // Array of tags for searching
  isPublic: boolean("is_public").default(false), // Can be shared with customers

  // Image-specific metadata
  width: integer("width"),
  height: integer("height"),
  thumbnailPath: text("thumbnail_path"),

  // Security
  uploadedBy: varchar("uploaded_by").references(() => users.id),
  accessedAt: timestamp("accessed_at"),
  downloadCount: integer("download_count").default(0),

  // Lifecycle
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => [
  index("idx_documents_user").on(table.userId),
  index("idx_documents_job").on(table.jobId),
  index("idx_documents_invoice").on(table.invoiceId),
  index("idx_documents_quote").on(table.quoteId),
  index("idx_documents_type").on(table.documentType),
  index("idx_documents_created").on(table.createdAt),
]);

// Document access logs for security and compliance
export const documentAccessLogs = pgTable("document_access_logs", {
  id: serial("id").primaryKey(),
  documentId: integer("document_id").notNull().references(() => documents.id, { onDelete: "cascade" }),
  userId: varchar("user_id").references(() => users.id, { onDelete: "set null" }),

  // Access details
  action: varchar("action").notNull(), // view, download, delete, share
  ipAddress: varchar("ip_address"),
  userAgent: text("user_agent"),

  // Metadata
  accessedAt: timestamp("accessed_at").defaultNow(),
}, (table) => [
  index("idx_doc_access_document").on(table.documentId),
  index("idx_doc_access_user").on(table.userId),
  index("idx_doc_access_time").on(table.accessedAt),
]);

// ========== AUTOMATION & AI ==========

// Automation rules for AI-powered workflows
export const automationRules = pgTable("automation_rules", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),

  // Rule details
  name: varchar("name").notNull(),
  description: text("description"),
  isActive: boolean("is_active").default(true),

  // Trigger configuration
  triggerType: varchar("trigger_type").notNull(), // job_completed, invoice_sent, quote_accepted, days_after_job, etc.
  triggerConditions: jsonb("trigger_conditions"), // Additional conditions

  // Timing
  delayDays: integer("delay_days").default(0), // Delay before executing action
  delayHours: integer("delay_hours").default(0),

  // Action configuration
  actionType: varchar("action_type").notNull(), // send_email, send_sms, create_task, request_review
  actionConfig: jsonb("action_config"), // Action-specific configuration

  // AI-powered content
  useAI: boolean("use_ai").default(false), // Use AI to generate message content
  aiPrompt: text("ai_prompt"), // Prompt for AI content generation
  staticContent: text("static_content"), // Pre-written content if not using AI

  // Statistics
  executionCount: integer("execution_count").default(0),
  lastExecutedAt: timestamp("last_executed_at"),
  successCount: integer("success_count").default(0),
  failureCount: integer("failure_count").default(0),

  // Metadata
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => [
  index("idx_automation_rules_user").on(table.userId),
  index("idx_automation_rules_active").on(table.isActive),
  index("idx_automation_rules_trigger").on(table.triggerType),
]);

// Automation execution log
export const automationExecutions = pgTable("automation_executions", {
  id: serial("id").primaryKey(),
  ruleId: integer("rule_id").notNull().references(() => automationRules.id, { onDelete: "cascade" }),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),

  // Execution details
  status: varchar("status").notNull(), // pending, success, failed, skipped
  errorMessage: text("error_message"),

  // Context
  triggerData: jsonb("trigger_data"), // Data that triggered the rule
  jobId: integer("job_id").references(() => jobs.id, { onDelete: "set null" }),
  invoiceId: integer("invoice_id").references(() => invoices.id, { onDelete: "set null" }),
  quoteId: integer("quote_id").references(() => quotes.id, { onDelete: "set null" }),

  // Generated content (if AI was used)
  generatedContent: text("generated_content"),
  aiTokensUsed: integer("ai_tokens_used"),

  // Result
  actionResult: jsonb("action_result"), // Result of the action (email sent, SMS delivered, etc.)

  // Timing
  scheduledFor: timestamp("scheduled_for"),
  executedAt: timestamp("executed_at").defaultNow(),
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => [
  index("idx_automation_exec_rule").on(table.ruleId),
  index("idx_automation_exec_user").on(table.userId),
  index("idx_automation_exec_status").on(table.status),
  index("idx_automation_exec_scheduled").on(table.scheduledFor),
]);

// Review requests tracking
export const reviewRequests = pgTable("review_requests", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  jobId: integer("job_id").references(() => jobs.id, { onDelete: "set null" }),

  // Customer details
  customerName: varchar("customer_name").notNull(),
  customerEmail: varchar("customer_email"),
  customerPhone: varchar("customer_phone"),

  // Request details
  requestType: varchar("request_type").default("google_review"), // google_review, facebook_review, testimonial
  sentVia: varchar("sent_via"), // email, sms, both
  message: text("message"),

  // Status
  status: varchar("status").default("sent"), // sent, clicked, completed, declined
  clickedAt: timestamp("clicked_at"),
  completedAt: timestamp("completed_at"),
  reviewLink: text("review_link"), // Link to leave review

  // Review tracking
  reviewReceived: boolean("review_received").default(false),
  reviewRating: integer("review_rating"), // 1-5 stars
  reviewText: text("review_text"),

  // Metadata
  sentAt: timestamp("sent_at").defaultNow(),
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => [
  index("idx_review_requests_user").on(table.userId),
  index("idx_review_requests_job").on(table.jobId),
  index("idx_review_requests_status").on(table.status),
]);

export const chatMessages = pgTable("chat_messages", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  agentType: varchar("agent_type").notNull(), // accountant, marketing, coach, legal
  role: varchar("role").notNull(), // user, assistant
  content: text("content").notNull(),
  timestamp: timestamp("timestamp").defaultNow(),
});

// Trial email automation tracking
export const trialEmails = pgTable("trial_emails", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  emailType: varchar("email_type").notNull(), // "day_10_reminder", "day_13_final", "day_14_lockout"
  sentAt: timestamp("sent_at").defaultNow(),
  emailStatus: varchar("email_status").default("sent"), // sent, delivered, opened, clicked, failed
  createdAt: timestamp("created_at").defaultNow(),
});

// System settings for trial configuration
export const systemSettings = pgTable("system_settings", {
  id: serial("id").primaryKey(),
  settingKey: varchar("setting_key").notNull().unique(),
  settingValue: text("setting_value"),
  description: text("description"),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export type UpsertUser = typeof users.$inferInsert;
export type User = typeof users.$inferSelect;

// AI Responses cache table for hybrid system
export const aiResponses = pgTable("ai_responses", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  query: varchar("query", { length: 1000 }).notNull(),
  response: text("response").notNull(),
  agentType: varchar("agent_type", { length: 50 }).notNull(), // accountant, marketer, business_coach, legal
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Token usage tracking table (legacy - being phased out for ledger)
export const tokenUsage = pgTable("token_usage", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id),
  tokensUsed: integer("tokens_used").notNull(),
  costAud: numeric("cost_aud", { precision: 10, scale: 6 }).notNull(),
  agentType: varchar("agent_type", { length: 50 }),
  source: varchar("source", { length: 20 }).default("openai"), // 'cached' or 'openai'
  timestamp: timestamp("timestamp").defaultNow(),
});

// Token ledger - provision/reconcile/rollback accounting
export const tokenLedger = pgTable("token_ledger", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id", { length: 255 }).notNull().references(() => users.id, { onDelete: "cascade" }),

  // Transaction details
  amount: integer("amount").notNull(), // negative for usage, positive for grants/refunds
  balanceAfter: integer("balance_after").notNull(), // running balance after this entry
  reason: varchar("reason", { length: 50 }).notNull(), // 'monthly_grant', 'advisor_chat', 'rollover', 'purchase', 'provision', 'reconciliation', 'rollback'

  // Context metadata
  metadata: jsonb("metadata"), // {advisor: 'financial', messageId: 123, openaiUsage: {...}, estimated: true, etc.}

  // Idempotency & deduplication
  idempotencyKey: varchar("idempotency_key", { length: 255 }).unique(),

  // Audit trail
  transactionId: varchar("transaction_id", { length: 255 }).notNull(), // trace ID for grouping provision→reconcile→rollback
  reconciliationStatus: varchar("reconciliation_status", { length: 20 }).default("pending"), // 'pending', 'confirmed', 'adjusted', 'rolled_back'

  // Timestamps
  createdAt: timestamp("created_at").defaultNow(),
});

// Token usage alerts tracking (for one-per-month 80% alerts)
export const tokenAlerts = pgTable("token_alerts", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id", { length: 255 }).notNull().references(() => users.id, { onDelete: "cascade" }),
  alertType: varchar("alert_type", { length: 50 }).notNull(), // '80_percent', '100_percent'
  month: varchar("month", { length: 7 }).notNull(), // 'YYYY-MM' format
  balance: integer("balance").notNull(), // balance at time of alert
  limit: integer("limit").notNull(), // monthly limit at time of alert
  sentAt: timestamp("sent_at").defaultNow(),
});

// Indexes for performance
// CREATE INDEX idx_token_ledger_user ON token_ledger(user_id, created_at DESC);
// CREATE INDEX idx_token_ledger_reconcile ON token_ledger(reconciliation_status) WHERE reconciliation_status = 'pending';
// CREATE INDEX idx_token_ledger_transaction ON token_ledger(transaction_id);
// CREATE UNIQUE INDEX idx_token_alerts_user_month ON token_alerts(user_id, alert_type, month);

export type AIResponse = typeof aiResponses.$inferSelect;
export type InsertAIResponse = typeof aiResponses.$inferInsert;
export type TokenUsage = typeof tokenUsage.$inferSelect;
export type InsertTokenUsage = typeof tokenUsage.$inferInsert;
export type TokenLedgerEntry = typeof tokenLedger.$inferSelect;
export type InsertTokenLedgerEntry = typeof tokenLedger.$inferInsert;
export type TokenAlert = typeof tokenAlerts.$inferSelect;
export type InsertTokenAlert = typeof tokenAlerts.$inferInsert;
export type InsertJob = typeof jobs.$inferInsert;
export type Job = typeof jobs.$inferSelect;
export type InsertTrialEmail = typeof trialEmails.$inferInsert;
export type TrialEmail = typeof trialEmails.$inferSelect;
export type InsertSystemSetting = typeof systemSettings.$inferInsert;
export type SystemSetting = typeof systemSettings.$inferSelect;

export type InsertInvoice = typeof invoices.$inferInsert;
export type Invoice = typeof invoices.$inferSelect;
export type InsertQuote = typeof quotes.$inferInsert;
export type Quote = typeof quotes.$inferSelect;
export type InsertExpense = typeof expenses.$inferInsert;
export type Expense = typeof expenses.$inferSelect;
export type InsertChatMessage = typeof chatMessages.$inferInsert;
export type ChatMessage = typeof chatMessages.$inferSelect;
export type InsertCustomerPortalToken = typeof customerPortalTokens.$inferInsert;
export type CustomerPortalToken = typeof customerPortalTokens.$inferSelect;

// Public waitlist table for general interest signups (password gate)
export const publicWaitlistTable = pgTable("public_waitlist", {
  id: serial("id").primaryKey(),
  email: varchar("email", { length: 255 }).notNull().unique(),
  ip: varchar("ip", { length: 45 }),
  userAgent: text("user_agent"),
  referrer: text("referrer"),
  createdAt: timestamp("created_at").defaultNow()
});

export type InsertPublicWaitlist = typeof publicWaitlistTable.$inferInsert;
export type PublicWaitlist = typeof publicWaitlistTable.$inferSelect;

export const insertJobSchema = createInsertSchema(jobs).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
}).extend({
  scheduledDate: z.union([z.string(), z.date(), z.null(), z.undefined()]).transform(val => {
    if (!val) return null;
    if (val instanceof Date) return val;
    return new Date(val);
  }).optional(),
  totalAmount: z.union([z.string(), z.number()]).transform(val => String(val)).optional(),
});

export const insertInvoiceSchema = createInsertSchema(invoices).omit({
  id: true,
  invoiceNumber: true, // Auto-generated
  yearSequence: true, // Auto-generated
  createdAt: true,
  updatedAt: true,
}).extend({
  subtotal: z.union([z.string(), z.number()]).transform(val => String(val)),
  gst: z.union([z.string(), z.number()]).transform(val => String(val)),
  total: z.union([z.string(), z.number()]).transform(val => String(val))
});

export const insertQuoteSchema = createInsertSchema(quotes).omit({
  id: true,
  quoteNumber: true, // Auto-generated
  yearSequence: true, // Auto-generated
  createdAt: true,
  updatedAt: true,
  sentAt: true,
  viewedAt: true,
  respondedAt: true,
  convertedAt: true,
}).extend({
  subtotal: z.union([z.string(), z.number()]).transform(val => String(val)),
  gst: z.union([z.string(), z.number()]).transform(val => String(val)),
  total: z.union([z.string(), z.number()]).transform(val => String(val)),
  lineItems: z.array(z.object({
    description: z.string(),
    quantity: z.number(),
    rate: z.number(),
    amount: z.number(),
    type: z.enum(['labor', 'materials']).optional(),
  })),
});

export const insertExpenseSchema = createInsertSchema(expenses).omit({
  id: true,
  createdAt: true,
}).extend({
  amount: z.union([z.string(), z.number()]).transform(val => String(val)),
  date: z.union([z.string(), z.date()]).transform(val => {
    if (val instanceof Date) return val;
    return new Date(val);
  }),
  userId: z.string().optional(), // Will be set by backend from auth
});

export const insertChatMessageSchema = createInsertSchema(chatMessages).omit({
  id: true,
  timestamp: true,
});

// Beta functionality tables
export const betaInvites = pgTable("beta_invites", {
  id: serial("id").primaryKey(),
  code: varchar("code").notNull().unique(),
  email: varchar("email"),
  isUsed: boolean("is_used").default(false),
  usedBy: varchar("used_by"),
  createdAt: timestamp("created_at").defaultNow(),
  usedAt: timestamp("used_at"),
});

export const testimonials = pgTable("testimonials", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  content: text("content").notNull(),
  rating: integer("rating").notNull(), // 1-5 star rating
  name: varchar("name", { length: 100 }),
  profilePhoto: varchar("profile_photo", { length: 500 }),
  country: varchar("country", { length: 50 }).notNull(),
  isApproved: boolean("is_approved").default(false),
  isPublic: boolean("is_public").default(false),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const roadmapItems = pgTable("roadmap_items", {
  id: serial("id").primaryKey(),
  title: varchar("title", { length: 200 }).notNull(),
  description: text("description").notNull(),
  category: varchar("category", { length: 50 }).notNull(), // "feature", "improvement", "bug-fix"
  status: varchar("status", { length: 50 }).notNull().default("planned"), // "planned", "in-progress", "completed", "cancelled"
  priority: varchar("priority", { length: 20 }).notNull().default("medium"), // "critical", "high", "medium", "low"
  estimatedQuarter: varchar("estimated_quarter", { length: 10 }), // "Q1-2025", "Q2-2025", etc.
  votesCount: integer("votes_count").notNull().default(0),
  isPublic: boolean("is_public").default(false),
  completedDate: timestamp("completed_date"),
  
  // Progress tracking fields
  progressPercentage: integer("progress_percentage").default(0), // 0-100
  progressStatus: varchar("progress_status", { length: 20 }).default("not-started"), // "not-started", "scoping", "in-progress", "testing", "completed"
  developmentNotes: text("development_notes"), // Internal notes about progress
  
  // Community surge tracking
  baselineVotes: integer("baseline_votes").default(0), // Votes at start of week for surge detection
  weeklyVoteIncrease: integer("weekly_vote_increase").default(0), // Votes gained this week
  hasCommunitySurge: boolean("has_community_surge").default(false), // Flag for 🚀 badge
  surgeThreshold: integer("surge_threshold").default(10), // Votes needed for surge badge
  lastSurgeCheck: timestamp("last_surge_check"),
  
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const roadmapVotes = pgTable("roadmap_votes", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  roadmapItemId: integer("roadmap_item_id").notNull().references(() => roadmapItems.id, { onDelete: "cascade" }),
  country: varchar("country", { length: 50 }).notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const featureRequests = pgTable("feature_requests", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  title: varchar("title", { length: 200 }).notNull(),
  description: text("description").notNull(),
  category: varchar("category", { length: 50 }).notNull(),
  priority: varchar("priority", { length: 20 }).default("medium"),
  votesCount: integer("votes_count").notNull().default(0),
  country: varchar("country", { length: 50 }).notNull(),
  status: varchar("status", { length: 50 }).default("submitted"), // "submitted", "under-review", "planned", "rejected"
  createdAt: timestamp("created_at").defaultNow(),
});

export const feedbackSubmissions = pgTable("feedback_submissions", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  type: varchar("type").notNull(), // "bug", "feature", "general"
  title: varchar("title").notNull(),
  description: text("description").notNull(),
  priority: varchar("priority").default("medium"), // "low", "medium", "high"
  status: varchar("status").default("open"), // "open", "in-progress", "resolved", "closed"
  createdAt: timestamp("created_at").defaultNow(),
  resolvedAt: timestamp("resolved_at"),
});

export const waitlistEntries = pgTable("waitlist_entries", {
  id: serial("id").primaryKey(),
  email: varchar("email").unique().notNull(),
  firstName: varchar("first_name"),
  lastName: varchar("last_name"),
  country: varchar("country").default("Australia"),
  trade: varchar("trade"),
  referralSource: varchar("referral_source"), // how they heard about us
  notified: boolean("notified").default(false), // when we launch
  createdAt: timestamp("created_at").defaultNow(),
});

// Enhanced analytics system for AI learning and business insights
export const analyticsEvents = pgTable("analytics_events", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").references(() => users.id, { onDelete: "set null" }),
  sessionId: varchar("session_id"), // Track user sessions
  eventType: varchar("event_type", { length: 100 }).notNull(), // login, ai_chat, invoice_created, etc
  eventCategory: varchar("event_category", { length: 50 }), // user, business, system, ai
  eventData: jsonb("event_data"), // Structured event data
  metadata: jsonb("metadata"), // Device, browser, location, etc
  ipAddress: varchar("ip_address", { length: 45 }),
  userAgent: text("user_agent"),
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => [
  index("idx_analytics_user_id").on(table.userId),
  index("idx_analytics_event_type").on(table.eventType),
  index("idx_analytics_created_at").on(table.createdAt),
  index("idx_analytics_session_id").on(table.sessionId),
]);

// Session tracking for user behavior analysis
export const analyticsSessions = pgTable("analytics_sessions", {
  id: varchar("id").primaryKey(), // UUID
  userId: varchar("user_id").references(() => users.id, { onDelete: "cascade" }),
  startedAt: timestamp("started_at").notNull().defaultNow(),
  endedAt: timestamp("ended_at"),
  duration: integer("duration"), // seconds
  pageViews: integer("page_views").default(0),
  eventsCount: integer("events_count").default(0),
  device: varchar("device", { length: 50 }), // mobile, tablet, desktop
  browser: varchar("browser", { length: 50 }),
  os: varchar("os", { length: 50 }),
  country: varchar("country", { length: 2 }), // ISO code
  ipAddress: varchar("ip_address", { length: 45 }),
}, (table) => [
  index("idx_sessions_user_id").on(table.userId),
  index("idx_sessions_started_at").on(table.startedAt),
]);

// Aggregate metrics for fast querying and AI training
export const analyticsMetrics = pgTable("analytics_metrics", {
  id: serial("id").primaryKey(),
  metricDate: timestamp("metric_date").notNull(), // Date this metric represents
  metricType: varchar("metric_type", { length: 100 }).notNull(), // daily_active_users, revenue, etc
  metricValue: decimal("metric_value", { precision: 15, scale: 2 }).notNull(),
  dimensions: jsonb("dimensions"), // Additional breakdown (e.g., by plan, country)
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => [
  index("idx_metrics_date_type").on(table.metricDate, table.metricType),
]);

// Business KPIs for dashboard and AI insights
export const businessMetrics = pgTable("business_metrics", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  metricDate: timestamp("metric_date").notNull(),
  // Revenue metrics
  totalRevenue: decimal("total_revenue", { precision: 15, scale: 2 }).default("0"),
  invoicesSent: integer("invoices_sent").default(0),
  invoicesPaid: integer("invoices_paid").default(0),
  paymentsReceived: integer("payments_received").default(0),
  // Activity metrics
  jobsCreated: integer("jobs_created").default(0),
  jobsCompleted: integer("jobs_completed").default(0),
  quotesCreated: integer("quotes_created").default(0),
  quotesAccepted: integer("quotes_accepted").default(0),
  // AI usage
  aiChatsCount: integer("ai_chats_count").default(0),
  tokensUsed: integer("tokens_used").default(0),
  // Customer metrics
  newCustomers: integer("new_customers").default(0),
  repeatCustomers: integer("repeat_customers").default(0),
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => [
  index("idx_business_metrics_user_date").on(table.userId, table.metricDate),
]);

// Beta schemas
export const insertBetaInviteSchema = createInsertSchema(betaInvites).omit({
  id: true,
  createdAt: true,
  usedAt: true,
});

export const insertFeedbackSchema = createInsertSchema(feedbackSubmissions).omit({
  id: true,
  createdAt: true,
  resolvedAt: true,
});

export const insertAnalyticsEventSchema = createInsertSchema(analyticsEvents).omit({
  id: true,
  createdAt: true,
});

export const insertTestimonialSchema = createInsertSchema(testimonials).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  isApproved: true,
  isPublic: true,
});

export const insertRoadmapItemSchema = createInsertSchema(roadmapItems).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  votesCount: true,
  completedDate: true,
});

export const insertFeatureRequestSchema = createInsertSchema(featureRequests).omit({
  id: true,
  createdAt: true,
  votesCount: true,
});

export const insertWaitlistEntrySchema = createInsertSchema(waitlistEntries).omit({
  id: true,
  createdAt: true,
  notified: true,
});

export const insertWaitlistSchema = createInsertSchema(waitlist).omit({
  id: true,
  signupDate: true,
  notified: true,
  priority: true,
  createdAt: true,
  updatedAt: true,
});

export type InsertBetaInvite = z.infer<typeof insertBetaInviteSchema>;
export type BetaInvite = typeof betaInvites.$inferSelect;
export type InsertFeedback = z.infer<typeof insertFeedbackSchema>;
export type Feedback = typeof feedbackSubmissions.$inferSelect;
export type InsertAnalyticsEvent = z.infer<typeof insertAnalyticsEventSchema>;
export type AnalyticsEvent = typeof analyticsEvents.$inferSelect;
export type AnalyticsSession = typeof analyticsSessions.$inferSelect;
export type InsertAnalyticsSession = typeof analyticsSessions.$inferInsert;
export type AnalyticsMetric = typeof analyticsMetrics.$inferSelect;
export type InsertAnalyticsMetric = typeof analyticsMetrics.$inferInsert;
export type BusinessMetric = typeof businessMetrics.$inferSelect;
export type InsertBusinessMetric = typeof businessMetrics.$inferInsert;
export type InsertTestimonial = z.infer<typeof insertTestimonialSchema>;
export type Testimonial = typeof testimonials.$inferSelect;
export type InsertRoadmapItem = z.infer<typeof insertRoadmapItemSchema>;
export type RoadmapItem = typeof roadmapItems.$inferSelect;
export type InsertFeatureRequest = z.infer<typeof insertFeatureRequestSchema>;
export type FeatureRequest = typeof featureRequests.$inferSelect;
export type InsertWaitlistEntry = z.infer<typeof insertWaitlistEntrySchema>;
export type WaitlistEntry = typeof waitlistEntries.$inferSelect;
export type InsertWaitlist = z.infer<typeof insertWaitlistSchema>;
export type SelectWaitlist = typeof waitlist.$inferSelect;
export type RoadmapVote = typeof roadmapVotes.$inferSelect;

// Auth session types
export type AuthSession = typeof authSessions.$inferSelect;
export type InsertAuthSession = typeof authSessions.$inferInsert;

// Magic link token types
export type MagicLinkToken = typeof magicLinkTokens.$inferSelect;
export type InsertMagicLinkToken = typeof magicLinkTokens.$inferInsert;

// Team member types
export type TeamMember = typeof teamMembers.$inferSelect;
export type InsertTeamMember = typeof teamMembers.$inferInsert;
export const insertTeamMemberSchema = createInsertSchema(teamMembers).omit({
  id: true,
  joinedAt: true,
  createdAt: true,
  updatedAt: true,
});

// Team invitation types
export type TeamInvitation = typeof teamInvitations.$inferSelect;
export type InsertTeamInvitation = typeof teamInvitations.$inferInsert;
export const insertTeamInvitationSchema = createInsertSchema(teamInvitations).omit({
  id: true,
  createdAt: true,
  acceptedAt: true,
  cancelledAt: true,
});

// Calendar event types
export type CalendarEvent = typeof calendarEvents.$inferSelect;
export type InsertCalendarEvent = typeof calendarEvents.$inferInsert;
export const insertCalendarEventSchema = createInsertSchema(calendarEvents).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  lastSyncedAt: true,
});

// Calendar sync settings types
export type CalendarSyncSettings = typeof calendarSyncSettings.$inferSelect;
export type InsertCalendarSyncSettings = typeof calendarSyncSettings.$inferInsert;
export const insertCalendarSyncSettingsSchema = createInsertSchema(calendarSyncSettings).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  googleLastSync: true,
  outlookLastSync: true,
});

// Document types
export type Document = typeof documents.$inferSelect;
export type InsertDocument = typeof documents.$inferInsert;
export const insertDocumentSchema = createInsertSchema(documents).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  accessedAt: true,
  downloadCount: true,
});

// Document access log types
export type DocumentAccessLog = typeof documentAccessLogs.$inferSelect;
export type InsertDocumentAccessLog = typeof documentAccessLogs.$inferInsert;

// Automation rule types
export type AutomationRule = typeof automationRules.$inferSelect;
export type InsertAutomationRule = typeof automationRules.$inferInsert;
export const insertAutomationRuleSchema = createInsertSchema(automationRules).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  lastExecutedAt: true,
  executionCount: true,
  successCount: true,
  failureCount: true,
});

// Automation execution types
export type AutomationExecution = typeof automationExecutions.$inferSelect;
export type InsertAutomationExecution = typeof automationExecutions.$inferInsert;
export const insertAutomationExecutionSchema = createInsertSchema(automationExecutions).omit({
  id: true,
  executedAt: true,
});

// Review request types
export type ReviewRequest = typeof reviewRequests.$inferSelect;
export type InsertReviewRequest = typeof reviewRequests.$inferInsert;
export const insertReviewRequestSchema = createInsertSchema(reviewRequests).omit({
  id: true,
  createdAt: true,
  clickedAt: true,
  completedAt: true,
});

// ========== ACCOUNTING & TAX ==========

// User tax settings and preferences
export const taxSettings = pgTable("tax_settings", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").notNull().unique().references(() => users.id, { onDelete: "cascade" }),

  // Business registration
  abn: varchar("abn", { length: 11 }), // Australian Business Number
  gstRegistered: boolean("gst_registered").default(false),
  gstRegistrationDate: timestamp("gst_registration_date"),

  // Tax year settings
  financialYearEnd: varchar("financial_year_end").default("30-06"), // DD-MM format
  accountingBasis: varchar("accounting_basis").default("accrual"), // accrual or cash

  // BAS settings
  basReportingPeriod: varchar("bas_reporting_period").default("quarterly"), // monthly, quarterly, annually
  nextBasDueDate: timestamp("next_bas_due_date"),

  // Tax rates (can be overridden)
  gstRate: decimal("gst_rate", { precision: 5, scale: 2 }).default("10.00"), // 10% GST in Australia

  // Accountant details
  accountantName: varchar("accountant_name"),
  accountantEmail: varchar("accountant_email"),
  accountantPhone: varchar("accountant_phone"),

  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Quarterly BAS (Business Activity Statement) reports
export const basReports = pgTable("bas_reports", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),

  // Reporting period
  periodStart: timestamp("period_start").notNull(),
  periodEnd: timestamp("period_end").notNull(),
  quarter: varchar("quarter").notNull(), // Q1 2025, Q2 2025, etc.

  // GST calculations (all in cents for precision)
  g1TotalSales: decimal("g1_total_sales", { precision: 15, scale: 2 }).default("0"), // Total sales including GST
  g2ExportSales: decimal("g2_export_sales", { precision: 15, scale: 2 }).default("0"), // GST-free exports
  g3OtherGstFree: decimal("g3_other_gst_free", { precision: 15, scale: 2 }).default("0"), // Other GST-free sales
  g4InputTaxed: decimal("g4_input_taxed", { precision: 15, scale: 2 }).default("0"), // Input taxed sales

  g10CapitalPurchases: decimal("g10_capital_purchases", { precision: 15, scale: 2 }).default("0"), // Capital purchases
  g11NonCapitalPurchases: decimal("g11_non_capital_purchases", { precision: 15, scale: 2 }).default("0"), // Non-capital purchases

  // Calculated fields
  g1aGstOnSales: decimal("g1a_gst_on_sales", { precision: 15, scale: 2 }).default("0"), // GST on sales (÷11)
  g1bGstOnPurchases: decimal("g1b_gst_on_purchases", { precision: 15, scale: 2 }).default("0"), // GST credits

  // Final BAS amount
  totalGstPayable: decimal("total_gst_payable", { precision: 15, scale: 2 }).default("0"), // Amount to pay (or refund if negative)

  // Status tracking
  status: varchar("status").notNull().default("draft"), // draft, submitted, paid
  submittedAt: timestamp("submitted_at"),
  paidAt: timestamp("paid_at"),

  // Export
  pdfUrl: text("pdf_url"), // Generated BAS PDF

  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => [
  index("idx_bas_user_period").on(table.userId, table.periodEnd),
]);

// Tax-deductible expense categories
export const taxCategories = pgTable("tax_categories", {
  id: serial("id").primaryKey(),

  // Category details
  name: varchar("name").notNull(), // e.g., "Vehicle Expenses", "Tools & Equipment"
  description: text("description"),
  category: varchar("category").notNull(), // Standard category name

  // Tax treatment
  deductible: boolean("deductible").default(true),
  deductionRate: decimal("deduction_rate", { precision: 5, scale: 2 }).default("100.00"), // Percentage deductible

  // ATO reference
  atoCategory: varchar("ato_category"), // ATO category code
  requiresReceipt: boolean("requires_receipt").default(true),

  // Business rules
  isDefault: boolean("is_default").default(false), // System default categories

  createdAt: timestamp("created_at").defaultNow(),
}, (table) => [
  index("idx_tax_categories_category").on(table.category),
]);

// AI-suggested tax deductions
export const taxDeductions = pgTable("tax_deductions", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),

  // Suggestion details
  suggestionType: varchar("suggestion_type").notNull(), // missing_expense, unclaimed_deduction, tax_tip
  title: varchar("title").notNull(),
  description: text("description").notNull(),

  // Potential savings
  estimatedAmount: decimal("estimated_amount", { precision: 10, scale: 2 }),
  estimatedSaving: decimal("estimated_saving", { precision: 10, scale: 2 }),

  // Related records
  expenseId: integer("expense_id").references(() => expenses.id),
  categoryId: integer("category_id").references(() => taxCategories.id),

  // AI context
  aiReasoning: text("ai_reasoning"), // Why Claude suggested this
  confidence: decimal("confidence", { precision: 5, scale: 2 }), // 0-100

  // User action
  status: varchar("status").default("pending"), // pending, accepted, dismissed
  userNotes: text("user_notes"),
  actionedAt: timestamp("actioned_at"),

  createdAt: timestamp("created_at").defaultNow(),
}, (table) => [
  index("idx_tax_deductions_user_status").on(table.userId, table.status),
]);

// Tax category types
export type TaxCategory = typeof taxCategories.$inferSelect;
export type InsertTaxCategory = typeof taxCategories.$inferInsert;

// Tax settings types
export type TaxSettings = typeof taxSettings.$inferSelect;
export type InsertTaxSettings = typeof taxSettings.$inferInsert;
export const insertTaxSettingsSchema = createInsertSchema(taxSettings).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

// BAS report types
export type BasReport = typeof basReports.$inferSelect;
export type InsertBasReport = typeof basReports.$inferInsert;
export const insertBasReportSchema = createInsertSchema(basReports).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  submittedAt: true,
  paidAt: true,
});

// Tax deduction types
export type TaxDeduction = typeof taxDeductions.$inferSelect;
export type InsertTaxDeduction = typeof taxDeductions.$inferInsert;
