import { Router, Response } from "express";
import { accountingService } from "../services/accountingService";
import { insertTaxSettingsSchema } from "@shared/schema";
import { z } from "zod";

export const accountingApiRouter = Router();

/**
 * Get tax settings for authenticated user
 */
accountingApiRouter.get("/api/accounting/settings", async (req: any, res: Response) => {
  try {
    const userId = req.user?.claims?.sub;
    if (!userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const settings = await accountingService.getTaxSettings(userId);
    res.json(settings);
  } catch (error) {
    console.error('Error fetching tax settings:', error);
    res.status(500).json({
      message: error instanceof Error ? error.message : "Failed to fetch tax settings",
    });
  }
});

/**
 * Update tax settings
 */
accountingApiRouter.patch("/api/accounting/settings", async (req: any, res: Response) => {
  try {
    const userId = req.user?.claims?.sub;
    if (!userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const settings = await accountingService.updateTaxSettings(userId, req.body);
    res.json(settings);
  } catch (error) {
    console.error('Error updating tax settings:', error);
    res.status(500).json({
      message: error instanceof Error ? error.message : "Failed to update tax settings",
    });
  }
});

/**
 * Get BAS reports
 */
accountingApiRouter.get("/api/accounting/bas", async (req: any, res: Response) => {
  try {
    const userId = req.user?.claims?.sub;
    if (!userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const reports = await accountingService.getBasReports(userId);
    res.json(reports);
  } catch (error) {
    console.error('Error fetching BAS reports:', error);
    res.status(500).json({
      message: error instanceof Error ? error.message : "Failed to fetch BAS reports",
    });
  }
});

/**
 * Get a specific BAS report
 */
accountingApiRouter.get("/api/accounting/bas/:id", async (req: any, res: Response) => {
  try {
    const userId = req.user?.claims?.sub;
    if (!userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const reportId = parseInt(req.params.id);
    if (isNaN(reportId)) {
      return res.status(400).json({ message: "Invalid report ID" });
    }

    const report = await accountingService.getBasReport(reportId, userId);
    if (!report) {
      return res.status(404).json({ message: "BAS report not found" });
    }

    res.json(report);
  } catch (error) {
    console.error('Error fetching BAS report:', error);
    res.status(500).json({
      message: error instanceof Error ? error.message : "Failed to fetch BAS report",
    });
  }
});

/**
 * Generate BAS report for a quarter
 */
accountingApiRouter.post("/api/accounting/bas/generate", async (req: any, res: Response) => {
  try {
    const userId = req.user?.claims?.sub;
    if (!userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const { quarter } = req.body;
    if (!quarter) {
      return res.status(400).json({ message: "Quarter is required (e.g., 'Q1 2025')" });
    }

    const report = await accountingService.generateBasReport(userId, quarter);
    res.status(201).json(report);
  } catch (error) {
    console.error('Error generating BAS report:', error);
    res.status(500).json({
      message: error instanceof Error ? error.message : "Failed to generate BAS report",
    });
  }
});

/**
 * Submit BAS report
 */
accountingApiRouter.post("/api/accounting/bas/:id/submit", async (req: any, res: Response) => {
  try {
    const userId = req.user?.claims?.sub;
    if (!userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const reportId = parseInt(req.params.id);
    if (isNaN(reportId)) {
      return res.status(400).json({ message: "Invalid report ID" });
    }

    const report = await accountingService.submitBasReport(reportId, userId);
    res.json(report);
  } catch (error) {
    console.error('Error submitting BAS report:', error);
    res.status(500).json({
      message: error instanceof Error ? error.message : "Failed to submit BAS report",
    });
  }
});

/**
 * Mark BAS report as paid
 */
accountingApiRouter.post("/api/accounting/bas/:id/paid", async (req: any, res: Response) => {
  try {
    const userId = req.user?.claims?.sub;
    if (!userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const reportId = parseInt(req.params.id);
    if (isNaN(reportId)) {
      return res.status(400).json({ message: "Invalid report ID" });
    }

    const report = await accountingService.markBasPaid(reportId, userId);
    res.json(report);
  } catch (error) {
    console.error('Error marking BAS as paid:', error);
    res.status(500).json({
      message: error instanceof Error ? error.message : "Failed to mark BAS as paid",
    });
  }
});

/**
 * Get tax categories
 */
accountingApiRouter.get("/api/accounting/categories", async (req: any, res: Response) => {
  try {
    const categories = await accountingService.getTaxCategories();
    res.json(categories);
  } catch (error) {
    console.error('Error fetching tax categories:', error);
    res.status(500).json({
      message: error instanceof Error ? error.message : "Failed to fetch tax categories",
    });
  }
});

/**
 * Get tax deduction suggestions
 */
accountingApiRouter.get("/api/accounting/suggestions", async (req: any, res: Response) => {
  try {
    const userId = req.user?.claims?.sub;
    if (!userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const suggestions = await accountingService.getTaxSuggestions(userId);
    res.json(suggestions);
  } catch (error) {
    console.error('Error fetching tax suggestions:', error);
    res.status(500).json({
      message: error instanceof Error ? error.message : "Failed to fetch tax suggestions",
    });
  }
});

/**
 * Generate new tax suggestions using AI
 */
accountingApiRouter.post("/api/accounting/suggestions/generate", async (req: any, res: Response) => {
  try {
    const userId = req.user?.claims?.sub;
    if (!userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const suggestions = await accountingService.generateTaxSuggestions(userId);
    res.json(suggestions);
  } catch (error) {
    console.error('Error generating tax suggestions:', error);
    res.status(500).json({
      message: error instanceof Error ? error.message : "Failed to generate tax suggestions",
    });
  }
});

/**
 * Accept tax deduction suggestion
 */
accountingApiRouter.post("/api/accounting/suggestions/:id/accept", async (req: any, res: Response) => {
  try {
    const userId = req.user?.claims?.sub;
    if (!userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const suggestionId = parseInt(req.params.id);
    if (isNaN(suggestionId)) {
      return res.status(400).json({ message: "Invalid suggestion ID" });
    }

    const { notes } = req.body;
    const suggestion = await accountingService.acceptTaxSuggestion(suggestionId, userId, notes);
    res.json(suggestion);
  } catch (error) {
    console.error('Error accepting tax suggestion:', error);
    res.status(500).json({
      message: error instanceof Error ? error.message : "Failed to accept tax suggestion",
    });
  }
});

/**
 * Dismiss tax deduction suggestion
 */
accountingApiRouter.post("/api/accounting/suggestions/:id/dismiss", async (req: any, res: Response) => {
  try {
    const userId = req.user?.claims?.sub;
    if (!userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const suggestionId = parseInt(req.params.id);
    if (isNaN(suggestionId)) {
      return res.status(400).json({ message: "Invalid suggestion ID" });
    }

    const { notes } = req.body;
    const suggestion = await accountingService.dismissTaxSuggestion(suggestionId, userId, notes);
    res.json(suggestion);
  } catch (error) {
    console.error('Error dismissing tax suggestion:', error);
    res.status(500).json({
      message: error instanceof Error ? error.message : "Failed to dismiss tax suggestion",
    });
  }
});

/**
 * Get tax summary for dashboard
 */
accountingApiRouter.get("/api/accounting/summary", async (req: any, res: Response) => {
  try {
    const userId = req.user?.claims?.sub;
    if (!userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const summary = await accountingService.getTaxSummary(userId);
    res.json(summary);
  } catch (error) {
    console.error('Error fetching tax summary:', error);
    res.status(500).json({
      message: error instanceof Error ? error.message : "Failed to fetch tax summary",
    });
  }
});

/**
 * Get current quarter
 */
accountingApiRouter.get("/api/accounting/current-quarter", async (req: any, res: Response) => {
  try {
    const quarter = accountingService.getCurrentQuarter();
    res.json({ quarter });
  } catch (error) {
    console.error('Error getting current quarter:', error);
    res.status(500).json({
      message: error instanceof Error ? error.message : "Failed to get current quarter",
    });
  }
});
