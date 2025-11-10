import { Router, type Request, type Response } from "express";
import { documentService } from "../services/documentService";
import multer from "multer";
import path from "path";
import {
  validateUploadedFile,
  getFileSizeLimits,
  getAllowedMimeTypes,
  setDownloadSecurityHeaders
} from "../middleware/file-security";
import rateLimit from "express-rate-limit";

export const documentsApiRouter = Router();

// Rate limiter for file uploads
const uploadRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 20, // Max 20 uploads per 15 minutes per user
  message: { error: 'Too many file uploads. Please try again later.' },
  keyGenerator: (req: any) => req.user?.claims?.sub || req.ip,
});

// Configure multer for file uploads
const storage = multer.memoryStorage(); // Store in memory for processing
const { maxSizeBytes } = getFileSizeLimits();
const upload = multer({
  storage,
  limits: {
    fileSize: maxSizeBytes,
    files: 1, // Only allow 1 file per request
  },
  fileFilter: (req, file, cb) => {
    const allowedMimes = getAllowedMimeTypes();

    if (allowedMimes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error(`Invalid file type: ${file.mimetype}`));
    }
  },
});

/**
 * Upload document
 */
documentsApiRouter.post(
  "/api/documents/upload",
  uploadRateLimit,
  upload.single('file'),
  async (req: any, res: Response) => {
    try {
      if (!req.user?.claims?.sub) {
        return res.status(401).json({ message: "Unauthorized" });
      }

      if (!req.file) {
        return res.status(400).json({ message: "No file uploaded" });
      }

      const userId = req.user.claims.sub;

      // Enhanced file validation (magic numbers, extension, sanitization)
      const securityValidation = validateUploadedFile(req.file);
      if (!securityValidation.valid) {
        return res.status(400).json({ message: securityValidation.error });
      }

      const {
        documentType = 'other',
        jobId,
        invoiceId,
        quoteId,
        expenseId,
        title,
        description,
        category,
        tags,
      } = req.body;

      // Additional validation via documentService
      const validation = documentService.validateFile({
        size: req.file.size,
        mimeType: req.file.mimetype,
      });

      if (!validation.valid) {
        return res.status(400).json({ message: validation.error });
      }

      // Upload file with sanitized filename
      const document = await documentService.uploadLocal(
        userId,
        {
          originalName: securityValidation.sanitizedFilename || req.file.originalname,
          buffer: req.file.buffer,
          mimeType: req.file.mimetype,
          size: req.file.size,
        },
        {
          documentType,
          jobId: jobId ? parseInt(jobId) : undefined,
          invoiceId: invoiceId ? parseInt(invoiceId) : undefined,
          quoteId: quoteId ? parseInt(quoteId) : undefined,
          expenseId: expenseId ? parseInt(expenseId) : undefined,
          title,
          description,
          category,
          tags: tags ? JSON.parse(tags) : undefined,
        }
      );

      // Log access
      await documentService.logAccess(document.id, userId, 'view', {
        ipAddress: req.ip,
        userAgent: req.get('user-agent'),
      });

      res.json(document);
    } catch (error) {
      console.error("[DOCUMENTS API] Error uploading file:", error);
      res.status(500).json({
        message: (error as Error).message || "Failed to upload file",
      });
    }
  }
);

/**
 * Get all documents for user
 */
documentsApiRouter.get("/api/documents", async (req: any, res: Response) => {
  try {
    if (!req.user?.claims?.sub) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const userId = req.user.claims.sub;
    const { type } = req.query;

    let documents;
    if (type) {
      documents = await documentService.getDocumentsByType(userId, type as string);
    } else {
      documents = await documentService.getDocumentsByUser(userId);
    }

    res.json(documents);
  } catch (error) {
    console.error("[DOCUMENTS API] Error fetching documents:", error);
    res.status(500).json({ message: "Failed to fetch documents" });
  }
});

/**
 * Get single document
 */
documentsApiRouter.get("/api/documents/:id", async (req: any, res: Response) => {
  try {
    if (!req.user?.claims?.sub) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const userId = req.user.claims.sub;
    const documentId = parseInt(req.params.id);

    const document = await documentService.getDocument(documentId, userId);

    if (!document) {
      return res.status(404).json({ message: "Document not found" });
    }

    // Log access
    await documentService.logAccess(documentId, userId, 'view', {
      ipAddress: req.ip,
      userAgent: req.get('user-agent'),
    });

    res.json(document);
  } catch (error) {
    console.error("[DOCUMENTS API] Error fetching document:", error);
    res.status(500).json({ message: "Failed to fetch document" });
  }
});

/**
 * Download document
 */
documentsApiRouter.get("/api/documents/:id/download", async (req: any, res: Response) => {
  try {
    if (!req.user?.claims?.sub) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const userId = req.user.claims.sub;
    const documentId = parseInt(req.params.id);

    const document = await documentService.getDocument(documentId, userId);

    if (!document) {
      return res.status(404).json({ message: "Document not found" });
    }

    // Log download
    await documentService.logAccess(documentId, userId, 'download', {
      ipAddress: req.ip,
      userAgent: req.get('user-agent'),
    });

    // Set security headers and download file
    setDownloadSecurityHeaders(res, document.originalFileName);
    const filePath = documentService.getFilePath(document);
    res.download(filePath, document.originalFileName);
  } catch (error) {
    console.error("[DOCUMENTS API] Error downloading document:", error);
    res.status(500).json({ message: "Failed to download document" });
  }
});

/**
 * Get documents by job
 */
documentsApiRouter.get("/api/jobs/:jobId/documents", async (req: any, res: Response) => {
  try {
    if (!req.user?.claims?.sub) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const userId = req.user.claims.sub;
    const jobId = parseInt(req.params.jobId);

    const documents = await documentService.getDocumentsByJob(jobId, userId);

    res.json(documents);
  } catch (error) {
    console.error("[DOCUMENTS API] Error fetching job documents:", error);
    res.status(500).json({ message: "Failed to fetch documents" });
  }
});

/**
 * Get documents by invoice
 */
documentsApiRouter.get("/api/invoices/:invoiceId/documents", async (req: any, res: Response) => {
  try {
    if (!req.user?.claims?.sub) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const userId = req.user.claims.sub;
    const invoiceId = parseInt(req.params.invoiceId);

    const documents = await documentService.getDocumentsByInvoice(invoiceId, userId);

    res.json(documents);
  } catch (error) {
    console.error("[DOCUMENTS API] Error fetching invoice documents:", error);
    res.status(500).json({ message: "Failed to fetch documents" });
  }
});

/**
 * Get documents by quote
 */
documentsApiRouter.get("/api/quotes/:quoteId/documents", async (req: any, res: Response) => {
  try {
    if (!req.user?.claims?.sub) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const userId = req.user.claims.sub;
    const quoteId = parseInt(req.params.quoteId);

    const documents = await documentService.getDocumentsByQuote(quoteId, userId);

    res.json(documents);
  } catch (error) {
    console.error("[DOCUMENTS API] Error fetching quote documents:", error);
    res.status(500).json({ message: "Failed to fetch documents" });
  }
});

/**
 * Update document metadata
 */
documentsApiRouter.put("/api/documents/:id", async (req: any, res: Response) => {
  try {
    if (!req.user?.claims?.sub) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const userId = req.user.claims.sub;
    const documentId = parseInt(req.params.id);

    const document = await documentService.updateDocument(documentId, userId, req.body);

    if (!document) {
      return res.status(404).json({ message: "Document not found" });
    }

    res.json(document);
  } catch (error) {
    console.error("[DOCUMENTS API] Error updating document:", error);
    res.status(500).json({ message: "Failed to update document" });
  }
});

/**
 * Delete document
 */
documentsApiRouter.delete("/api/documents/:id", async (req: any, res: Response) => {
  try {
    if (!req.user?.claims?.sub) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const userId = req.user.claims.sub;
    const documentId = parseInt(req.params.id);

    // Log deletion before deleting
    await documentService.logAccess(documentId, userId, 'delete', {
      ipAddress: req.ip,
      userAgent: req.get('user-agent'),
    });

    const deleted = await documentService.deleteDocument(documentId, userId);

    if (!deleted) {
      return res.status(404).json({ message: "Document not found" });
    }

    res.json({ success: true });
  } catch (error) {
    console.error("[DOCUMENTS API] Error deleting document:", error);
    res.status(500).json({ message: "Failed to delete document" });
  }
});

/**
 * Toggle document public status
 */
documentsApiRouter.post("/api/documents/:id/toggle-public", async (req: any, res: Response) => {
  try {
    if (!req.user?.claims?.sub) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const userId = req.user.claims.sub;
    const documentId = parseInt(req.params.id);

    const document = await documentService.togglePublic(documentId, userId);

    if (!document) {
      return res.status(404).json({ message: "Document not found" });
    }

    // Log share action if making public
    if (document.isPublic) {
      await documentService.logAccess(documentId, userId, 'share', {
        ipAddress: req.ip,
        userAgent: req.get('user-agent'),
      });
    }

    res.json(document);
  } catch (error) {
    console.error("[DOCUMENTS API] Error toggling public status:", error);
    res.status(500).json({ message: "Failed to toggle public status" });
  }
});

/**
 * Get document statistics
 */
documentsApiRouter.get("/api/documents/stats/summary", async (req: any, res: Response) => {
  try {
    if (!req.user?.claims?.sub) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const userId = req.user.claims.sub;
    const stats = await documentService.getDocumentStats(userId);

    res.json(stats);
  } catch (error) {
    console.error("[DOCUMENTS API] Error fetching stats:", error);
    res.status(500).json({ message: "Failed to fetch statistics" });
  }
});

/**
 * Get document access logs
 */
documentsApiRouter.get("/api/documents/:id/access-logs", async (req: any, res: Response) => {
  try {
    if (!req.user?.claims?.sub) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const userId = req.user.claims.sub;
    const documentId = parseInt(req.params.id);

    const logs = await documentService.getAccessLogs(documentId, userId);

    res.json(logs);
  } catch (error) {
    console.error("[DOCUMENTS API] Error fetching access logs:", error);
    res.status(500).json({ message: "Failed to fetch access logs" });
  }
});

/**
 * Get public documents for a job (for customer access)
 */
documentsApiRouter.get("/api/public/jobs/:jobId/documents", async (req: Request, res: Response) => {
  try {
    const jobId = parseInt(req.params.jobId);
    const documents = await documentService.getPublicDocuments(jobId);

    res.json(documents);
  } catch (error) {
    console.error("[DOCUMENTS API] Error fetching public documents:", error);
    res.status(500).json({ message: "Failed to fetch documents" });
  }
});

export default documentsApiRouter;
