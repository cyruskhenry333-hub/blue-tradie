import { pgTable, text, timestamp, integer, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Beta invite codes table
export const betaInvites = pgTable("beta_invites", {
  id: text("id").primaryKey(),
  code: text("code").notNull().unique(),
  email: text("email"),
  isUsed: boolean("is_used").default(false),
  usedBy: text("used_by"),
  createdAt: timestamp("created_at").defaultNow(),
  usedAt: timestamp("used_at"),
});

// Feedback submissions table
export const feedbackSubmissions = pgTable("feedback_submissions", {
  id: text("id").primaryKey(),
  userId: text("user_id").notNull(),
  type: text("type").notNull(), // "bug", "feature", "general"
  title: text("title").notNull(),
  description: text("description").notNull(),
  priority: text("priority").default("medium"), // "low", "medium", "high"
  status: text("status").default("open"), // "open", "in-progress", "resolved", "closed"
  createdAt: timestamp("created_at").defaultNow(),
  resolvedAt: timestamp("resolved_at"),
});

// Analytics tracking table
export const analyticsEvents = pgTable("analytics_events", {
  id: text("id").primaryKey(),
  userId: text("user_id"),
  eventType: text("event_type").notNull(), // "login", "invoice_created", "chat_message", etc.
  eventData: text("event_data"), // JSON string for additional data
  createdAt: timestamp("created_at").defaultNow(),
});

// Beta invite schema
export const insertBetaInviteSchema = createInsertSchema(betaInvites).omit({
  id: true,
  createdAt: true,
  usedAt: true,
});

export type InsertBetaInvite = z.infer<typeof insertBetaInviteSchema>;
export type BetaInvite = typeof betaInvites.$inferSelect;

// Feedback schema
export const insertFeedbackSchema = createInsertSchema(feedbackSubmissions).omit({
  id: true,
  createdAt: true,
  resolvedAt: true,
});

export type InsertFeedback = z.infer<typeof insertFeedbackSchema>;
export type Feedback = typeof feedbackSubmissions.$inferSelect;

// Analytics schema
export const insertAnalyticsEventSchema = createInsertSchema(analyticsEvents).omit({
  id: true,
  createdAt: true,
});

export type InsertAnalyticsEvent = z.infer<typeof insertAnalyticsEventSchema>;
export type AnalyticsEvent = typeof analyticsEvents.$inferSelect;