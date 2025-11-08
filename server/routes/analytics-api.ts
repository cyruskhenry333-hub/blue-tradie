import { Router, type Request, type Response } from "express";
import { analyticsService } from "../services/analyticsService";
import { db } from "../db";
import { analyticsEvents, businessMetrics, analyticsMetrics } from "@shared/schema";
import { eq, and, gte, lte, desc, sql } from "drizzle-orm";

export const analyticsApiRouter = Router();

/**
 * Get business insights for the authenticated user
 */
analyticsApiRouter.get("/api/analytics/insights", async (req: any, res: Response) => {
  try {
    if (!req.user?.claims?.sub) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const userId = req.user.claims.sub;
    const days = parseInt(req.query.days as string) || 30;

    const insights = await analyticsService.getBusinessInsights(userId, days);
    res.json(insights);
  } catch (error) {
    console.error("[ANALYTICS API] Error getting insights:", error);
    res.status(500).json({ message: "Failed to fetch insights" });
  }
});

/**
 * Get recent events for the authenticated user
 */
analyticsApiRouter.get("/api/analytics/events", async (req: any, res: Response) => {
  try {
    if (!req.user?.claims?.sub) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const userId = req.user.claims.sub;
    const limit = parseInt(req.query.limit as string) || 50;
    const eventType = req.query.eventType as string | undefined;

    let query = db
      .select()
      .from(analyticsEvents)
      .where(eq(analyticsEvents.userId, userId))
      .orderBy(desc(analyticsEvents.createdAt))
      .limit(limit);

    if (eventType) {
      query = db
        .select()
        .from(analyticsEvents)
        .where(
          and(
            eq(analyticsEvents.userId, userId),
            eq(analyticsEvents.eventType, eventType)
          )
        )
        .orderBy(desc(analyticsEvents.createdAt))
        .limit(limit) as any;
    }

    const events = await query;
    res.json(events);
  } catch (error) {
    console.error("[ANALYTICS API] Error getting events:", error);
    res.status(500).json({ message: "Failed to fetch events" });
  }
});

/**
 * Get daily business metrics for a date range
 */
analyticsApiRouter.get("/api/analytics/metrics/daily", async (req: any, res: Response) => {
  try {
    if (!req.user?.claims?.sub) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const userId = req.user.claims.sub;
    const days = parseInt(req.query.days as string) || 30;

    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);
    startDate.setHours(0, 0, 0, 0);

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

    res.json(metrics);
  } catch (error) {
    console.error("[ANALYTICS API] Error getting daily metrics:", error);
    res.status(500).json({ message: "Failed to fetch daily metrics" });
  }
});

/**
 * Get event counts by type for the authenticated user
 */
analyticsApiRouter.get("/api/analytics/event-counts", async (req: any, res: Response) => {
  try {
    if (!req.user?.claims?.sub) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const userId = req.user.claims.sub;
    const days = parseInt(req.query.days as string) || 30;

    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const counts = await db
      .select({
        eventType: analyticsEvents.eventType,
        count: sql<number>`count(*)::int`,
      })
      .from(analyticsEvents)
      .where(
        and(
          eq(analyticsEvents.userId, userId),
          gte(analyticsEvents.createdAt, startDate)
        )
      )
      .groupBy(analyticsEvents.eventType)
      .orderBy(desc(sql`count(*)`));

    res.json(counts);
  } catch (error) {
    console.error("[ANALYTICS API] Error getting event counts:", error);
    res.status(500).json({ message: "Failed to fetch event counts" });
  }
});

/**
 * Get revenue timeline for charts
 */
analyticsApiRouter.get("/api/analytics/revenue", async (req: any, res: Response) => {
  try {
    if (!req.user?.claims?.sub) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const userId = req.user.claims.sub;
    const days = parseInt(req.query.days as string) || 30;

    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);
    startDate.setHours(0, 0, 0, 0);

    const metrics = await db
      .select({
        date: businessMetrics.metricDate,
        revenue: businessMetrics.totalRevenue,
        invoicesSent: businessMetrics.invoicesSent,
        invoicesPaid: businessMetrics.invoicesPaid,
      })
      .from(businessMetrics)
      .where(
        and(
          eq(businessMetrics.userId, userId),
          gte(businessMetrics.metricDate, startDate)
        )
      )
      .orderBy(businessMetrics.metricDate);

    res.json(metrics);
  } catch (error) {
    console.error("[ANALYTICS API] Error getting revenue data:", error);
    res.status(500).json({ message: "Failed to fetch revenue data" });
  }
});

/**
 * Get AI usage statistics
 */
analyticsApiRouter.get("/api/analytics/ai-usage", async (req: any, res: Response) => {
  try {
    if (!req.user?.claims?.sub) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const userId = req.user.claims.sub;
    const days = parseInt(req.query.days as string) || 30;

    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    // Get AI chat events grouped by advisor type
    const aiChats = await db
      .select({
        agentType: sql<string>`(event_data->>'agentType')::text`,
        count: sql<number>`count(*)::int`,
        totalTokens: sql<number>`sum((event_data->>'tokensUsed')::numeric)::int`,
        totalCost: sql<number>`sum((event_data->>'costAud')::numeric)`,
      })
      .from(analyticsEvents)
      .where(
        and(
          eq(analyticsEvents.userId, userId),
          eq(analyticsEvents.eventType, 'ai_chat'),
          gte(analyticsEvents.createdAt, startDate)
        )
      )
      .groupBy(sql`event_data->>'agentType'`)
      .orderBy(desc(sql`count(*)`));

    res.json(aiChats);
  } catch (error) {
    console.error("[ANALYTICS API] Error getting AI usage:", error);
    res.status(500).json({ message: "Failed to fetch AI usage" });
  }
});

/**
 * Trigger daily metrics aggregation (admin/cron)
 */
analyticsApiRouter.post("/api/analytics/aggregate", async (req: any, res: Response) => {
  try {
    // In production, this should be protected by admin auth or API key
    if (!req.user?.claims?.sub) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const userId = req.user.claims.sub;
    const date = req.body.date ? new Date(req.body.date) : new Date();

    await analyticsService.aggregateDailyMetrics(userId, date);

    res.json({ message: "Metrics aggregated successfully" });
  } catch (error) {
    console.error("[ANALYTICS API] Error aggregating metrics:", error);
    res.status(500).json({ message: "Failed to aggregate metrics" });
  }
});

/**
 * Get activity timeline (recent events with details)
 */
analyticsApiRouter.get("/api/analytics/activity", async (req: any, res: Response) => {
  try {
    if (!req.user?.claims?.sub) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const userId = req.user.claims.sub;
    const limit = parseInt(req.query.limit as string) || 20;

    const events = await db
      .select()
      .from(analyticsEvents)
      .where(eq(analyticsEvents.userId, userId))
      .orderBy(desc(analyticsEvents.createdAt))
      .limit(limit);

    // Format events for timeline display
    const activity = events.map(event => ({
      id: event.id,
      type: event.eventType,
      category: event.eventCategory,
      timestamp: event.createdAt,
      description: getEventDescription(event.eventType, event.eventData as any),
      data: event.eventData,
    }));

    res.json(activity);
  } catch (error) {
    console.error("[ANALYTICS API] Error getting activity:", error);
    res.status(500).json({ message: "Failed to fetch activity" });
  }
});

/**
 * Helper function to generate human-readable event descriptions
 */
function getEventDescription(eventType: string, eventData: any): string {
  switch (eventType) {
    case 'login':
      return 'Logged in to Blue Tradie';
    case 'first_login':
      return 'First login - Welcome! 🎉';
    case 'ai_chat':
      return `Chat with ${eventData?.agentType || 'AI'} advisor`;
    case 'job_created':
      return `Created job for ${eventData?.customerName || 'customer'}`;
    case 'invoice_created':
      return `Created invoice for ${eventData?.customerName || 'customer'}`;
    case 'invoice_paid':
      return `Invoice paid by ${eventData?.customerName || 'customer'}`;
    case 'payment_received':
      return `Received payment of $${eventData?.amount || 0}`;
    default:
      return eventType.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  }
}

export default analyticsApiRouter;
