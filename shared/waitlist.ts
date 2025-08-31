import { pgTable, varchar, text, timestamp, boolean, serial } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Waitlist table for users after beta spots are filled
export const waitlist = pgTable("waitlist", {
  id: serial("id").primaryKey(),
  email: varchar("email").unique().notNull(),
  firstName: varchar("first_name").notNull(),
  lastName: varchar("last_name").notNull(),
  country: varchar("country").default("Australia"),
  reasonForAccess: text("reason_for_access"), // "Why do you want early access?"
  source: varchar("source"), // Where they heard about us
  priority: varchar("priority").default("normal"), // normal, high, urgent (for manual management)
  contacted: boolean("contacted").default(false),
  convertedToBeta: boolean("converted_to_beta").default(false),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Zod schemas for waitlist
export const insertWaitlistSchema = createInsertSchema(waitlist).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  contacted: true,
  convertedToBeta: true,
});

export type InsertWaitlist = z.infer<typeof insertWaitlistSchema>;
export type SelectWaitlist = typeof waitlist.$inferSelect;