import { db } from "../../db";
import {
  calendarEvents,
  calendarSyncSettings,
  type CalendarEvent,
  type InsertCalendarEvent,
  type CalendarSyncSettings,
} from "@shared/schema";
import { eq, and, between, gte, lte, or } from "drizzle-orm";

export class CalendarService {
  /**
   * Create a calendar event
   */
  async createEvent(eventData: InsertCalendarEvent): Promise<CalendarEvent> {
    const [event] = await db.insert(calendarEvents).values(eventData).returning();
    return event;
  }

  /**
   * Get event by ID
   */
  async getEvent(eventId: number, userId: string): Promise<CalendarEvent | null> {
    const [event] = await db
      .select()
      .from(calendarEvents)
      .where(
        and(
          eq(calendarEvents.id, eventId),
          eq(calendarEvents.userId, userId)
        )
      )
      .limit(1);

    return event || null;
  }

  /**
   * Get events for a user within a date range
   */
  async getEventsByDateRange(
    userId: string,
    startDate: Date,
    endDate: Date
  ): Promise<CalendarEvent[]> {
    return await db
      .select()
      .from(calendarEvents)
      .where(
        and(
          eq(calendarEvents.userId, userId),
          or(
            // Events that start within the range
            between(calendarEvents.startTime, startDate, endDate),
            // Events that end within the range
            between(calendarEvents.endTime, startDate, endDate),
            // Events that span the entire range
            and(
              lte(calendarEvents.startTime, startDate),
              gte(calendarEvents.endTime, endDate)
            )
          )
        )
      )
      .orderBy(calendarEvents.startTime);
  }

  /**
   * Get events by job ID
   */
  async getEventsByJob(jobId: number, userId: string): Promise<CalendarEvent[]> {
    return await db
      .select()
      .from(calendarEvents)
      .where(
        and(
          eq(calendarEvents.jobId, jobId),
          eq(calendarEvents.userId, userId)
        )
      )
      .orderBy(calendarEvents.startTime);
  }

  /**
   * Update event
   */
  async updateEvent(
    eventId: number,
    userId: string,
    updates: Partial<InsertCalendarEvent>
  ): Promise<CalendarEvent | null> {
    const [updated] = await db
      .update(calendarEvents)
      .set({
        ...updates,
        updatedAt: new Date(),
      })
      .where(
        and(
          eq(calendarEvents.id, eventId),
          eq(calendarEvents.userId, userId)
        )
      )
      .returning();

    return updated || null;
  }

  /**
   * Delete event
   */
  async deleteEvent(eventId: number, userId: string): Promise<boolean> {
    const result = await db
      .delete(calendarEvents)
      .where(
        and(
          eq(calendarEvents.id, eventId),
          eq(calendarEvents.userId, userId)
        )
      );

    return result.rowCount ? result.rowCount > 0 : false;
  }

  /**
   * Get upcoming events for a user
   */
  async getUpcomingEvents(userId: string, limit: number = 10): Promise<CalendarEvent[]> {
    const now = new Date();

    return await db
      .select()
      .from(calendarEvents)
      .where(
        and(
          eq(calendarEvents.userId, userId),
          gte(calendarEvents.startTime, now),
          eq(calendarEvents.status, 'scheduled')
        )
      )
      .orderBy(calendarEvents.startTime)
      .limit(limit);
  }

  /**
   * Get today's events for a user
   */
  async getTodayEvents(userId: string): Promise<CalendarEvent[]> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    return await this.getEventsByDateRange(userId, today, tomorrow);
  }

  /**
   * Create event from job
   */
  async createEventFromJob(
    userId: string,
    jobId: number,
    jobData: {
      title: string;
      customerName?: string;
      startTime: Date;
      endTime: Date;
      location?: string;
      description?: string;
    }
  ): Promise<CalendarEvent> {
    return await this.createEvent({
      userId,
      jobId,
      title: jobData.title,
      customerName: jobData.customerName,
      startTime: jobData.startTime,
      endTime: jobData.endTime,
      location: jobData.location,
      description: jobData.description,
      eventType: 'job',
      status: 'scheduled',
    });
  }

  /**
   * Mark event as completed
   */
  async completeEvent(eventId: number, userId: string): Promise<CalendarEvent | null> {
    return await this.updateEvent(eventId, userId, {
      status: 'completed',
    });
  }

  /**
   * Cancel event
   */
  async cancelEvent(eventId: number, userId: string): Promise<CalendarEvent | null> {
    return await this.updateEvent(eventId, userId, {
      status: 'cancelled',
    });
  }

  /**
   * Get calendar sync settings for a user
   */
  async getSyncSettings(userId: string): Promise<CalendarSyncSettings | null> {
    const [settings] = await db
      .select()
      .from(calendarSyncSettings)
      .where(eq(calendarSyncSettings.userId, userId))
      .limit(1);

    return settings || null;
  }

  /**
   * Create or update sync settings
   */
  async upsertSyncSettings(
    userId: string,
    settings: Partial<CalendarSyncSettings>
  ): Promise<CalendarSyncSettings> {
    // Check if settings exist
    const existing = await this.getSyncSettings(userId);

    if (existing) {
      // Update existing
      const [updated] = await db
        .update(calendarSyncSettings)
        .set({
          ...settings,
          updatedAt: new Date(),
        })
        .where(eq(calendarSyncSettings.userId, userId))
        .returning();

      return updated;
    } else {
      // Create new
      const [created] = await db
        .insert(calendarSyncSettings)
        .values({
          userId,
          ...settings,
        })
        .returning();

      return created;
    }
  }

  /**
   * Enable Google Calendar sync
   */
  async enableGoogleSync(
    userId: string,
    accessToken: string,
    refreshToken: string,
    expiresAt: Date,
    calendarId: string
  ): Promise<CalendarSyncSettings> {
    return await this.upsertSyncSettings(userId, {
      googleEnabled: true,
      googleAccessToken: accessToken,
      googleRefreshToken: refreshToken,
      googleTokenExpiry: expiresAt,
      googleCalendarId: calendarId,
      googleLastSync: new Date(),
    });
  }

  /**
   * Enable Outlook Calendar sync
   */
  async enableOutlookSync(
    userId: string,
    accessToken: string,
    refreshToken: string,
    expiresAt: Date,
    calendarId: string
  ): Promise<CalendarSyncSettings> {
    return await this.upsertSyncSettings(userId, {
      outlookEnabled: true,
      outlookAccessToken: accessToken,
      outlookRefreshToken: refreshToken,
      outlookTokenExpiry: expiresAt,
      outlookCalendarId: calendarId,
      outlookLastSync: new Date(),
    });
  }

  /**
   * Disable Google Calendar sync
   */
  async disableGoogleSync(userId: string): Promise<CalendarSyncSettings> {
    return await this.upsertSyncSettings(userId, {
      googleEnabled: false,
      googleAccessToken: null,
      googleRefreshToken: null,
      googleTokenExpiry: null,
      googleSyncToken: null,
    });
  }

  /**
   * Disable Outlook Calendar sync
   */
  async disableOutlookSync(userId: string): Promise<CalendarSyncSettings> {
    return await this.upsertSyncSettings(userId, {
      outlookEnabled: false,
      outlookAccessToken: null,
      outlookRefreshToken: null,
      outlookTokenExpiry: null,
      outlookDeltaToken: null,
    });
  }

  /**
   * Update sync tokens for incremental sync
   */
  async updateGoogleSyncToken(userId: string, syncToken: string): Promise<void> {
    await this.upsertSyncSettings(userId, {
      googleSyncToken: syncToken,
      googleLastSync: new Date(),
    });
  }

  /**
   * Update Outlook delta token for incremental sync
   */
  async updateOutlookDeltaToken(userId: string, deltaToken: string): Promise<void> {
    await this.upsertSyncSettings(userId, {
      outlookDeltaToken: deltaToken,
      outlookLastSync: new Date(),
    });
  }

  /**
   * Mark event as synced with Google
   */
  async markGoogleSynced(
    eventId: number,
    userId: string,
    googleEventId: string
  ): Promise<CalendarEvent | null> {
    return await this.updateEvent(eventId, userId, {
      googleEventId,
      syncStatus: 'synced',
      lastSyncedAt: new Date(),
    });
  }

  /**
   * Mark event as synced with Outlook
   */
  async markOutlookSynced(
    eventId: number,
    userId: string,
    outlookEventId: string
  ): Promise<CalendarEvent | null> {
    return await this.updateEvent(eventId, userId, {
      outlookEventId,
      syncStatus: 'synced',
      lastSyncedAt: new Date(),
    });
  }

  /**
   * Get events that need syncing
   */
  async getEventsNeedingSync(userId: string): Promise<CalendarEvent[]> {
    return await db
      .select()
      .from(calendarEvents)
      .where(
        and(
          eq(calendarEvents.userId, userId),
          or(
            eq(calendarEvents.syncStatus, 'not_synced'),
            eq(calendarEvents.syncStatus, 'sync_failed')
          )
        )
      );
  }

  /**
   * Get event statistics for a user
   */
  async getEventStats(userId: string): Promise<{
    total: number;
    scheduled: number;
    completed: number;
    cancelled: number;
    upcoming: number;
    today: number;
  }> {
    const now = new Date();
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const todayEnd = new Date();
    todayEnd.setHours(23, 59, 59, 999);

    const allEvents = await db
      .select()
      .from(calendarEvents)
      .where(eq(calendarEvents.userId, userId));

    const stats = {
      total: allEvents.length,
      scheduled: allEvents.filter(e => e.status === 'scheduled').length,
      completed: allEvents.filter(e => e.status === 'completed').length,
      cancelled: allEvents.filter(e => e.status === 'cancelled').length,
      upcoming: allEvents.filter(
        e => e.status === 'scheduled' && new Date(e.startTime) >= now
      ).length,
      today: allEvents.filter(
        e => new Date(e.startTime) >= todayStart && new Date(e.startTime) <= todayEnd
      ).length,
    };

    return stats;
  }
}

export const calendarService = new CalendarService();
