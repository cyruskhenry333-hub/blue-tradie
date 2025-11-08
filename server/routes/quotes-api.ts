import { Router, type Request, type Response } from "express";
import { quoteService } from "../services/quoteService";
import { insertQuoteSchema } from "@shared/schema";
import { analyticsService } from "../services/analyticsService";

export const quotesApiRouter = Router();

/**
 * Create new quote
 */
quotesApiRouter.post("/api/quotes", async (req: any, res: Response) => {
  try {
    if (!req.user?.claims?.sub) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const userId = req.user.claims.sub;
    const quoteData = insertQuoteSchema.parse({ ...req.body, userId });

    const quote = await quoteService.createQuote(quoteData);

    // Track analytics
    await analyticsService.trackEvent({
      userId,
      eventType: 'quote_created',
      eventCategory: 'business',
      eventData: {
        quoteId: quote.id,
        customerName: quote.customerName,
        total: quote.total,
        lineItemsCount: (quote.lineItems as any[])?.length || 0,
      },
      req,
    });

    res.json(quote);
  } catch (error) {
    console.error("[QUOTES API] Error creating quote:", error);
    res.status(500).json({ message: "Failed to create quote" });
  }
});

/**
 * Get all quotes for user
 */
quotesApiRouter.get("/api/quotes", async (req: any, res: Response) => {
  try {
    if (!req.user?.claims?.sub) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const userId = req.user.claims.sub;
    const quotes = await quoteService.getQuotesByUser(userId);

    res.json(quotes);
  } catch (error) {
    console.error("[QUOTES API] Error fetching quotes:", error);
    res.status(500).json({ message: "Failed to fetch quotes" });
  }
});

/**
 * Get single quote
 */
quotesApiRouter.get("/api/quotes/:id", async (req: any, res: Response) => {
  try {
    if (!req.user?.claims?.sub) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const userId = req.user.claims.sub;
    const quoteId = parseInt(req.params.id);

    const quote = await quoteService.getQuote(quoteId, userId);

    if (!quote) {
      return res.status(404).json({ message: "Quote not found" });
    }

    res.json(quote);
  } catch (error) {
    console.error("[QUOTES API] Error fetching quote:", error);
    res.status(500).json({ message: "Failed to fetch quote" });
  }
});

/**
 * Update quote
 */
quotesApiRouter.put("/api/quotes/:id", async (req: any, res: Response) => {
  try {
    if (!req.user?.claims?.sub) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const userId = req.user.claims.sub;
    const quoteId = parseInt(req.params.id);

    const quote = await quoteService.updateQuote(quoteId, userId, req.body);

    if (!quote) {
      return res.status(404).json({ message: "Quote not found" });
    }

    res.json(quote);
  } catch (error) {
    console.error("[QUOTES API] Error updating quote:", error);
    res.status(500).json({ message: "Failed to update quote" });
  }
});

/**
 * Send quote to customer
 */
quotesApiRouter.post("/api/quotes/:id/send", async (req: any, res: Response) => {
  try {
    if (!req.user?.claims?.sub) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const userId = req.user.claims.sub;
    const quoteId = parseInt(req.params.id);

    const result = await quoteService.sendQuote(quoteId, userId);

    // Track analytics
    await analyticsService.trackEvent({
      userId,
      eventType: 'quote_sent',
      eventCategory: 'business',
      eventData: {
        quoteId,
        portalUrl: result.portalUrl,
      },
      req,
    });

    res.json(result);
  } catch (error) {
    console.error("[QUOTES API] Error sending quote:", error);
    res.status(500).json({ message: (error as Error).message || "Failed to send quote" });
  }
});

/**
 * Get quote statistics
 */
quotesApiRouter.get("/api/quotes/stats/summary", async (req: any, res: Response) => {
  try {
    if (!req.user?.claims?.sub) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const userId = req.user.claims.sub;
    const stats = await quoteService.getQuoteStats(userId);

    res.json(stats);
  } catch (error) {
    console.error("[QUOTES API] Error fetching quote stats:", error);
    res.status(500).json({ message: "Failed to fetch quote statistics" });
  }
});

export default quotesApiRouter;
