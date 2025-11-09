import { Router, Request, Response } from "express";
import { automationEngine } from "../services/automationEngine";
import { insertAutomationRuleSchema } from "@shared/schema";
import { z } from "zod";
import { automationRateLimit } from "../middleware/ai-rate-limit";

export const automationApiRouter = Router();

/**
 * Get all automation rules for the authenticated user
 */
automationApiRouter.get("/api/automation/rules", async (req: any, res: Response) => {
  try {
    const userId = req.user?.claims?.sub;
    if (!userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const rules = await automationEngine.getRules(userId);
    res.json(rules);
  } catch (error) {
    console.error('Error fetching automation rules:', error);
    res.status(500).json({
      message: error instanceof Error ? error.message : "Failed to fetch automation rules",
    });
  }
});

/**
 * Get a specific automation rule
 */
automationApiRouter.get("/api/automation/rules/:id", async (req: any, res: Response) => {
  try {
    const userId = req.user?.claims?.sub;
    if (!userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const ruleId = parseInt(req.params.id);
    if (isNaN(ruleId)) {
      return res.status(400).json({ message: "Invalid rule ID" });
    }

    const rule = await automationEngine.getRule(ruleId, userId);
    if (!rule) {
      return res.status(404).json({ message: "Rule not found" });
    }

    res.json(rule);
  } catch (error) {
    console.error('Error fetching automation rule:', error);
    res.status(500).json({
      message: error instanceof Error ? error.message : "Failed to fetch automation rule",
    });
  }
});

/**
 * Create a new automation rule
 */
automationApiRouter.post("/api/automation/rules", automationRateLimit, async (req: any, res: Response) => {
  try {
    const userId = req.user?.claims?.sub;
    if (!userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    // Validate request body
    const validatedData = insertAutomationRuleSchema.parse(req.body);

    const rule = await automationEngine.createRule(userId, validatedData);
    res.status(201).json(rule);
  } catch (error) {
    console.error('Error creating automation rule:', error);
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        message: "Validation error",
        errors: error.errors,
      });
    }
    res.status(500).json({
      message: error instanceof Error ? error.message : "Failed to create automation rule",
    });
  }
});

/**
 * Update an automation rule
 */
automationApiRouter.patch("/api/automation/rules/:id", async (req: any, res: Response) => {
  try {
    const userId = req.user?.claims?.sub;
    if (!userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const ruleId = parseInt(req.params.id);
    if (isNaN(ruleId)) {
      return res.status(400).json({ message: "Invalid rule ID" });
    }

    const rule = await automationEngine.updateRule(ruleId, userId, req.body);
    res.json(rule);
  } catch (error) {
    console.error('Error updating automation rule:', error);
    res.status(500).json({
      message: error instanceof Error ? error.message : "Failed to update automation rule",
    });
  }
});

/**
 * Delete an automation rule
 */
automationApiRouter.delete("/api/automation/rules/:id", async (req: any, res: Response) => {
  try {
    const userId = req.user?.claims?.sub;
    if (!userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const ruleId = parseInt(req.params.id);
    if (isNaN(ruleId)) {
      return res.status(400).json({ message: "Invalid rule ID" });
    }

    await automationEngine.deleteRule(ruleId, userId);
    res.status(204).send();
  } catch (error) {
    console.error('Error deleting automation rule:', error);
    res.status(500).json({
      message: error instanceof Error ? error.message : "Failed to delete automation rule",
    });
  }
});

/**
 * Toggle rule active status
 */
automationApiRouter.post("/api/automation/rules/:id/toggle", async (req: any, res: Response) => {
  try {
    const userId = req.user?.claims?.sub;
    if (!userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const ruleId = parseInt(req.params.id);
    if (isNaN(ruleId)) {
      return res.status(400).json({ message: "Invalid rule ID" });
    }

    const { isActive } = req.body;
    if (typeof isActive !== 'boolean') {
      return res.status(400).json({ message: "isActive must be a boolean" });
    }

    const rule = await automationEngine.toggleRule(ruleId, userId, isActive);
    res.json(rule);
  } catch (error) {
    console.error('Error toggling automation rule:', error);
    res.status(500).json({
      message: error instanceof Error ? error.message : "Failed to toggle automation rule",
    });
  }
});

/**
 * Get execution history for a rule
 */
automationApiRouter.get("/api/automation/rules/:id/executions", async (req: any, res: Response) => {
  try {
    const userId = req.user?.claims?.sub;
    if (!userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const ruleId = parseInt(req.params.id);
    if (isNaN(ruleId)) {
      return res.status(400).json({ message: "Invalid rule ID" });
    }

    const limit = req.query.limit ? parseInt(req.query.limit as string) : 50;
    const executions = await automationEngine.getExecutionHistory(ruleId, userId, limit);
    res.json(executions);
  } catch (error) {
    console.error('Error fetching execution history:', error);
    res.status(500).json({
      message: error instanceof Error ? error.message : "Failed to fetch execution history",
    });
  }
});

/**
 * Test an automation rule (dry run)
 */
automationApiRouter.post("/api/automation/rules/:id/test", automationRateLimit, async (req: any, res: Response) => {
  try {
    const userId = req.user?.claims?.sub;
    if (!userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const ruleId = parseInt(req.params.id);
    if (isNaN(ruleId)) {
      return res.status(400).json({ message: "Invalid rule ID" });
    }

    const rule = await automationEngine.getRule(ruleId, userId);
    if (!rule) {
      return res.status(404).json({ message: "Rule not found" });
    }

    // Use test context from request or default values
    const testContext = req.body.context || {
      userId,
      customerName: "Test Customer",
      customerEmail: "test@example.com",
      jobTitle: "Kitchen Renovation",
      amount: "$5,000",
    };

    // Execute rule in test mode (without actually sending emails/SMS)
    // TODO: Implement test mode flag in automation engine
    await automationEngine.executeRule(rule, testContext);

    res.json({
      message: "Rule test executed successfully",
      rule,
      testContext,
    });
  } catch (error) {
    console.error('Error testing automation rule:', error);
    res.status(500).json({
      message: error instanceof Error ? error.message : "Failed to test automation rule",
    });
  }
});

/**
 * Get all review requests
 */
automationApiRouter.get("/api/automation/reviews", async (req: any, res: Response) => {
  try {
    const userId = req.user?.claims?.sub;
    if (!userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const reviewRequests = await automationEngine.getReviewRequests(userId);
    res.json(reviewRequests);
  } catch (error) {
    console.error('Error fetching review requests:', error);
    res.status(500).json({
      message: error instanceof Error ? error.message : "Failed to fetch review requests",
    });
  }
});

/**
 * Track review link click (public endpoint)
 */
automationApiRouter.post("/api/automation/reviews/:token/click", async (req: Request, res: Response) => {
  try {
    const { token } = req.params;
    await automationEngine.trackReviewClick(token);
    res.json({ message: "Click tracked" });
  } catch (error) {
    console.error('Error tracking review click:', error);
    res.status(500).json({
      message: error instanceof Error ? error.message : "Failed to track click",
    });
  }
});

/**
 * Complete review submission (public endpoint)
 */
automationApiRouter.post("/api/automation/reviews/:token/complete", async (req: Request, res: Response) => {
  try {
    const { token } = req.params;
    const { rating, comment } = req.body;

    if (rating && (rating < 1 || rating > 5)) {
      return res.status(400).json({ message: "Rating must be between 1 and 5" });
    }

    await automationEngine.completeReview(token, rating, comment);
    res.json({ message: "Review completed successfully" });
  } catch (error) {
    console.error('Error completing review:', error);
    res.status(500).json({
      message: error instanceof Error ? error.message : "Failed to complete review",
    });
  }
});

/**
 * Trigger automation manually (for testing)
 */
automationApiRouter.post("/api/automation/trigger", automationRateLimit, async (req: any, res: Response) => {
  try {
    const userId = req.user?.claims?.sub;
    if (!userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const { triggerType, context } = req.body;

    if (!triggerType) {
      return res.status(400).json({ message: "triggerType is required" });
    }

    await automationEngine.processTrigger(triggerType, {
      ...context,
      userId,
    });

    res.json({ message: "Trigger processed successfully" });
  } catch (error) {
    console.error('Error processing trigger:', error);
    res.status(500).json({
      message: error instanceof Error ? error.message : "Failed to process trigger",
    });
  }
});
