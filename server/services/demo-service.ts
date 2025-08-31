import { storage } from "../storage";
import type { User } from "@shared/schema";

export interface DemoUserConfig {
  email: string;
  firstName: string;
  lastName: string;
  businessName: string;
  trade: string;
  serviceArea: string;
  country: string;
  durationDays: number;
  tokenLimit: number;
}

export class DemoService {
  // Create a new demo user with time and token limits
  async createDemoUser(config: DemoUserConfig): Promise<User> {
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + config.durationDays);

    const demoUser = await storage.upsertUser({
      id: `demo_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      email: config.email,
      firstName: config.firstName,
      lastName: config.lastName,
      businessName: config.businessName,
      trade: config.trade,
      serviceArea: config.serviceArea,
      country: config.country,
      isDemoUser: true,
      demoExpiresAt: expiresAt,
      demoTokensUsed: 0,
      demoTokenLimit: config.tokenLimit,
      demoStatus: "active",
      isOnboarded: true,
      isBetaUser: true,
      hasLifetimeBetaAccess: false,
    });

    // Send notification email about new demo user
    await this.notifyDemoUserCreated(demoUser);
    
    return demoUser;
  }

  // Check if demo user can use tokens
  async canUseTokens(userId: string, tokensNeeded: number = 1): Promise<{ canUse: boolean; reason?: string }> {
    const user = await storage.getUser(userId);
    
    if (!user || !user.isDemoUser) {
      return { canUse: true }; // Not a demo user, no restrictions
    }

    // Check if demo has expired
    if (user.demoExpiresAt && new Date() > user.demoExpiresAt) {
      await storage.updateUser(userId, { demoStatus: "expired" });
      return { canUse: false, reason: "Demo period has expired" };
    }

    // Check token limit
    const tokensUsed = user.demoTokensUsed || 0;
    const tokenLimit = user.demoTokenLimit || 1000;
    
    if (tokensUsed + tokensNeeded > tokenLimit) {
      return { canUse: false, reason: `Token limit exceeded. Used: ${tokensUsed}/${tokenLimit}` };
    }

    return { canUse: true };
  }

  // Track token usage for demo user
  async trackTokenUsage(userId: string, tokensUsed: number): Promise<void> {
    const user = await storage.getUser(userId);
    
    if (!user || !user.isDemoUser) {
      return; // Not a demo user, no tracking needed
    }

    const currentUsage = user.demoTokensUsed || 0;
    const newUsage = currentUsage + tokensUsed;
    
    await storage.updateUser(userId, { 
      demoTokensUsed: newUsage 
    });

    // Check if approaching limit (90% usage)
    const tokenLimit = user.demoTokenLimit || 1000;
    if (newUsage >= tokenLimit * 0.9) {
      await this.notifyTokenLimitApproaching(user, newUsage, tokenLimit);
    }
  }

  // Get demo user status
  async getDemoStatus(userId: string): Promise<{
    isDemoUser: boolean;
    daysRemaining?: number;
    tokensUsed?: number;
    tokenLimit?: number;
    tokensRemaining?: number;
    status?: string;
  }> {
    const user = await storage.getUser(userId);
    
    if (!user || !user.isDemoUser) {
      return { isDemoUser: false };
    }

    const daysRemaining = user.demoExpiresAt 
      ? Math.max(0, Math.ceil((user.demoExpiresAt.getTime() - Date.now()) / (1000 * 60 * 60 * 24)))
      : undefined;

    const tokensUsed = user.demoTokensUsed || 0;
    const tokenLimit = user.demoTokenLimit || 1000;
    const tokensRemaining = Math.max(0, tokenLimit - tokensUsed);

    return {
      isDemoUser: true,
      daysRemaining,
      tokensUsed,
      tokenLimit,
      tokensRemaining,
      status: user.demoStatus || "active",
    };
  }

  // Extend demo period
  async extendDemo(userId: string, additionalDays: number, additionalTokens: number = 0): Promise<User> {
    const user = await storage.getUser(userId);
    
    if (!user || !user.isDemoUser) {
      throw new Error("User is not a demo user");
    }

    const currentExpiry = user.demoExpiresAt || new Date();
    const newExpiry = new Date(currentExpiry);
    newExpiry.setDate(newExpiry.getDate() + additionalDays);

    const newTokenLimit = (user.demoTokenLimit || 1000) + additionalTokens;

    return await storage.updateUser(userId, {
      demoExpiresAt: newExpiry,
      demoTokenLimit: newTokenLimit,
      demoStatus: "active"
    });
  }

  // Award UGC bonus tokens and benefits
  async awardUGCBonus(userId: string, ugcType: string, bonusTokens: number): Promise<User> {
    const user = await storage.getUser(userId);
    
    if (!user || !user.isDemoUser) {
      throw new Error("User is not a demo user");
    }

    const currentContributions = user.ugcContributions as any || {};
    const newContributions = {
      ...currentContributions,
      [ugcType]: {
        date: new Date(),
        bonusTokens,
        status: 'approved'
      }
    };

    const totalBonusTokens = (user.ugcBonusTokens || 0) + bonusTokens;
    const newTokenLimit = (user.demoTokenLimit || 1000) + bonusTokens;

    // Award founding member status for substantial UGC
    const foundingMemberStatus = totalBonusTokens >= 500 || ugcType === 'case_study';

    return await storage.updateUser(userId, {
      ugcContributions: newContributions,
      ugcBonusTokens: totalBonusTokens,
      demoTokenLimit: newTokenLimit,
      ugcFoundingMemberStatus: foundingMemberStatus
    });
  }

  // Suspend demo user
  async suspendDemo(userId: string, reason: string): Promise<User> {
    return await storage.updateUser(userId, {
      demoStatus: "suspended"
    });
  }

  // Get all active demo users
  async getActiveDemoUsers(): Promise<User[]> {
    // This would need to be implemented in storage
    // For now, return empty array
    return [];
  }

  private async notifyDemoUserCreated(user: User): Promise<void> {
    // Send email notification about new demo user
    console.log(`Demo user created: ${user.email} - Expires: ${user.demoExpiresAt}`);
    // TODO: Implement actual email notification
  }

  private async notifyTokenLimitApproaching(user: User, tokensUsed: number, tokenLimit: number): Promise<void> {
    console.log(`Demo user ${user.email} approaching token limit: ${tokensUsed}/${tokenLimit}`);
    // TODO: Implement actual email notification
  }
}

export const demoService = new DemoService();