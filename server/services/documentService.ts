import { db } from "../db";
import {
  documents,
  documentAccessLogs,
  type Document,
  type InsertDocument,
  type InsertDocumentAccessLog,
} from "@shared/schema";
import { eq, and, desc } from "drizzle-orm";
import path from "path";
import fs from "fs/promises";
import crypto from "crypto";

export class DocumentService {
  private uploadDir: string;

  constructor() {
    // Default upload directory - can be overridden with env var
    this.uploadDir = process.env.UPLOAD_DIR || path.join(process.cwd(), 'uploads');
    this.ensureUploadDir();
  }

  /**
   * Ensure upload directory exists
   */
  private async ensureUploadDir() {
    try {
      await fs.mkdir(this.uploadDir, { recursive: true });

      // Create subdirectories for different document types
      const subdirs = ['photos', 'invoices', 'quotes', 'receipts', 'contracts', 'other'];
      for (const subdir of subdirs) {
        await fs.mkdir(path.join(this.uploadDir, subdir), { recursive: true });
      }
    } catch (error) {
      console.error('[DOCUMENT SERVICE] Error creating upload directories:', error);
    }
  }

  /**
   * Generate unique filename
   */
  private generateFileName(originalName: string): string {
    const ext = path.extname(originalName);
    const timestamp = Date.now();
    const randomBytes = crypto.randomBytes(8).toString('hex');
    return `${timestamp}-${randomBytes}${ext}`;
  }

  /**
   * Get subdirectory for document type
   */
  private getSubdirectory(documentType: string): string {
    const validTypes = ['photo', 'invoice', 'quote', 'receipt', 'contract', 'other'];
    return validTypes.includes(documentType) ? documentType + 's' : 'other';
  }

  /**
   * Create document record
   */
  async createDocument(documentData: InsertDocument): Promise<Document> {
    const [document] = await db.insert(documents).values(documentData).returning();
    return document;
  }

  /**
   * Upload file locally
   */
  async uploadLocal(
    userId: string,
    file: {
      originalName: string;
      buffer: Buffer;
      mimeType: string;
      size: number;
    },
    options: {
      documentType: string;
      jobId?: number;
      invoiceId?: number;
      quoteId?: number;
      expenseId?: number;
      title?: string;
      description?: string;
      category?: string;
      tags?: string[];
    }
  ): Promise<Document> {
    const fileName = this.generateFileName(file.originalName);
    const subdir = this.getSubdirectory(options.documentType);
    const relativePath = path.join(subdir, fileName);
    const fullPath = path.join(this.uploadDir, relativePath);

    // Save file to disk
    await fs.writeFile(fullPath, file.buffer);

    // Create document record
    const document = await this.createDocument({
      userId,
      fileName,
      originalFileName: file.originalName,
      fileSize: file.size,
      mimeType: file.mimeType,
      fileExtension: path.extname(file.originalName).toLowerCase(),
      storageProvider: 'local',
      storagePath: relativePath,
      documentType: options.documentType,
      category: options.category,
      jobId: options.jobId,
      invoiceId: options.invoiceId,
      quoteId: options.quoteId,
      expenseId: options.expenseId,
      title: options.title,
      description: options.description,
      tags: options.tags,
      uploadedBy: userId,
    });

    return document;
  }

  /**
   * Get document by ID
   */
  async getDocument(documentId: number, userId: string): Promise<Document | null> {
    const [document] = await db
      .select()
      .from(documents)
      .where(
        and(
          eq(documents.id, documentId),
          eq(documents.userId, userId)
        )
      )
      .limit(1);

    return document || null;
  }

  /**
   * Get documents by user
   */
  async getDocumentsByUser(userId: string): Promise<Document[]> {
    return await db
      .select()
      .from(documents)
      .where(eq(documents.userId, userId))
      .orderBy(desc(documents.createdAt));
  }

  /**
   * Get documents by job
   */
  async getDocumentsByJob(jobId: number, userId: string): Promise<Document[]> {
    return await db
      .select()
      .from(documents)
      .where(
        and(
          eq(documents.jobId, jobId),
          eq(documents.userId, userId)
        )
      )
      .orderBy(desc(documents.createdAt));
  }

  /**
   * Get documents by invoice
   */
  async getDocumentsByInvoice(invoiceId: number, userId: string): Promise<Document[]> {
    return await db
      .select()
      .from(documents)
      .where(
        and(
          eq(documents.invoiceId, invoiceId),
          eq(documents.userId, userId)
        )
      )
      .orderBy(desc(documents.createdAt));
  }

  /**
   * Get documents by quote
   */
  async getDocumentsByQuote(quoteId: number, userId: string): Promise<Document[]> {
    return await db
      .select()
      .from(documents)
      .where(
        and(
          eq(documents.quoteId, quoteId),
          eq(documents.userId, userId)
        )
      )
      .orderBy(desc(documents.createdAt));
  }

  /**
   * Get documents by type
   */
  async getDocumentsByType(userId: string, documentType: string): Promise<Document[]> {
    return await db
      .select()
      .from(documents)
      .where(
        and(
          eq(documents.userId, userId),
          eq(documents.documentType, documentType)
        )
      )
      .orderBy(desc(documents.createdAt));
  }

  /**
   * Update document metadata
   */
  async updateDocument(
    documentId: number,
    userId: string,
    updates: Partial<InsertDocument>
  ): Promise<Document | null> {
    const [updated] = await db
      .update(documents)
      .set({
        ...updates,
        updatedAt: new Date(),
      })
      .where(
        and(
          eq(documents.id, documentId),
          eq(documents.userId, userId)
        )
      )
      .returning();

    return updated || null;
  }

  /**
   * Delete document
   */
  async deleteDocument(documentId: number, userId: string): Promise<boolean> {
    // Get document first to delete file
    const document = await this.getDocument(documentId, userId);
    if (!document) return false;

    // Delete file from disk if local storage
    if (document.storageProvider === 'local') {
      try {
        const fullPath = path.join(this.uploadDir, document.storagePath);
        await fs.unlink(fullPath);

        // Delete thumbnail if exists
        if (document.thumbnailPath) {
          const thumbPath = path.join(this.uploadDir, document.thumbnailPath);
          await fs.unlink(thumbPath).catch(() => {}); // Ignore if doesn't exist
        }
      } catch (error) {
        console.error('[DOCUMENT SERVICE] Error deleting file:', error);
      }
    }

    // Delete database record
    const result = await db
      .delete(documents)
      .where(
        and(
          eq(documents.id, documentId),
          eq(documents.userId, userId)
        )
      );

    return result.rowCount ? result.rowCount > 0 : false;
  }

  /**
   * Get file path for download
   */
  getFilePath(document: Document): string {
    if (document.storageProvider === 'local') {
      return path.join(this.uploadDir, document.storagePath);
    }
    // For S3/GCS, return the full URL
    return document.storagePath;
  }

  /**
   * Log document access
   */
  async logAccess(
    documentId: number,
    userId: string | null,
    action: 'view' | 'download' | 'delete' | 'share',
    metadata?: {
      ipAddress?: string;
      userAgent?: string;
    }
  ): Promise<void> {
    await db.insert(documentAccessLogs).values({
      documentId,
      userId,
      action,
      ipAddress: metadata?.ipAddress,
      userAgent: metadata?.userAgent,
    });

    // Increment download count if downloading
    if (action === 'download') {
      await db
        .update(documents)
        .set({
          downloadCount: db.raw('download_count + 1'),
          accessedAt: new Date(),
        })
        .where(eq(documents.id, documentId));
    }
  }

  /**
   * Get access logs for a document
   */
  async getAccessLogs(documentId: number, userId: string): Promise<any[]> {
    // Verify user owns the document
    const document = await this.getDocument(documentId, userId);
    if (!document) return [];

    return await db
      .select()
      .from(documentAccessLogs)
      .where(eq(documentAccessLogs.documentId, documentId))
      .orderBy(desc(documentAccessLogs.accessedAt));
  }

  /**
   * Get document statistics
   */
  async getDocumentStats(userId: string): Promise<{
    total: number;
    byType: Record<string, number>;
    totalSize: number;
    recentUploads: number;
  }> {
    const allDocs = await db
      .select()
      .from(documents)
      .where(eq(documents.userId, userId));

    const byType: Record<string, number> = {};
    let totalSize = 0;

    for (const doc of allDocs) {
      byType[doc.documentType] = (byType[doc.documentType] || 0) + 1;
      totalSize += doc.fileSize;
    }

    // Count recent uploads (last 7 days)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const recentUploads = allDocs.filter(
      doc => new Date(doc.createdAt) >= sevenDaysAgo
    ).length;

    return {
      total: allDocs.length,
      byType,
      totalSize,
      recentUploads,
    };
  }

  /**
   * Validate file upload
   */
  validateFile(file: {
    size: number;
    mimeType: string;
  }): { valid: boolean; error?: string } {
    // Max file size: 10MB
    const MAX_SIZE = 10 * 1024 * 1024;
    if (file.size > MAX_SIZE) {
      return { valid: false, error: 'File size exceeds 10MB limit' };
    }

    // Allowed mime types
    const allowedTypes = [
      // Images
      'image/jpeg',
      'image/png',
      'image/gif',
      'image/webp',
      // Documents
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      // Text
      'text/plain',
      'text/csv',
    ];

    if (!allowedTypes.includes(file.mimeType)) {
      return { valid: false, error: 'File type not allowed' };
    }

    return { valid: true };
  }

  /**
   * Get public documents (for customer sharing)
   */
  async getPublicDocuments(jobId: number): Promise<Document[]> {
    return await db
      .select()
      .from(documents)
      .where(
        and(
          eq(documents.jobId, jobId),
          eq(documents.isPublic, true)
        )
      )
      .orderBy(desc(documents.createdAt));
  }

  /**
   * Toggle document public status
   */
  async togglePublic(documentId: number, userId: string): Promise<Document | null> {
    const document = await this.getDocument(documentId, userId);
    if (!document) return null;

    return await this.updateDocument(documentId, userId, {
      isPublic: !document.isPublic,
    });
  }
}

export const documentService = new DocumentService();
