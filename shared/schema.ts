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

// Token usage tracking table
export const tokenUsage = pgTable("token_usage", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id),
  tokensUsed: integer("tokens_used").notNull(),
  costAud: numeric("cost_aud", { precision: 10, scale: 6 }).notNull(),
  agentType: varchar("agent_type", { length: 50 }),
  source: varchar("source", { length: 20 }).default("openai"), // 'cached' or 'openai'
  timestamp: timestamp("timestamp").defaultNow(),
});

export type AIResponse = typeof aiResponses.$inferSelect;
export type InsertAIResponse = typeof aiResponses.$inferInsert;
export type TokenUsage = typeof tokenUsage.$inferSelect;
export type InsertTokenUsage = typeof tokenUsage.$inferInsert;
export type InsertJob = typeof jobs.$inferInsert;
export type Job = typeof jobs.$inferSelect;
export type InsertTrialEmail = typeof trialEmails.$inferInsert;
export type TrialEmail = typeof trialEmails.$inferSelect;
export type InsertSystemSetting = typeof systemSettings.$inferInsert;
export type SystemSetting = typeof systemSettings.$inferSelect;

export type InsertInvoice = typeof invoices.$inferInsert;
export type Invoice = typeof invoices.$inferSelect;
export type InsertExpense = typeof expenses.$inferInsert;
export type Expense = typeof expenses.$inferSelect;
export type InsertChatMessage = typeof chatMessages.$inferInsert;
export type ChatMessage = typeof chatMessages.$inferSelect;

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

export const analyticsEvents = pgTable("analytics_events", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id"),
  eventType: varchar("event_type").notNull(),
  eventData: text("event_data"), // JSON string
  createdAt: timestamp("created_at").defaultNow(),
});

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
