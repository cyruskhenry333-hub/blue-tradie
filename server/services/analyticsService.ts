import { db } from '../db';
import {
  analyticsEvents,
  analyticsSessions,
  analyticsMetrics,
  businessMetrics,
  type AnalyticsEvent,
  type AnalyticsSession,
  type InsertAnalyticsEvent,
  type InsertBusinessMetric,
} from '@shared/schema';
import { eq, and, gte, lte, desc, sql } from 'drizzle-orm';
import { Request } from 'express';

interface TrackEventOptions {
  userId?: string;
  sessionId?: string;
  eventType: string;
  eventCategory?: 'user' | 'business' | 'system' | 'ai';
  eventData?: Record<string, any>;
  req?: Request;
}

interface SessionInfo {
  device?: string;
  browser?: string;
  os?: string;
  ipAddress?: string;
  userAgent?: string;
}

export class AnalyticsService {

  /**
   * Track an event (main method for logging user/system actions)
   */
  async trackEvent(options: TrackEventOptions): Promise<AnalyticsEvent | null> {
    try {
      const {
        userId,
        sessionId,
        eventType,
        eventCategory = 'user',
        eventData = {},
        req,
      } = options;

      // Extract metadata from request if provided
      const metadata: Record<string, any> = {};
      let ipAddress: string | undefined;
      let userAgent: string | undefined;

      if (req) {
        ipAddress = this.getClientIp(req);
        userAgent = req.headers['user-agent'];
        const sessionInfo = this.parseUserAgent(userAgent);
        metadata.device = sessionInfo.device;
        metadata.browser = sessionInfo.browser;
        metadata.os = sessionInfo.os;
      }

      const [event] = await db
        .insert(analyticsEvents)
        .values({
          userId,
          sessionId,
          eventType,
          eventCategory,
          eventData,
          metadata,
          ipAddress,
          userAgent,
        })
        .returning();

      // Update session event count if sessionId provided
      if (sessionId) {
        await this.incrementSessionEvents(sessionId);
      }

      console.log(`[ANALYTICS] Tracked event: ${eventType} (user: ${userId || 'anonymous'})`);
      return event;
    } catch (error) {
      console.error('[ANALYTICS] Error tracking event:', error);
      return null;
    }
  }

  /**
   * Start a new user session
   */
  async startSession(userId: string, req?: Request): Promise<string> {
    try {
      const sessionId = `sess-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;

      let sessionInfo: SessionInfo = {};
      if (req) {
        const userAgent = req.headers['user-agent'];
        sessionInfo = {
          ...this.parseUserAgent(userAgent),
          ipAddress: this.getClientIp(req),
          userAgent,
        };
      }

      await db.insert(analyticsSessions).values({
        id: sessionId,
        userId,
        ...sessionInfo,
      });

      console.log(`[ANALYTICS] Started session ${sessionId} for user ${userId}`);
      return sessionId;
    } catch (error) {
      console.error('[ANALYTICS] Error starting session:', error);
      // Return a fallback session ID even if insert fails
      return `sess-fallback-${Date.now()}`;
    }
  }

  /**
   * End a user session
   */
  async endSession(sessionId: string): Promise<void> {
    try {
      const [session] = await db
        .select()
        .from(analyticsSessions)
        .where(eq(analyticsSessions.id, sessionId))
        .limit(1);

      if (!session || !session.startedAt) return;

      const endedAt = new Date();
      const duration = Math.floor((endedAt.getTime() - new Date(session.startedAt).getTime()) / 1000);

      await db
        .update(analyticsSessions)
        .set({
          endedAt,
          duration,
        })
        .where(eq(analyticsSessions.id, sessionId));

      console.log(`[ANALYTICS] Ended session ${sessionId} (duration: ${duration}s)`);
    } catch (error) {
      console.error('[ANALYTICS] Error ending session:', error);
    }
  }

  /**
   * Increment session page views
   */
  async incrementSessionPageViews(sessionId: string): Promise<void> {
    try {
      await db
        .update(analyticsSessions)
        .set({
          pageViews: sql`${analyticsSessions.pageViews} + 1`,
        })
        .where(eq(analyticsSessions.id, sessionId));
    } catch (error) {
      console.error('[ANALYTICS] Error incrementing page views:', error);
    }
  }

  /**
   * Increment session events count
   */
  private async incrementSessionEvents(sessionId: string): Promise<void> {
    try {
      await db
        .update(analyticsSessions)
        .set({
          eventsCount: sql`${analyticsSessions.eventsCount} + 1`,
        })
        .where(eq(analyticsSessions.id, sessionId));
    } catch (error) {
      console.error('[ANALYTICS] Error incrementing events:', error);
    }
  }

  /**
   * Aggregate daily business metrics for a user
   */
  async aggregateDailyMetrics(userId: string, date: Date = new Date()): Promise<void> {
    try {
      const startOfDay = new Date(date);
      startOfDay.setHours(0, 0, 0, 0);
      const endOfDay = new Date(date);
      endOfDay.setHours(23, 59, 59, 999);

      // Query events for the day
      const events = await db
        .select()
        .from(analyticsEvents)
        .where(
          and(
            eq(analyticsEvents.userId, userId),
            gte(analyticsEvents.createdAt, startOfDay),
            lte(analyticsEvents.createdAt, endOfDay)
          )
        );

      // Calculate metrics
      const metrics: Partial<InsertBusinessMetric> = {
        userId,
        metricDate: startOfDay,
        aiChatsCount: events.filter(e => e.eventType === 'ai_chat').length,
        jobsCreated: events.filter(e => e.eventType === 'job_created').length,
        jobsCompleted: events.filter(e => e.eventType === 'job_completed').length,
        quotesCreated: events.filter(e => e.eventType === 'quote_created').length,
        quotesAccepted: events.filter(e => e.eventType === 'quote_accepted').length,
        invoicesSent: events.filter(e => e.eventType === 'invoice_created').length,
        invoicesPaid: events.filter(e => e.eventType === 'invoice_paid').length,
        paymentsReceived: events.filter(e => e.eventType === 'payment_received').length,
        newCustomers: events.filter(e => e.eventType === 'customer_created').length,
        repeatCustomers: events.filter(e => e.eventType === 'repeat_customer').length,
      };

      // Calculate revenue from payment events
      const revenueEvents = events.filter(e => e.eventType === 'payment_received');
      const totalRevenue = revenueEvents.reduce((sum, e) => {
        const amount = (e.eventData as any)?.amount || 0;
        return sum + amount;
      }, 0);
      metrics.totalRevenue = totalRevenue.toString();

      // Calculate tokens used
      const tokenEvents = events.filter(e => e.eventType === 'ai_chat');
      const tokensUsed = tokenEvents.reduce((sum, e) => {
        const tokens = (e.eventData as any)?.tokensUsed || 0;
        return sum + tokens;
      }, 0);
      metrics.tokensUsed = tokensUsed;

      // Upsert metrics
      await db.insert(businessMetrics).values(metrics as InsertBusinessMetric).onConflictDoNothing();

      console.log(`[ANALYTICS] Aggregated daily metrics for user ${userId}`);
    } catch (error) {
      console.error('[ANALYTICS] Error aggregating metrics:', error);
    }
  }

  /**
   * Get business insights for a user
   */
  async getBusinessInsights(userId: string, days: number = 30): Promise<{
    totalRevenue: number;
    averageJobValue: number;
    quoteConversionRate: number;
    invoicePaymentRate: number;
    aiUsageCount: number;
    topPerformingDays: string[];
  }> {
    try {
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);

      const metrics = await db
        .select()
        .from(businessMetrics)
        .where(
          and(
            eq(businessMetrics.userId, userId),
            gte(businessMetrics.metricDate, startDate)
          )
        )
        .orderBy(desc(businessMetrics.metricDate));

      const totalRevenue = metrics.reduce((sum, m) => sum + parseFloat(m.totalRevenue || '0'), 0);
      const totalJobs = metrics.reduce((sum, m) => sum + (m.jobsCompleted || 0), 0);
      const totalQuotes = metrics.reduce((sum, m) => sum + (m.quotesCreated || 0), 0);
      const acceptedQuotes = metrics.reduce((sum, m) => sum + (m.quotesAccepted || 0), 0);
      const totalInvoices = metrics.reduce((sum, m) => sum + (m.invoicesSent || 0), 0);
      const paidInvoices = metrics.reduce((sum, m) => sum + (m.invoicesPaid || 0), 0);
      const aiUsage = metrics.reduce((sum, m) => sum + (m.aiChatsCount || 0), 0);

      const averageJobValue = totalJobs > 0 ? totalRevenue / totalJobs : 0;
      const quoteConversionRate = totalQuotes > 0 ? (acceptedQuotes / totalQuotes) * 100 : 0;
      const invoicePaymentRate = totalInvoices > 0 ? (paidInvoices / totalInvoices) * 100 : 0;

      // Find top performing days (by revenue)
      const topDays = metrics
        .sort((a, b) => parseFloat(b.totalRevenue || '0') - parseFloat(a.totalRevenue || '0'))
        .slice(0, 5)
        .map(m => m.metricDate ? new Date(m.metricDate).toLocaleDateString() : 'Unknown');

      return {
        totalRevenue,
        averageJobValue,
        quoteConversionRate,
        invoicePaymentRate,
        aiUsageCount: aiUsage,
        topPerformingDays: topDays,
      };
    } catch (error) {
      console.error('[ANALYTICS] Error getting business insights:', error);
      return {
        totalRevenue: 0,
        averageJobValue: 0,
        quoteConversionRate: 0,
        invoicePaymentRate: 0,
        aiUsageCount: 0,
        topPerformingDays: [],
      };
    }
  }

  /**
   * Export AI training data (all events with patterns)
   */
  async exportTrainingData(startDate?: Date, endDate?: Date): Promise<{
    events: AnalyticsEvent[];
    patterns: {
      commonSequences: string[][];
      peakUsageTimes: number[];
      userBehaviorClusters: Record<string, number>;
    };
  }> {
    try {
      let query = db.select().from(analyticsEvents);

      if (startDate || endDate) {
        const conditions = [];
        if (startDate) conditions.push(gte(analyticsEvents.createdAt, startDate));
        if (endDate) conditions.push(lte(analyticsEvents.createdAt, endDate));
        query = query.where(and(...conditions)) as any;
      }

      const events = await query.orderBy(desc(analyticsEvents.createdAt)).limit(10000);

      // Analyze patterns (simplified - real ML would be more sophisticated)
      const patterns = this.analyzePatterns(events);

      return { events, patterns };
    } catch (error) {
      console.error('[ANALYTICS] Error exporting training data:', error);
      return { events: [], patterns: { commonSequences: [], peakUsageTimes: [], userBehaviorClusters: {} } };
    }
  }

  /**
   * Analyze event patterns for AI training
   */
  private analyzePatterns(events: AnalyticsEvent[]): {
    commonSequences: string[][];
    peakUsageTimes: number[];
    userBehaviorClusters: Record<string, number>;
  } {
    // Find common event sequences
    const sequences: string[][] = [];
    const eventsByUser: Record<string, AnalyticsEvent[]> = {};

    events.forEach(event => {
      if (event.userId) {
        if (!eventsByUser[event.userId]) eventsByUser[event.userId] = [];
        eventsByUser[event.userId].push(event);
      }
    });

    // Extract sequences of 3 consecutive events per user
    Object.values(eventsByUser).forEach(userEvents => {
      for (let i = 0; i < userEvents.length - 2; i++) {
        sequences.push([
          userEvents[i].eventType,
          userEvents[i + 1].eventType,
          userEvents[i + 2].eventType,
        ]);
      }
    });

    // Find peak usage hours (0-23)
    const hourCounts: Record<number, number> = {};
    events.forEach(event => {
      if (event.createdAt) {
        const hour = new Date(event.createdAt).getHours();
        hourCounts[hour] = (hourCounts[hour] || 0) + 1;
      }
    });

    const peakUsageTimes = Object.entries(hourCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([hour]) => parseInt(hour));

    // Cluster users by behavior (simplified)
    const userBehaviorClusters: Record<string, number> = {
      'heavy_ai_users': 0,
      'invoice_focused': 0,
      'job_focused': 0,
      'explorers': 0,
    };

    Object.entries(eventsByUser).forEach(([userId, userEvents]) => {
      const aiEvents = userEvents.filter(e => e.eventType === 'ai_chat').length;
      const invoiceEvents = userEvents.filter(e => e.eventType.includes('invoice')).length;
      const jobEvents = userEvents.filter(e => e.eventType.includes('job')).length;

      if (aiEvents > 10) userBehaviorClusters['heavy_ai_users']++;
      else if (invoiceEvents > jobEvents) userBehaviorClusters['invoice_focused']++;
      else if (jobEvents > invoiceEvents) userBehaviorClusters['job_focused']++;
      else userBehaviorClusters['explorers']++;
    });

    return {
      commonSequences: sequences.slice(0, 10), // Top 10 sequences
      peakUsageTimes,
      userBehaviorClusters,
    };
  }

  /**
   * Get client IP from request (handles proxies)
   */
  private getClientIp(req: Request): string | undefined {
    return (
      (req.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim() ||
      req.socket.remoteAddress
    );
  }

  /**
   * Parse user agent string (simplified)
   */
  private parseUserAgent(userAgent?: string): SessionInfo {
    if (!userAgent) return {};

    const info: SessionInfo = {};

    // Device detection
    if (/mobile/i.test(userAgent)) info.device = 'mobile';
    else if (/tablet/i.test(userAgent)) info.device = 'tablet';
    else info.device = 'desktop';

    // Browser detection
    if (/chrome/i.test(userAgent)) info.browser = 'Chrome';
    else if (/safari/i.test(userAgent)) info.browser = 'Safari';
    else if (/firefox/i.test(userAgent)) info.browser = 'Firefox';
    else if (/edge/i.test(userAgent)) info.browser = 'Edge';
    else info.browser = 'Other';

    // OS detection
    if (/windows/i.test(userAgent)) info.os = 'Windows';
    else if (/mac/i.test(userAgent)) info.os = 'macOS';
    else if (/linux/i.test(userAgent)) info.os = 'Linux';
    else if (/android/i.test(userAgent)) info.os = 'Android';
    else if (/ios/i.test(userAgent)) info.os = 'iOS';
    else info.os = 'Other';

    return info;
  }
}

export const analyticsService = new AnalyticsService();
