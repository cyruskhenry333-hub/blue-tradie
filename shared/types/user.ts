import type { User } from "@shared/schema";

// Comprehensive AppUser type that includes all properties used by components
// Based on the users table schema with additional computed properties
export type AppUser = User & {
  // Business setup checklist (these may be accessed as snake_case or camelCase)
  businessDetails?: string | null;
  abnRegistration?: string | null;
  businessBanking?: string | null;
  insurance?: string | null;
  gstRegistration?: string | null;
  taxSetup?: string | null;
  
  // Metrics and analytics properties that components expect
  jobsThisMonth?: number | null;
  totalEarnings?: number | null;
  unpaidInvoices?: number | null;
  completedJobs?: number | null;
  weekNumber?: number | null;
  newCustomers?: number | null;
  insight?: string | null;
  
  // Token and usage info
  tokens_used?: number | null;
  cost_aud?: number | null;
  source?: string | null;
  
  // Additional computed properties
  [key: string]: any; // For dynamic properties
};

// Helper type for components that receive user data
export type UserData = AppUser | null | undefined;

// Safe defaults for user properties
export const DEFAULT_USER_VALUES = {
  country: "Australia",
  isGstRegistered: false,
  isOnboarded: false,
  isBetaUser: false,
  jobsThisMonth: 0,
  totalEarnings: 0,
  unpaidInvoices: 0,
  completedJobs: 0,
  newCustomers: 0,
  tokens_used: 0,
  cost_aud: 0,
} as const;