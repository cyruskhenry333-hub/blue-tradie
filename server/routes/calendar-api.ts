import { Router, type Request, type Response } from "express";
import { calendarService } from "../services/calendarService";
import { insertCalendarEventSchema } from "@shared/schema";

export const calendarApiRouter = Router();

/**
 * Get calendar events for a date range
 */
calendarApiRouter.get("/api/calendar/events", async (req: any, res: Response) => {
  try {
    if (!req.user?.claims?.sub) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const userId = req.user.claims.sub;
    const { startDate, endDate } = req.query;

    if (!startDate || !endDate) {
      return res.status(400).json({ message: "startDate and endDate are required" });
    }

    const events = await calendarService.getEventsByDateRange(
      userId,
      new Date(startDate as string),
      new Date(endDate as string)
    );

    res.json(events);
  } catch (error) {
    console.error("[CALENDAR API] Error fetching events:", error);
    res.status(500).json({ message: "Failed to fetch events" });
  }
});

/**
 * Get today's events
 */
calendarApiRouter.get("/api/calendar/today", async (req: any, res: Response) => {
  try {
    if (!req.user?.claims?.sub) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const userId = req.user.claims.sub;
    const events = await calendarService.getTodayEvents(userId);

    res.json(events);
  } catch (error) {
    console.error("[CALENDAR API] Error fetching today's events:", error);
    res.status(500).json({ message: "Failed to fetch today's events" });
  }
});

/**
 * Get upcoming events
 */
calendarApiRouter.get("/api/calendar/upcoming", async (req: any, res: Response) => {
  try {
    if (!req.user?.claims?.sub) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const userId = req.user.claims.sub;
    const limit = req.query.limit ? parseInt(req.query.limit as string) : 10;

    const events = await calendarService.getUpcomingEvents(userId, limit);

    res.json(events);
  } catch (error) {
    console.error("[CALENDAR API] Error fetching upcoming events:", error);
    res.status(500).json({ message: "Failed to fetch upcoming events" });
  }
});

/**
 * Get single event
 */
calendarApiRouter.get("/api/calendar/events/:id", async (req: any, res: Response) => {
  try {
    if (!req.user?.claims?.sub) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const userId = req.user.claims.sub;
    const eventId = parseInt(req.params.id);

    const event = await calendarService.getEvent(eventId, userId);

    if (!event) {
      return res.status(404).json({ message: "Event not found" });
    }

    res.json(event);
  } catch (error) {
    console.error("[CALENDAR API] Error fetching event:", error);
    res.status(500).json({ message: "Failed to fetch event" });
  }
});

/**
 * Create calendar event
 */
calendarApiRouter.post("/api/calendar/events", async (req: any, res: Response) => {
  try {
    if (!req.user?.claims?.sub) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const userId = req.user.claims.sub;
    const eventData = insertCalendarEventSchema.parse({
      ...req.body,
      userId,
    });

    const event = await calendarService.createEvent(eventData);

    res.json(event);
  } catch (error) {
    console.error("[CALENDAR API] Error creating event:", error);
    res.status(500).json({ message: "Failed to create event" });
  }
});

/**
 * Update calendar event
 */
calendarApiRouter.put("/api/calendar/events/:id", async (req: any, res: Response) => {
  try {
    if (!req.user?.claims?.sub) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const userId = req.user.claims.sub;
    const eventId = parseInt(req.params.id);

    const event = await calendarService.updateEvent(eventId, userId, req.body);

    if (!event) {
      return res.status(404).json({ message: "Event not found" });
    }

    res.json(event);
  } catch (error) {
    console.error("[CALENDAR API] Error updating event:", error);
    res.status(500).json({ message: "Failed to update event" });
  }
});

/**
 * Delete calendar event
 */
calendarApiRouter.delete("/api/calendar/events/:id", async (req: any, res: Response) => {
  try {
    if (!req.user?.claims?.sub) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const userId = req.user.claims.sub;
    const eventId = parseInt(req.params.id);

    const deleted = await calendarService.deleteEvent(eventId, userId);

    if (!deleted) {
      return res.status(404).json({ message: "Event not found" });
    }

    res.json({ success: true });
  } catch (error) {
    console.error("[CALENDAR API] Error deleting event:", error);
    res.status(500).json({ message: "Failed to delete event" });
  }
});

/**
 * Complete event
 */
calendarApiRouter.post("/api/calendar/events/:id/complete", async (req: any, res: Response) => {
  try {
    if (!req.user?.claims?.sub) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const userId = req.user.claims.sub;
    const eventId = parseInt(req.params.id);

    const event = await calendarService.completeEvent(eventId, userId);

    if (!event) {
      return res.status(404).json({ message: "Event not found" });
    }

    res.json(event);
  } catch (error) {
    console.error("[CALENDAR API] Error completing event:", error);
    res.status(500).json({ message: "Failed to complete event" });
  }
});

/**
 * Cancel event
 */
calendarApiRouter.post("/api/calendar/events/:id/cancel", async (req: any, res: Response) => {
  try {
    if (!req.user?.claims?.sub) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const userId = req.user.claims.sub;
    const eventId = parseInt(req.params.id);

    const event = await calendarService.cancelEvent(eventId, userId);

    if (!event) {
      return res.status(404).json({ message: "Event not found" });
    }

    res.json(event);
  } catch (error) {
    console.error("[CALENDAR API] Error cancelling event:", error);
    res.status(500).json({ message: "Failed to cancel event" });
  }
});

/**
 * Get calendar sync settings
 */
calendarApiRouter.get("/api/calendar/sync-settings", async (req: any, res: Response) => {
  try {
    if (!req.user?.claims?.sub) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const userId = req.user.claims.sub;
    const settings = await calendarService.getSyncSettings(userId);

    // Don't expose sensitive tokens to the frontend
    if (settings) {
      res.json({
        ...settings,
        googleAccessToken: settings.googleAccessToken ? '***' : null,
        googleRefreshToken: settings.googleRefreshToken ? '***' : null,
        outlookAccessToken: settings.outlookAccessToken ? '***' : null,
        outlookRefreshToken: settings.outlookRefreshToken ? '***' : null,
      });
    } else {
      res.json(null);
    }
  } catch (error) {
    console.error("[CALENDAR API] Error fetching sync settings:", error);
    res.status(500).json({ message: "Failed to fetch sync settings" });
  }
});

/**
 * Disable Google Calendar sync
 */
calendarApiRouter.post("/api/calendar/sync/google/disable", async (req: any, res: Response) => {
  try {
    if (!req.user?.claims?.sub) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const userId = req.user.claims.sub;
    await calendarService.disableGoogleSync(userId);

    res.json({ success: true });
  } catch (error) {
    console.error("[CALENDAR API] Error disabling Google sync:", error);
    res.status(500).json({ message: "Failed to disable Google sync" });
  }
});

/**
 * Disable Outlook Calendar sync
 */
calendarApiRouter.post("/api/calendar/sync/outlook/disable", async (req: any, res: Response) => {
  try {
    if (!req.user?.claims?.sub) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const userId = req.user.claims.sub;
    await calendarService.disableOutlookSync(userId);

    res.json({ success: true });
  } catch (error) {
    console.error("[CALENDAR API] Error disabling Outlook sync:", error);
    res.status(500).json({ message: "Failed to disable Outlook sync" });
  }
});

/**
 * Get event statistics
 */
calendarApiRouter.get("/api/calendar/stats", async (req: any, res: Response) => {
  try {
    if (!req.user?.claims?.sub) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const userId = req.user.claims.sub;
    const stats = await calendarService.getEventStats(userId);

    res.json(stats);
  } catch (error) {
    console.error("[CALENDAR API] Error fetching stats:", error);
    res.status(500).json({ message: "Failed to fetch statistics" });
  }
});

/**
 * Get events by job ID
 */
calendarApiRouter.get("/api/calendar/jobs/:jobId/events", async (req: any, res: Response) => {
  try {
    if (!req.user?.claims?.sub) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const userId = req.user.claims.sub;
    const jobId = parseInt(req.params.jobId);

    const events = await calendarService.getEventsByJob(jobId, userId);

    res.json(events);
  } catch (error) {
    console.error("[CALENDAR API] Error fetching job events:", error);
    res.status(500).json({ message: "Failed to fetch job events" });
  }
});

export default calendarApiRouter;
