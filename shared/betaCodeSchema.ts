import {
  pgTable,
  text,
  varchar,
  timestamp,
  serial,
  boolean,
  integer,
  jsonb,
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { users } from "./schema";

// Beta invite codes management
export const betaCodes = pgTable("beta_codes", {
  id: serial("id").primaryKey(),
  code: varchar("code", { length: 20 }).unique().notNull(), // e.g., BT-2025-001
  description: text("description"), // Who it's for, what campaign, etc.
  isActive: boolean("is_active").default(true),
  maxUses: integer("max_uses").default(1), // How many times it can be used
  currentUses: integer("current_uses").default(0),
  createdBy: varchar("created_by").notNull(), // Admin user ID
  usedBy: varchar("used_by"), // User ID who used it
  usedAt: timestamp("used_at"),
  createdAt: timestamp("created_at").defaultNow(),
  expiresAt: timestamp("expires_at"), // Optional expiry date
});

// Beta consent tracking
export const betaConsent = pgTable("beta_consent", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  consentText: text("consent_text").notNull(), // The exact consent text they agreed to
  ipAddress: varchar("ip_address"),
  userAgent: text("user_agent"),
  agreedAt: timestamp("agreed_at").defaultNow(),
});

// Admin audit log for sensitive operations
export const adminAuditLog = pgTable("admin_audit_log", {
  id: serial("id").primaryKey(),
  adminUserId: varchar("admin_user_id").notNull(),
  action: varchar("action").notNull(), // "view_user_data", "create_beta_code", "revoke_beta_code"
  targetUserId: varchar("target_user_id"), // If action was on a specific user
  details: jsonb("details"), // Additional context
  ipAddress: varchar("ip_address"),
  timestamp: timestamp("timestamp").defaultNow(),
});

export const insertBetaCodeSchema = createInsertSchema(betaCodes);
export const insertBetaConsentSchema = createInsertSchema(betaConsent);
export const insertAdminAuditLogSchema = createInsertSchema(adminAuditLog);

export type BetaCode = typeof betaCodes.$inferSelect;
export type InsertBetaCode = z.infer<typeof insertBetaCodeSchema>;
export type BetaConsent = typeof betaConsent.$inferSelect;
export type InsertBetaConsent = z.infer<typeof insertBetaConsentSchema>;
export type AdminAuditLog = typeof adminAuditLog.$inferSelect;
export type InsertAdminAuditLog = z.infer<typeof insertAdminAuditLogSchema>;