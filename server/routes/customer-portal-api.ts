import { Router, type Request, type Response } from "express";
import { customerPortalService } from "../services/customerPortalService";
import { quoteService } from "../services/quoteService";

export const customerPortalApiRouter = Router();

/**
 * Verify customer portal token and get accessible resources
 */
customerPortalApiRouter.get("/api/portal/verify", async (req: Request, res: Response) => {
  try {
    const token = req.query.token as string;

    if (!token) {
      return res.status(400).json({ message: "Token required" });
    }

    const verification = await customerPortalService.verifyPortalToken(token);

    if (!verification.valid) {
      return res.status(401).json({ message: "Invalid or expired token" });
    }

    res.json(verification);
  } catch (error) {
    console.error("[CUSTOMER PORTAL] Error verifying token:", error);
    res.status(500).json({ message: "Failed to verify token" });
  }
});

/**
 * Get customer's quotes
 */
customerPortalApiRouter.get("/api/portal/quotes", async (req: Request, res: Response) => {
  try {
    const token = req.query.token as string;

    if (!token) {
      return res.status(400).json({ message: "Token required" });
    }

    const verification = await customerPortalService.verifyPortalToken(token);

    if (!verification.valid || !verification.userId || !verification.customerEmail) {
      return res.status(401).json({ message: "Invalid or expired token" });
    }

    const quotes = await customerPortalService.getCustomerQuotes(
      verification.customerEmail,
      verification.userId
    );

    res.json(quotes);
  } catch (error) {
    console.error("[CUSTOMER PORTAL] Error fetching quotes:", error);
    res.status(500).json({ message: "Failed to fetch quotes" });
  }
});

/**
 * Get specific quote
 */
customerPortalApiRouter.get("/api/portal/quotes/:id", async (req: Request, res: Response) => {
  try {
    const token = req.query.token as string;
    const quoteId = parseInt(req.params.id);

    if (!token) {
      return res.status(400).json({ message: "Token required" });
    }

    const verification = await customerPortalService.verifyPortalToken(token);

    if (!verification.valid || !verification.quoteIds) {
      return res.status(401).json({ message: "Invalid or expired token" });
    }

    const quote = await customerPortalService.getQuote(quoteId, verification.quoteIds);

    if (!quote) {
      return res.status(404).json({ message: "Quote not found or access denied" });
    }

    // Mark as viewed
    await quoteService.markQuoteAsViewed(quoteId);

    res.json(quote);
  } catch (error) {
    console.error("[CUSTOMER PORTAL] Error fetching quote:", error);
    res.status(500).json({ message: "Failed to fetch quote" });
  }
});

/**
 * Accept quote
 */
customerPortalApiRouter.post("/api/portal/quotes/:id/accept", async (req: Request, res: Response) => {
  try {
    const token = req.query.token as string;
    const quoteId = parseInt(req.params.id);
    const { customerNotes } = req.body;

    if (!token) {
      return res.status(400).json({ message: "Token required" });
    }

    const verification = await customerPortalService.verifyPortalToken(token);

    if (!verification.valid || !verification.quoteIds?.includes(quoteId)) {
      return res.status(401).json({ message: "Invalid or expired token" });
    }

    const result = await quoteService.acceptQuote(quoteId, customerNotes);

    res.json(result);
  } catch (error) {
    console.error("[CUSTOMER PORTAL] Error accepting quote:", error);
    res.status(500).json({ message: (error as Error).message || "Failed to accept quote" });
  }
});

/**
 * Reject quote
 */
customerPortalApiRouter.post("/api/portal/quotes/:id/reject", async (req: Request, res: Response) => {
  try {
    const token = req.query.token as string;
    const quoteId = parseInt(req.params.id);
    const { customerNotes } = req.body;

    if (!token) {
      return res.status(400).json({ message: "Token required" });
    }

    const verification = await customerPortalService.verifyPortalToken(token);

    if (!verification.valid || !verification.quoteIds?.includes(quoteId)) {
      return res.status(401).json({ message: "Invalid or expired token" });
    }

    const quote = await quoteService.rejectQuote(quoteId, customerNotes);

    res.json(quote);
  } catch (error) {
    console.error("[CUSTOMER PORTAL] Error rejecting quote:", error);
    res.status(500).json({ message: "Failed to reject quote" });
  }
});

/**
 * Get customer's invoices
 */
customerPortalApiRouter.get("/api/portal/invoices", async (req: Request, res: Response) => {
  try {
    const token = req.query.token as string;

    if (!token) {
      return res.status(400).json({ message: "Token required" });
    }

    const verification = await customerPortalService.verifyPortalToken(token);

    if (!verification.valid || !verification.userId || !verification.customerEmail) {
      return res.status(401).json({ message: "Invalid or expired token" });
    }

    const invoices = await customerPortalService.getCustomerInvoices(
      verification.customerEmail,
      verification.userId
    );

    res.json(invoices);
  } catch (error) {
    console.error("[CUSTOMER PORTAL] Error fetching invoices:", error);
    res.status(500).json({ message: "Failed to fetch invoices" });
  }
});

/**
 * Get specific invoice
 */
customerPortalApiRouter.get("/api/portal/invoices/:id", async (req: Request, res: Response) => {
  try {
    const token = req.query.token as string;
    const invoiceId = parseInt(req.params.id);

    if (!token) {
      return res.status(400).json({ message: "Token required" });
    }

    const verification = await customerPortalService.verifyPortalToken(token);

    if (!verification.valid || !verification.invoiceIds) {
      return res.status(401).json({ message: "Invalid or expired token" });
    }

    const invoice = await customerPortalService.getInvoice(invoiceId, verification.invoiceIds);

    if (!invoice) {
      return res.status(404).json({ message: "Invoice not found or access denied" });
    }

    res.json(invoice);
  } catch (error) {
    console.error("[CUSTOMER PORTAL] Error fetching invoice:", error);
    res.status(500).json({ message: "Failed to fetch invoice" });
  }
});

/**
 * Get customer's jobs
 */
customerPortalApiRouter.get("/api/portal/jobs", async (req: Request, res: Response) => {
  try {
    const token = req.query.token as string;

    if (!token) {
      return res.status(400).json({ message: "Token required" });
    }

    const verification = await customerPortalService.verifyPortalToken(token);

    if (!verification.valid || !verification.jobIds) {
      return res.status(401).json({ message: "Invalid or expired token" });
    }

    const jobs = await customerPortalService.getCustomerJobs(verification.jobIds);

    res.json(jobs);
  } catch (error) {
    console.error("[CUSTOMER PORTAL] Error fetching jobs:", error);
    res.status(500).json({ message: "Failed to fetch jobs" });
  }
});

export default customerPortalApiRouter;
