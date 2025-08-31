import { db } from "../db";
import { users, trialEmails, systemSettings, type User, type InsertTrialEmail } from "@shared/schema";
import { eq, and, gte, lte } from "drizzle-orm";

export class TrialService {
  
  // Start a free trial for a user
  async startTrial(userId: string, customDurationDays?: number): Promise<User | null> {
    const trialDuration = customDurationDays || 14;
    const startDate = new Date();
    const endDate = new Date(startDate.getTime() + (trialDuration * 24 * 60 * 60 * 1000));
    
    try {
      const [updatedUser] = await db
        .update(users)
        .set({
          trialStartDate: startDate,
          trialEndDate: endDate,
          trialDurationDays: trialDuration,
          isTrialActive: true,
          hasUsedTrial: true,
          subscriptionStatus: "trial",
          updatedAt: new Date(),
        })
        .where(eq(users.id, userId))
        .returning();
        
      return updatedUser || null;
    } catch (error) {
      console.error("Error starting trial:", error);
      return null;
    }
  }
  
  // Check if user is eligible for trial (hasn't used trial before and not a beta user)
  async isEligibleForTrial(userId: string): Promise<boolean> {
    try {
      const [user] = await db
        .select({
          hasUsedTrial: users.hasUsedTrial,
          isBetaUser: users.isBetaUser,
          hasLifetimeBetaAccess: users.hasLifetimeBetaAccess,
        })
        .from(users)
        .where(eq(users.id, userId));
        
      if (!user) return false;
      
      // Beta users with lifetime access don't need trials
      if (user.isBetaUser && user.hasLifetimeBetaAccess) return false;
      
      // Users who have already used trial are not eligible
      return !user.hasUsedTrial;
    } catch (error) {
      console.error("Error checking trial eligibility:", error);
      return false;
    }
  }
  
  // Get trial status for a user
  async getTrialStatus(userId: string): Promise<{
    isTrialActive: boolean;
    daysRemaining: number;
    trialEndDate: Date | null;
    isEligible: boolean;
  }> {
    try {
      const [user] = await db
        .select({
          isTrialActive: users.isTrialActive,
          trialEndDate: users.trialEndDate,
          hasUsedTrial: users.hasUsedTrial,
          isBetaUser: users.isBetaUser,
          hasLifetimeBetaAccess: users.hasLifetimeBetaAccess,
        })
        .from(users)
        .where(eq(users.id, userId));
        
      if (!user) {
        return { isTrialActive: false, daysRemaining: 0, trialEndDate: null, isEligible: false };
      }
      
      const isEligible = await this.isEligibleForTrial(userId);
      const now = new Date();
      let daysRemaining = 0;
      
      if (user.isTrialActive && user.trialEndDate) {
        const timeDiff = user.trialEndDate.getTime() - now.getTime();
        daysRemaining = Math.max(0, Math.ceil(timeDiff / (1000 * 3600 * 24)));
        
        // Auto-expire trial if time has passed
        if (daysRemaining === 0) {
          await this.expireTrial(userId);
        }
      }
      
      return {
        isTrialActive: (user.isTrialActive || false) && daysRemaining > 0,
        daysRemaining,
        trialEndDate: user.trialEndDate,
        isEligible,
      };
    } catch (error) {
      console.error("Error getting trial status:", error);
      return { isTrialActive: false, daysRemaining: 0, trialEndDate: null, isEligible: false };
    }
  }
  
  // Expire trial and lock account
  async expireTrial(userId: string): Promise<boolean> {
    try {
      await db
        .update(users)
        .set({
          isTrialActive: false,
          subscriptionStatus: "expired",
          updatedAt: new Date(),
        })
        .where(eq(users.id, userId));
        
      return true;
    } catch (error) {
      console.error("Error expiring trial:", error);
      return false;
    }
  }
  
  // Get users due for trial reminder emails
  async getUsersForTrialEmails(): Promise<{
    day10Users: User[];
    day13Users: User[];
    day14Users: User[];
  }> {
    const now = new Date();
    const day10Date = new Date(now.getTime() + (4 * 24 * 60 * 60 * 1000)); // 4 days from now
    const day13Date = new Date(now.getTime() + (1 * 24 * 60 * 60 * 1000)); // 1 day from now
    const expiredDate = new Date(now.getTime() - (1 * 60 * 60 * 1000)); // 1 hour ago
    
    try {
      // Day 10 reminder (4 days before trial ends)
      const day10Users = await db
        .select()
        .from(users)
        .where(
          and(
            eq(users.isTrialActive, true),
            gte(users.trialEndDate, day10Date),
            lte(users.trialEndDate, new Date(day10Date.getTime() + (24 * 60 * 60 * 1000)))
          )
        );
        
      // Day 13 reminder (1 day before trial ends)  
      const day13Users = await db
        .select()
        .from(users)
        .where(
          and(
            eq(users.isTrialActive, true),
            gte(users.trialEndDate, day13Date),
            lte(users.trialEndDate, new Date(day13Date.getTime() + (24 * 60 * 60 * 1000)))
          )
        );
        
      // Day 14 - trial expired, send upgrade prompt
      const day14Users = await db
        .select()
        .from(users)
        .where(
          and(
            eq(users.isTrialActive, true),
            lte(users.trialEndDate, now)
          )
        );
        
      return { day10Users, day13Users, day14Users };
    } catch (error) {
      console.error("Error getting users for trial emails:", error);
      return { day10Users: [], day13Users: [], day14Users: [] };
    }
  }
  
  // Track that a trial email was sent
  async recordTrialEmail(userId: string, emailType: "day_10_reminder" | "day_13_final" | "day_14_lockout"): Promise<boolean> {
    try {
      await db.insert(trialEmails).values({
        userId,
        emailType,
        emailStatus: "sent",
      });
      
      return true;
    } catch (error) {
      console.error("Error recording trial email:", error);
      return false;
    }
  }
  
  // Check if email was already sent to prevent duplicates
  async wasEmailSent(userId: string, emailType: string): Promise<boolean> {
    try {
      const [email] = await db
        .select()
        .from(trialEmails)
        .where(
          and(
            eq(trialEmails.userId, userId),
            eq(trialEmails.emailType, emailType)
          )
        )
        .limit(1);
        
      return !!email;
    } catch (error) {
      console.error("Error checking if email was sent:", error);
      return false;
    }
  }
  
  // Get trial conversion analytics
  async getTrialAnalytics(): Promise<{
    activeTrials: number;
    expiredTrials: number;
    conversions: number;
    conversionRate: number;
  }> {
    try {
      const allUsers = await db.select().from(users);
      
      const activeTrials = allUsers.filter(u => u.isTrialActive).length;
      const expiredTrials = allUsers.filter(u => u.hasUsedTrial && !u.isTrialActive && u.subscriptionStatus === "expired").length;
      const conversions = allUsers.filter(u => u.hasUsedTrial && u.subscriptionStatus === "active").length;
      const totalTrials = activeTrials + expiredTrials + conversions;
      const conversionRate = totalTrials > 0 ? (conversions / totalTrials) * 100 : 0;
      
      return {
        activeTrials,
        expiredTrials,
        conversions,
        conversionRate: Math.round(conversionRate * 100) / 100,
      };
    } catch (error) {
      console.error("Error getting trial analytics:", error);
      return { activeTrials: 0, expiredTrials: 0, conversions: 0, conversionRate: 0 };
    }
  }
  
  // Admin: Update trial duration setting
  async updateTrialDuration(durationDays: number): Promise<boolean> {
    try {
      await db
        .insert(systemSettings)
        .values({
          settingKey: "trial_duration_days",
          settingValue: durationDays.toString(),
          description: "Default trial duration in days for new users",
        })
        .onConflictDoUpdate({
          target: systemSettings.settingKey,
          set: {
            settingValue: durationDays.toString(),
            updatedAt: new Date(),
          },
        });
        
      return true;
    } catch (error) {
      console.error("Error updating trial duration:", error);
      return false;
    }
  }
  
  // Get system setting value
  async getSystemSetting(key: string, defaultValue: string = ""): Promise<string> {
    try {
      const [setting] = await db
        .select()
        .from(systemSettings)
        .where(eq(systemSettings.settingKey, key));
        
      return setting?.settingValue || defaultValue;
    } catch (error) {
      console.error("Error getting system setting:", error);
      return defaultValue;
    }
  }
}

export const trialService = new TrialService();