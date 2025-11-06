import {
  users,
  jobs,
  invoices,
  expenses,
  chatMessages,
  testimonials,
  roadmapItems,
  roadmapVotes,
  featureRequests,
  publicWaitlistTable,
  type User,
  type UpsertUser,
  type Job,
  type InsertJob,
  type Invoice,
  type InsertInvoice,
  type Expense,
  type InsertExpense,
  type ChatMessage,
  type InsertChatMessage,
  type Testimonial,
  type InsertTestimonial,
  type RoadmapItem,
  type InsertRoadmapItem,
  type RoadmapVote,
  type FeatureRequest,
  type InsertFeatureRequest,
  type PublicWaitlist,
  type InsertPublicWaitlist,
} from "@shared/schema";
import { db } from "./db";
import { eq, desc, and, gte, lte, lt, sql, like, count } from "drizzle-orm";

export interface IStorage {
  // User operations
  getUser(id: string): Promise<User | undefined>;
  upsertUser(user: UpsertUser): Promise<User>;
  updateUser(id: string, updates: Partial<User>): Promise<User>;
  createOrUpdateDemoUser(userId: string): Promise<User>;
  updateUserOnboarding(id: string, data: { businessName?: string; trade?: string; serviceArea?: string; country?: string; isGstRegistered?: boolean; isOnboarded?: boolean; businessType?: string; experience?: string; currentRevenue?: string }): Promise<User>;
  updateUserStripeInfo(id: string, data: { stripeCustomerId?: string; stripeSubscriptionId?: string }): Promise<User>;
  updateUserGoals(id: string, goalsData: any): Promise<User>;
  updateUserProfile(id: string, data: { communicationTone?: string; [key: string]: any }): Promise<User>;
  
  // Job operations
  createJob(job: InsertJob): Promise<Job>;
  getJobsByUser(userId: string): Promise<Job[]>;
  getTodaysJobs(userId: string): Promise<Job[]>;
  updateJob(id: number, updates: Partial<Job>): Promise<Job>;
  
  // Invoice operations
  createInvoice(invoice: Omit<InsertInvoice, 'invoiceNumber' | 'yearSequence'>): Promise<Invoice>;
  getInvoicesByUser(userId: string): Promise<Invoice[]>;
  getInvoiceById(id: number): Promise<Invoice | undefined>;
  getOutstandingInvoices(userId: string): Promise<Invoice[]>;
  getInvoiceCountForYear(userId: string, year: number): Promise<number>;
  updateInvoiceStatus(id: number, status: string, paidDate?: Date): Promise<Invoice>;
  updateInvoice(id: number, updates: Partial<Invoice>): Promise<Invoice>;
  updateInvoicePaymentStatus(id: number, paymentStatus: string, stripePaymentIntentId?: string, paidAt?: Date): Promise<Invoice>;
  
  // Expense operations
  createExpense(userId: string, expense: InsertExpense): Promise<Expense>;
  getExpensesByUser(userId: string): Promise<Expense[]>;
  getExpensesInDateRange(userId: string, startDate: Date, endDate: Date): Promise<Expense[]>;
  updateExpense(expenseId: number, expense: Partial<InsertExpense>): Promise<Expense>;
  deleteExpense(userId: string, expenseId: number): Promise<void>;
  
  // Chat operations
  createChatMessage(message: InsertChatMessage): Promise<ChatMessage>;
  getChatHistory(userId: string, agentType: string, limit?: number): Promise<ChatMessage[]>;
  
  // Analytics
  getWeeklyIncome(userId: string): Promise<number>;
  getMonthlyStats(userId: string): Promise<{
    totalIncome: number;
    totalExpenses: number;
    jobsCompleted: number;
    jobsThisMonth: number;
    outstandingAmount: number;
  }>;
  getYearEndSummary(userId: string, year?: number): Promise<{
    totalIncome: number;
    totalGst: number;
    jobsCompleted: number;
    invoicesCount: number;
    totalExpenses: number;
    gstClaimableExpenses: number;
  }>;
  
  // Beta analytics
  getBetaAnalytics(): Promise<{
    totalUsers: number;
    betaUsers: number;
    usersByCountry: { Australia: number; "New Zealand": number };
    contractDownloads: { Australia: number; "New Zealand": number };
    agentUsageByRegion: {
      Australia: { accountant: number; legal: number; marketing: number; coach: number };
      "New Zealand": { accountant: number; legal: number; marketing: number; coach: number };
    };
  }>;
  getBetaUserCount(): Promise<number>;
  
  // Public waitlist operations
  addToPublicWaitlist(data: InsertPublicWaitlist): Promise<PublicWaitlist>;
}

export class DatabaseStorage implements IStorage {
  // User operations
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async upsertUser(userData: UpsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(userData)
      .onConflictDoUpdate({
        target: users.id,
        set: {
          ...userData,
          updatedAt: new Date(),
        },
      })
      .returning();
    return user;
  }

  async createOrUpdateDemoUser(userId: string): Promise<User> {
    try {
      // First check if user already exists
      const existingUser = await this.getUser(userId);
      if (existingUser) {
        console.log(`[STORAGE] Demo user ${userId} already exists`);
        return existingUser;
      }

      // Create new demo user
      const userData = {
        id: userId,
        email: `${userId}@bluetradie.com`,
        firstName: 'Cy',
        lastName: 'Electrical',
        businessName: 'Cy Electrical',
        trade: 'Electrical',
        serviceArea: 'Sydney',
        country: 'Australia',
        isDemoUser: true,
        demoExpiresAt: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
        demoTokensUsed: 0,
        demoTokenLimit: 1000000,
        demoStatus: 'active',
        isOnboarded: true,
        isBetaUser: true,
        hasLifetimeBetaAccess: false,
        subscriptionTier: 'demo',
        tokenBalance: 1000000,
        completedMilestones: [],
        createdAt: new Date(),
        updatedAt: new Date()
      };

      const result = await db.insert(users).values(userData as any).returning();
      console.log(`[STORAGE] Created new demo user: ${userId}`);
      return result[0];
    } catch (error) {
      console.error(`[STORAGE] Error creating demo user ${userId}:`, error);
      throw error;
    }
  }

  async updateUser(id: string, updates: Partial<User>): Promise<User> {
    const [user] = await db
      .update(users)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(users.id, id))
      .returning();
    return user;
  }

  async updateUserOnboarding(id: string, data: { businessName?: string; trade?: string; serviceArea?: string; country?: string; isGstRegistered?: boolean; isOnboarded?: boolean; businessType?: string; experience?: string; currentRevenue?: string }): Promise<User> {
    const [user] = await db
      .update(users)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(users.id, id))
      .returning();
    return user;
  }

  async updateUserStripeInfo(id: string, data: { stripeCustomerId?: string; stripeSubscriptionId?: string }): Promise<User> {
    const [user] = await db
      .update(users)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(users.id, id))
      .returning();
    return user;
  }

  async updateUserGoals(id: string, goalsData: any): Promise<User> {
    const [user] = await db
      .update(users)
      .set({ 
        userType: goalsData.userType,
        gender: goalsData.gender,
        businessStructure: goalsData.businessStructure,
        goals: goalsData.goals,
        visionSentence: goalsData.visionSentence,
        visionBoardEnabled: goalsData.visionBoardEnabled,
        mateCheckInsEnabled: goalsData.mateCheckInsEnabled,
        tonePreference: goalsData.gender === 'female' ? 'friendly' : goalsData.gender === 'other' ? 'professional' : 'casual',
        updatedAt: new Date() 
      })
      .where(eq(users.id, id))
      .returning();
    return user;
  }

  async updateUserProfile(id: string, data: { communicationTone?: string; [key: string]: any }): Promise<User> {
    const [user] = await db
      .update(users)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(users.id, id))
      .returning();
    return user;
  }

  async getAllUsers(options: { offset: number; limit: number; search: string }): Promise<User[]> {
    let query = db.select().from(users);
    
    if (options.search) {
      query = query.where(
        sql`${users.email} ILIKE ${`%${options.search}%`} OR ${users.firstName} ILIKE ${`%${options.search}%`} OR ${users.lastName} ILIKE ${`%${options.search}%`} OR ${users.businessName} ILIKE ${`%${options.search}%`}`
      );
    }
    
    return query.offset(options.offset).limit(options.limit).orderBy(desc(users.createdAt));
  }

  async getUserCount(search: string): Promise<number> {
    let query = db.select({ count: count() }).from(users);
    
    if (search) {
      query = query.where(
        sql`${users.email} ILIKE ${`%${search}%`} OR ${users.firstName} ILIKE ${`%${search}%`} OR ${users.lastName} ILIKE ${`%${search}%`} OR ${users.businessName} ILIKE ${`%${search}%`}`
      );
    }
    
    const [result] = await query;
    return result.count;
  }

  async deleteUser(userId: string): Promise<void> {
    // Delete user and cascade delete related data
    // Note: In a real production app, you might want to soft delete or archive instead
    await db.delete(users).where(eq(users.id, userId));
  }

  // Job operations
  async createJob(job: InsertJob): Promise<Job> {
    const [newJob] = await db.insert(jobs).values(job).returning();
    return newJob;
  }

  async getJobsByUser(userId: string): Promise<Job[]> {
    return await db.select().from(jobs).where(eq(jobs.userId, userId)).orderBy(desc(jobs.scheduledDate));
  }

  async getTodaysJobs(userId: string): Promise<Job[]> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    return await db
      .select()
      .from(jobs)
      .where(
        and(
          eq(jobs.userId, userId),
          gte(jobs.scheduledDate, today),
          lte(jobs.scheduledDate, tomorrow)
        )
      )
      .orderBy(jobs.scheduledDate);
  }

  async updateJob(id: number, updates: Partial<Job>): Promise<Job> {
    const [job] = await db
      .update(jobs)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(jobs.id, id))
      .returning();
    return job;
  }

  // Invoice operations
  async createInvoice(invoice: Omit<InsertInvoice, 'invoiceNumber' | 'yearSequence'>): Promise<Invoice> {
    // Generate smart invoice number
    const currentYear = new Date().getFullYear();
    
    // Get the highest sequence number for this user in current year
    const lastInvoice = await db
      .select({ yearSequence: invoices.yearSequence })
      .from(invoices)
      .where(and(
        eq(invoices.userId, invoice.userId),
        sql`EXTRACT(YEAR FROM ${invoices.createdAt}) = ${currentYear}`
      ))
      .orderBy(desc(invoices.yearSequence))
      .limit(1);
    
    const nextSequence = (lastInvoice[0]?.yearSequence || 0) + 1;
    const invoiceNumber = `INV-${String(nextSequence).padStart(3, '0')}`;
    
    const [newInvoice] = await db.insert(invoices).values({
      ...invoice,
      invoiceNumber,
      yearSequence: nextSequence
    }).returning();
    return newInvoice;
  }

  async getInvoicesByUser(userId: string): Promise<Invoice[]> {
    return await db.select().from(invoices).where(eq(invoices.userId, userId)).orderBy(desc(invoices.createdAt));
  }

  async getInvoiceById(id: number): Promise<Invoice | undefined> {
    const result = await db.select().from(invoices).where(eq(invoices.id, id));
    return result[0];
  }

  async getOutstandingInvoices(userId: string): Promise<Invoice[]> {
    return await db
      .select()
      .from(invoices)
      .where(
        and(
          eq(invoices.userId, userId),
          sql`${invoices.status} IN ('sent', 'overdue')`
        )
      )
      .orderBy(desc(invoices.dueDate));
  }

  async getInvoiceCountForYear(userId: string, year: number): Promise<number> {
    const startOfYear = new Date(year, 0, 1);
    const endOfYear = new Date(year + 1, 0, 1);
    
    const result = await db
      .select({ count: sql<number>`count(*)` })
      .from(invoices)
      .where(
        and(
          eq(invoices.userId, userId),
          gte(invoices.createdAt, startOfYear),
          sql`${invoices.createdAt} < ${endOfYear}`
        )
      );
    
    return Number(result[0]?.count || 0);
  }

  async updateInvoiceStatus(id: number, status: string, paidDate?: Date): Promise<Invoice> {
    const [invoice] = await db
      .update(invoices)
      .set({ 
        status, 
        paidDate,
        updatedAt: new Date() 
      })
      .where(eq(invoices.id, id))
      .returning();
    return invoice;
  }

  async updateInvoice(id: number, updates: Partial<Invoice>): Promise<Invoice> {
    const [invoice] = await db
      .update(invoices)
      .set({ 
        ...updates,
        updatedAt: new Date() 
      })
      .where(eq(invoices.id, id))
      .returning();
    return invoice;
  }

  async updateInvoicePaymentStatus(id: number, paymentStatus: string, stripePaymentIntentId?: string, paidAt?: Date): Promise<Invoice> {
    const updateData: any = { paymentStatus };
    if (stripePaymentIntentId) {
      updateData.stripePaymentIntentId = stripePaymentIntentId;
    }
    if (paidAt) {
      updateData.paidAt = paidAt;
      updateData.paidDate = paidAt; // Also update legacy field
    }
    
    const [invoice] = await db.update(invoices).set(updateData).where(eq(invoices.id, id)).returning();
    return invoice;
  }

  async getYearEndSummary(userId: string, year?: number): Promise<{
    totalIncome: number;
    totalGst: number;
    jobsCompleted: number;
    invoicesCount: number;
    totalExpenses: number;
    gstClaimableExpenses: number;
  }> {
    const targetYear = year || new Date().getFullYear();
    
    const incomeResult = await db
      .select({
        totalIncome: sql<number>`COALESCE(SUM(${invoices.total}), 0)`,
        totalGst: sql<number>`COALESCE(SUM(${invoices.gst}), 0)`,
        invoicesCount: sql<number>`COUNT(*)`
      })
      .from(invoices)
      .where(and(
        eq(invoices.userId, userId),
        sql`EXTRACT(YEAR FROM ${invoices.createdAt}) = ${targetYear}`
      ));

    const jobsResult = await db
      .select({ count: sql<number>`COUNT(*)` })
      .from(jobs)
      .where(and(
        eq(jobs.userId, userId),
        eq(jobs.status, 'completed'),
        sql`EXTRACT(YEAR FROM ${jobs.completedDate}) = ${targetYear}`
      ));

    const expensesResult = await db
      .select({
        totalExpenses: sql<number>`COALESCE(SUM(${expenses.amount}), 0)`,
        gstClaimableExpenses: sql<number>`COALESCE(SUM(CASE WHEN ${expenses.isGstClaimable} THEN ${expenses.amount} ELSE 0 END), 0)`
      })
      .from(expenses)
      .where(and(
        eq(expenses.userId, userId),
        sql`EXTRACT(YEAR FROM ${expenses.date}) = ${targetYear}`
      ));

    return {
      totalIncome: Number(incomeResult[0]?.totalIncome || 0),
      totalGst: Number(incomeResult[0]?.totalGst || 0),
      invoicesCount: Number(incomeResult[0]?.invoicesCount || 0),
      jobsCompleted: Number(jobsResult[0]?.count || 0),
      totalExpenses: Number(expensesResult[0]?.totalExpenses || 0),
      gstClaimableExpenses: Number(expensesResult[0]?.gstClaimableExpenses || 0)
    };
  }

  // Expense operations
  async createExpense(userId: string, expense: InsertExpense): Promise<Expense> {
    const [newExpense] = await db.insert(expenses).values({
      ...expense,
      userId,
      date: new Date(expense.date),
    }).returning();
    return newExpense;
  }

  async getExpensesByUser(userId: string): Promise<Expense[]> {
    return await db.select().from(expenses).where(eq(expenses.userId, userId)).orderBy(desc(expenses.date));
  }

  async getExpensesInDateRange(userId: string, startDate: Date, endDate: Date): Promise<Expense[]> {
    return await db
      .select()
      .from(expenses)
      .where(
        and(
          eq(expenses.userId, userId),
          gte(expenses.date, startDate),
          lte(expenses.date, endDate)
        )
      )
      .orderBy(desc(expenses.date));
  }

  async updateExpense(expenseId: number, expenseData: Partial<InsertExpense>): Promise<Expense> {
    const [expense] = await db
      .update(expenses)
      .set({
        ...expenseData,
        date: expenseData.date ? new Date(expenseData.date) : undefined
      })
      .where(eq(expenses.id, expenseId))
      .returning();
    return expense;
  }

  async deleteExpense(userId: string, expenseId: number): Promise<void> {
    await db.delete(expenses).where(
      and(
        eq(expenses.id, expenseId),
        eq(expenses.userId, userId)
      )
    );
  }

  // Chat operations
  async createChatMessage(message: InsertChatMessage): Promise<ChatMessage> {
    const [newMessage] = await db.insert(chatMessages).values(message).returning();
    return newMessage;
  }

  async getChatHistory(userId: string, agentType: string, limit: number = 50): Promise<ChatMessage[]> {
    return await db
      .select()
      .from(chatMessages)
      .where(
        and(
          eq(chatMessages.userId, userId),
          eq(chatMessages.agentType, agentType)
        )
      )
      .orderBy(desc(chatMessages.timestamp))
      .limit(limit);
  }

  // Analytics
  async getWeeklyIncome(userId: string): Promise<number> {
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

    const result = await db
      .select({ total: sql<number>`COALESCE(SUM(${invoices.total}), 0)` })
      .from(invoices)
      .where(
        and(
          eq(invoices.userId, userId),
          eq(invoices.status, 'paid'),
          gte(invoices.paidDate, oneWeekAgo)
        )
      );

    return Number(result[0]?.total || 0);
  }

  async getMonthlyStats(userId: string): Promise<{
    totalIncome: number;
    totalExpenses: number;
    jobsCompleted: number;
    jobsThisMonth: number;
    outstandingAmount: number;
  }> {
    const oneMonthAgo = new Date();
    oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);

    // Get current month start and end for job counting
    const currentDate = new Date();
    const monthStart = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
    const monthEnd = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);

    const [incomeResult] = await db
      .select({ total: sql<number>`COALESCE(SUM(${invoices.total}), 0)` })
      .from(invoices)
      .where(
        and(
          eq(invoices.userId, userId),
          eq(invoices.status, 'paid'),
          gte(invoices.paidDate, oneMonthAgo)
        )
      );

    const [expenseResult] = await db
      .select({ total: sql<number>`COALESCE(SUM(${expenses.amount}), 0)` })
      .from(expenses)
      .where(
        and(
          eq(expenses.userId, userId),
          gte(expenses.date, oneMonthAgo)
        )
      );

    const [jobsCompletedResult] = await db
      .select({ count: sql<number>`COUNT(*)` })
      .from(jobs)
      .where(
        and(
          eq(jobs.userId, userId),
          eq(jobs.status, 'completed'),
          gte(jobs.completedDate, oneMonthAgo)
        )
      );

    // Count all jobs scheduled for this month (not just completed)
    const [jobsThisMonthResult] = await db
      .select({ count: sql<number>`COUNT(*)` })
      .from(jobs)
      .where(
        and(
          eq(jobs.userId, userId),
          gte(jobs.scheduledDate, monthStart),
          lte(jobs.scheduledDate, monthEnd)
        )
      );

    const [outstandingResult] = await db
      .select({ total: sql<number>`COALESCE(SUM(${invoices.total}), 0)` })
      .from(invoices)
      .where(
        and(
          eq(invoices.userId, userId),
          sql`${invoices.status} IN ('sent', 'overdue')`
        )
      );

    return {
      totalIncome: Number(incomeResult?.total || 0),
      totalExpenses: Number(expenseResult?.total || 0),
      jobsCompleted: Number(jobsCompletedResult?.count || 0),
      jobsThisMonth: Number(jobsThisMonthResult?.count || 0),
      outstandingAmount: Number(outstandingResult?.total || 0),
    };
  }

  async getBetaAnalytics() {
    // Get total and beta user counts
    const [totalUsers] = await db.select({ count: sql`count(*)` }).from(users);
    const [betaUsers] = await db.select({ count: sql`count(*)` }).from(users).where(eq(users.isBetaUser, true));
    
    // Get users by country
    const countryStats = await db
      .select({ 
        country: users.country, 
        count: sql`count(*)` 
      })
      .from(users)
      .where(eq(users.isBetaUser, true))
      .groupBy(users.country);
    
    const usersByCountry = {
      Australia: Number(countryStats.find(s => s.country === "Australia")?.count || 0),
      "New Zealand": Number(countryStats.find(s => s.country === "New Zealand")?.count || 0)
    };

    return {
      totalUsers: Number(totalUsers.count),
      betaUsers: Number(betaUsers.count),
      usersByCountry,
      contractDownloads: { Australia: 0, "New Zealand": 0 },
      agentUsageByRegion: {
        Australia: { accountant: 0, legal: 0, marketing: 0, coach: 0 },
        "New Zealand": { accountant: 0, legal: 0, marketing: 0, coach: 0 }
      }
    };
  }

  async getBetaUserCount(): Promise<number> {
    const [result] = await db.select({ count: sql`count(*)` }).from(users).where(eq(users.isBetaUser, true));
    return Number(result.count);
  }

  // Testimonials
  async createTestimonial(testimonial: InsertTestimonial): Promise<Testimonial> {
    const [created] = await db.insert(testimonials).values(testimonial).returning();
    return created;
  }

  async getUserTestimonial(userId: string): Promise<Testimonial | undefined> {
    const [testimonial] = await db.select().from(testimonials).where(eq(testimonials.userId, userId));
    return testimonial;
  }

  async getPublicTestimonials(): Promise<Testimonial[]> {
    return await db
      .select()
      .from(testimonials)
      .where(and(eq(testimonials.isPublic, true), eq(testimonials.isApproved, true)))
      .orderBy(desc(testimonials.createdAt));
  }

  // Roadmap operations
  async createRoadmapItem(item: InsertRoadmapItem): Promise<RoadmapItem> {
    const [created] = await db.insert(roadmapItems).values(item).returning();
    return created;
  }

  async getRoadmapItems(publicOnly = false): Promise<RoadmapItem[]> {
    const whereCondition = publicOnly ? eq(roadmapItems.isPublic, true) : undefined;
    return await db
      .select()
      .from(roadmapItems)
      .where(whereCondition)
      .orderBy(desc(roadmapItems.createdAt));
  }

  async updateRoadmapItem(id: number, updates: Partial<RoadmapItem>): Promise<RoadmapItem> {
    const [updated] = await db
      .update(roadmapItems)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(roadmapItems.id, id))
      .returning();
    return updated;
  }

  async voteForRoadmapItem(userId: string, itemId: number, country: string): Promise<void> {
    // Check if user already voted
    const existingVote = await db
      .select()
      .from(roadmapVotes)
      .where(and(eq(roadmapVotes.userId, userId), eq(roadmapVotes.roadmapItemId, itemId)));

    if (existingVote.length > 0) {
      return; // User already voted
    }

    // Add vote
    await db.insert(roadmapVotes).values({
      userId,
      roadmapItemId: itemId,
      country,
    });

    // Update vote count
    await db
      .update(roadmapItems)
      .set({
        votesCount: sql`${roadmapItems.votesCount} + 1`,
        updatedAt: new Date(),
      })
      .where(eq(roadmapItems.id, itemId));
  }

  async getUserRoadmapVotes(userId: string): Promise<number[]> {
    const votes = await db
      .select({ roadmapItemId: roadmapVotes.roadmapItemId })
      .from(roadmapVotes)
      .where(eq(roadmapVotes.userId, userId));
    return votes.map(vote => vote.roadmapItemId);
  }

  async createFeatureRequest(request: InsertFeatureRequest): Promise<FeatureRequest> {
    const [created] = await db.insert(featureRequests).values(request).returning();
    return created;
  }

  async getFeatureRequests(): Promise<FeatureRequest[]> {
    return await db
      .select()
      .from(featureRequests)
      .orderBy(desc(featureRequests.votesCount), desc(featureRequests.createdAt));
  }

  async getRoadmapAnalytics(): Promise<{
    totalVotes: number;
    votesByCountry: Record<string, number>;
    topRequestedFeatures: Array<{ title: string; votes: number; country: string }>;
    completedItemsThisQuarter: number;
  }> {
    // Get total votes and breakdown by country
    const voteStats = await db
      .select({
        country: roadmapVotes.country,
        count: sql`count(*)`
      })
      .from(roadmapVotes)
      .groupBy(roadmapVotes.country);

    // Get top requested features
    const topFeatures = await db
      .select({
        title: roadmapItems.title,
        votes: roadmapItems.votesCount,
        status: roadmapItems.status,
      })
      .from(roadmapItems)
      .orderBy(desc(roadmapItems.votesCount))
      .limit(10);

    // Get completed items this quarter
    const currentDate = new Date();
    const currentQuarter = `Q${Math.ceil((currentDate.getMonth() + 1) / 3)}-${currentDate.getFullYear()}`;
    const [completedCount] = await db
      .select({ count: sql`count(*)` })
      .from(roadmapItems)
      .where(and(
        eq(roadmapItems.status, 'completed'),
        eq(roadmapItems.estimatedQuarter, currentQuarter)
      ));

    const totalVotes = voteStats.reduce((sum, stat) => sum + Number(stat.count), 0);
    const votesByCountry = voteStats.reduce((acc, stat) => {
      acc[stat.country] = Number(stat.count);
      return acc;
    }, {} as Record<string, number>);

    return {
      totalVotes,
      votesByCountry,
      topRequestedFeatures: topFeatures.map(f => ({ 
        title: f.title, 
        votes: f.votes, 
        country: 'All' 
      })),
      completedItemsThisQuarter: Number(completedCount.count),
    };
  }

  async addToPublicWaitlist(data: InsertPublicWaitlist): Promise<PublicWaitlist> {
    const [waitlistEntry] = await db
      .insert(publicWaitlistTable)
      .values(data)
      .onConflictDoUpdate({
        target: publicWaitlistTable.email,
        set: {
          ip: data.ip,
          userAgent: data.userAgent,
          referrer: data.referrer,
          createdAt: new Date(),
        },
      })
      .returning();
    return waitlistEntry;
  }
}

export const storage = new DatabaseStorage();
