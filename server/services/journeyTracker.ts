import { db } from '../db';
import { users, invoices, jobs } from '@shared/schema';
import { eq } from 'drizzle-orm';

export interface MilestoneUpdate {
  userId: string;
  milestoneId: string;
  completed: boolean;
}

// Define stage milestones
const STAGE_MILESTONES = {
  1: ["business_registered", "profile_completed", "first_ai_chat", "country_selected"],
  2: ["first_invoice_created", "goals_set", "goals_onboarding_completed", "logo_created", "marketing_started"],
  3: ["multiple_jobs_completed", "cash_flow_understood", "smart_goals_set", "regular_ai_usage"],
  4: ["consistent_income", "expense_tracking", "family_goals_set", "referrals_made"],
  5: ["business_pride", "family_support", "stress_reduced", "mentor_others"]
};

export class JourneyTracker {
  
  static async updateMilestone({ userId, milestoneId, completed }: MilestoneUpdate) {
    // Get current user data
    const [user] = await db.select().from(users).where(eq(users.id, userId));
    if (!user) return null;

    const currentMilestones = (user.completedMilestones as string[]) || [];
    
    let updatedMilestones;
    if (completed && !currentMilestones.includes(milestoneId)) {
      // Add milestone
      updatedMilestones = [...currentMilestones, milestoneId];
    } else if (!completed && currentMilestones.includes(milestoneId)) {
      // Remove milestone
      updatedMilestones = currentMilestones.filter(m => m !== milestoneId);
    } else {
      // No change needed
      return user;
    }

    // Calculate new stage based on completed milestones
    const newStage = this.calculateStage(updatedMilestones);
    
    // Update user record
    const [updatedUser] = await db
      .update(users)
      .set({
        completedMilestones: updatedMilestones,
        currentJourneyStage: newStage,
        lastStageUpdate: newStage !== user.currentJourneyStage ? new Date() : user.lastStageUpdate
      })
      .where(eq(users.id, userId))
      .returning();

    return updatedUser;
  }

  static calculateStage(completedMilestones: string[]): number {
    // Start from highest stage and work down
    for (let stage = 5; stage >= 1; stage--) {
      const stageMilestones = STAGE_MILESTONES[stage as keyof typeof STAGE_MILESTONES];
      const completedInStage = stageMilestones.filter(m => completedMilestones.includes(m)).length;
      const requiredForStage = Math.ceil(stageMilestones.length * 0.75); // 75% completion required
      
      if (completedInStage >= requiredForStage) {
        return Math.min(stage + 1, 5); // Move to next stage (max 5)
      }
    }
    return 1; // Default to stage 1
  }

  static async markFirstAiChatComplete(userId: string) {
    try {
      const [user] = await db.select().from(users).where(eq(users.id, userId));
      if (!user) return;

      const currentMilestones = (user.completedMilestones as string[]) || [];
      
      // Check if first_ai_chat milestone is already completed
      if (currentMilestones.includes("first_ai_chat")) {
        return; // Already completed
      }

      // Add first_ai_chat milestone
      const updatedMilestones = [...currentMilestones, "first_ai_chat"];
      const newStage = this.calculateStage(updatedMilestones);
      
      await db
        .update(users)
        .set({
          completedMilestones: updatedMilestones,
          currentJourneyStage: newStage,
          lastStageUpdate: newStage !== user.currentJourneyStage ? new Date() : user.lastStageUpdate
        })
        .where(eq(users.id, userId));
    } catch (error) {
      console.error("Error marking first AI chat complete:", error);
    }
  }

  static async autoDetectMilestones(userId: string) {
    // Get user data to auto-detect completed milestones
    const [user] = await db.select().from(users).where(eq(users.id, userId));
    if (!user) return;

    const autoDetectedMilestones: string[] = [];

    // Auto-detect based on user data
    if (user.country) autoDetectedMilestones.push("country_selected");
    if (user.businessName || user.trade) autoDetectedMilestones.push("business_registered");
    
    // Profile completion requires comprehensive business setup including branding
    // Business basics: business name, trade, service area, and onboarding completion
    const hasBusinessBasics = user.businessName && user.trade && user.serviceArea && user.isOnboarded;
    
    // Check for logo/branding completion (businessLogo field indicates logo has been created/saved)
    const hasLogoBranding = user.businessLogo || false; // Will be added to schema
    
    // Profile is only complete when user has both business basics AND logo/branding
    if (hasBusinessBasics && hasLogoBranding) {
      autoDetectedMilestones.push("profile_completed");
    }
    
    // Separate milestone for logo creation
    if (hasLogoBranding) {
      autoDetectedMilestones.push("logo_created");
    }
    
    // Debug goals detection
    console.log("Goals detection debug:", {
      userId,
      hasGoals: !!user.goals,
      goalsType: typeof user.goals,
      goalsKeys: user.goals ? Object.keys(user.goals as any) : [],
      goalsData: user.goals
    });
    
    if (user.goals && Object.keys(user.goals as any).length > 0) {
      console.log("Adding goals_set milestone for user:", userId);
      autoDetectedMilestones.push("goals_set");
    }
    
    // Check for invoices
    const userInvoices = await db.select().from(invoices).where(eq(invoices.userId, userId));
    if (userInvoices.length > 0) {
      autoDetectedMilestones.push("first_invoice_created");
    }
    
    // Check for jobs  
    const userJobs = await db.select().from(jobs).where(eq(jobs.userId, userId));
    if (userJobs.length > 0) {
      autoDetectedMilestones.push("first_job_created");
    }

    
    const currentMilestones = (user.completedMilestones as string[]) || [];
    const newMilestones = Array.from(new Set([...currentMilestones, ...autoDetectedMilestones]));
    
    if (newMilestones.length > currentMilestones.length) {
      const newStage = this.calculateStage(newMilestones);
      
      await db
        .update(users)
        .set({
          completedMilestones: newMilestones,
          currentJourneyStage: newStage,
          lastStageUpdate: newStage !== user.currentJourneyStage ? new Date() : user.lastStageUpdate
        })
        .where(eq(users.id, userId));
    }
  }

  static getStageName(stage: number): string {
    const stageNames = ["", "Starting Out", "Getting Set Up", "Gaining Confidence", "Momentum Builder", "Confident Owner"];
    return stageNames[stage] || "Starting Out";
  }

  static getStageProgress(stage: number, completedMilestones: string[]): number {
    const stageMilestones = STAGE_MILESTONES[stage as keyof typeof STAGE_MILESTONES] || [];
    const completedInStage = stageMilestones.filter(m => completedMilestones.includes(m)).length;
    return stageMilestones.length > 0 ? (completedInStage / stageMilestones.length) * 100 : 0;
  }
}