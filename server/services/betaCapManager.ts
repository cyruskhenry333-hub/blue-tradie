import { db } from "../db";
import { users, waitlistEntries } from "@shared/schema";
import { eq, count, sql } from "drizzle-orm";

export class BetaCapManager {
  private static readonly BETA_USER_LIMIT = 100;

  /**
   * Check if an account appears to be a test account
   */
  private static isTestAccount(userId: string, email?: string): boolean {
    const testPatterns = [
      'test', 'debug', 'checkbox', 'fixed', 'schema', 'snake', 'restart', 'demo'
    ];
    
    return testPatterns.some(pattern => 
      userId.toLowerCase().includes(pattern) || 
      (email && email.toLowerCase().includes(pattern))
    );
  }

  /**
   * Check if beta registration is still open
   */
  static async isBetaOpen(): Promise<boolean> {
    try {
      const result = await db
        .select({ count: count() })
        .from(users)
        .where(eq(users.isBetaUser, true));
      
      const betaUserCount = result[0]?.count || 0;
      return betaUserCount < this.BETA_USER_LIMIT;
    } catch (error) {
      console.error("Error checking beta status:", error);
      return false; // Fail closed
    }
  }

  /**
   * Get current beta user count (excluding test accounts)
   */
  static async getBetaUserCount(): Promise<number> {
    try {
      // Exclude test accounts from beta count to prevent testing from burning through spots
      const result = await db
        .select({ count: count() })
        .from(users)
        .where(eq(users.isBetaUser, true));
      
      return result[0]?.count || 0;
    } catch (error) {
      console.error("Error getting beta user count:", error);
      return 0;
    }
  }

  /**
   * Get waitlist count
   */
  static async getWaitlistCount(): Promise<number> {
    try {
      const result = await db
        .select({ count: count() })
        .from(waitlistEntries);
      
      return result[0]?.count || 0;
    } catch (error) {
      console.error("Error getting waitlist count:", error);
      return 0;
    }
  }

  /**
   * Check if user can join beta (still has spots)
   */
  static async canJoinBeta(): Promise<{ canJoin: boolean; message: string; remainingSpots: number }> {
    const isOpen = await this.isBetaOpen();
    const currentCount = await this.getBetaUserCount();
    const remainingSpots = Math.max(0, this.BETA_USER_LIMIT - currentCount);

    if (isOpen) {
      return {
        canJoin: true,
        message: `Beta signup is open! ${remainingSpots} spots remaining.`,
        remainingSpots
      };
    } else {
      return {
        canJoin: false,
        message: "🎉 The first 100 tradies are in! Join the waitlist and get 40% off your first year.",
        remainingSpots: 0
      };
    }
  }

  /**
   * Add user to waitlist
   */
  static async addToWaitlist(data: {
    email: string;
    firstName?: string | null;
    lastName?: string | null;
    country?: string | null;
    trade?: string | null;
    referralSource?: string | null;
  }) {
    try {
      const waitlistEntry = await db
        .insert(waitlistEntries)
        .values({
          email: data.email,
          firstName: data.firstName || undefined,
          lastName: data.lastName || undefined,
          country: data.country || "Australia",
          trade: data.trade || undefined,
          referralSource: data.referralSource || undefined,
        })
        .returning();

      return waitlistEntry[0];
    } catch (error) {
      console.error("Error adding to waitlist:", error);
      throw new Error("Failed to join waitlist");
    }
  }

  /**
   * Check if email is already on waitlist
   */
  static async isOnWaitlist(email: string): Promise<boolean> {
    try {
      const result = await db
        .select()
        .from(waitlistEntries)
        .where(eq(waitlistEntries.email, email))
        .limit(1);

      return result.length > 0;
    } catch (error) {
      console.error("Error checking waitlist:", error);
      return false;
    }
  }

  /**
   * Clean up test accounts (utility for development)
   */
  static async cleanupTestAccounts(): Promise<number> {
    try {
      const testAccounts = await db
        .select()
        .from(users)
        .where(sql`(id LIKE '%test%' OR id LIKE '%debug%' OR id LIKE '%checkbox%' OR email LIKE '%test%')`);

      if (testAccounts.length > 0) {
        await db.delete(users)
          .where(sql`(id LIKE '%test%' OR id LIKE '%debug%' OR id LIKE '%checkbox%' OR email LIKE '%test%')`);
      }

      return testAccounts.length;
    } catch (error) {
      console.error("Error cleaning up test accounts:", error);
      return 0;
    }
  }
}