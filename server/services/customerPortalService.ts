import { db } from '../db';
import { customerPortalTokens, quotes, invoices, jobs, type Quote, type Invoice } from '@shared/schema';
import { eq, and, inArray, gt } from 'drizzle-orm';
import crypto from 'crypto';

export class CustomerPortalService {

  /**
   * Verify customer portal token and get accessible resources
   */
  async verifyPortalToken(token: string): Promise<{
    valid: boolean;
    customerEmail?: string;
    customerName?: string;
    userId?: string;
    quoteIds?: number[];
    invoiceIds?: number[];
    jobIds?: number[];
  }> {
    const tokenHash = crypto.createHash('sha256').update(token).digest('hex');

    const [portalToken] = await db
      .select()
      .from(customerPortalTokens)
      .where(
        and(
          eq(customerPortalTokens.tokenHash, tokenHash),
          gt(customerPortalTokens.expiresAt, new Date())
        )
      )
      .limit(1);

    if (!portalToken) {
      return { valid: false };
    }

    // Don't mark as consumed for portal tokens (they're reusable unlike magic links)
    // But we could add last accessed tracking here

    return {
      valid: true,
      customerEmail: portalToken.customerEmail,
      customerName: portalToken.customerName || undefined,
      userId: portalToken.userId,
      quoteIds: (portalToken.quoteIds as number[]) || [],
      invoiceIds: (portalToken.invoiceIds as number[]) || [],
      jobIds: (portalToken.jobIds as number[]) || [],
    };
  }

  /**
   * Get customer's accessible quotes
   */
  async getCustomerQuotes(customerEmail: string, userId: string): Promise<Quote[]> {
    return await db
      .select()
      .from(quotes)
      .where(
        and(
          eq(quotes.customerEmail, customerEmail),
          eq(quotes.userId, userId)
        )
      )
      .orderBy(quotes.createdAt);
  }

  /**
   * Get specific quote (with access check)
   */
  async getQuote(quoteId: number, allowedQuoteIds: number[]): Promise<Quote | null> {
    if (!allowedQuoteIds.includes(quoteId)) {
      return null; // Access denied
    }

    const [quote] = await db
      .select()
      .from(quotes)
      .where(eq(quotes.id, quoteId))
      .limit(1);

    return quote || null;
  }

  /**
   * Get customer's accessible invoices
   */
  async getCustomerInvoices(customerEmail: string, userId: string): Promise<Invoice[]> {
    return await db
      .select()
      .from(invoices)
      .where(
        and(
          eq(invoices.customerEmail, customerEmail),
          eq(invoices.userId, userId)
        )
      )
      .orderBy(invoices.createdAt);
  }

  /**
   * Get specific invoice (with access check)
   */
  async getInvoice(invoiceId: number, allowedInvoiceIds: number[]): Promise<Invoice | null> {
    if (!allowedInvoiceIds.includes(invoiceId)) {
      return null; // Access denied
    }

    const [invoice] = await db
      .select()
      .from(invoices)
      .where(eq(invoices.id, invoiceId))
      .limit(1);

    return invoice || null;
  }

  /**
   * Get customer's accessible jobs
   */
  async getCustomerJobs(allowedJobIds: number[]): Promise<any[]> {
    if (allowedJobIds.length === 0) {
      return [];
    }

    return await db
      .select()
      .from(jobs)
      .where(inArray(jobs.id, allowedJobIds))
      .orderBy(jobs.createdAt);
  }

  /**
   * Create or update customer portal token
   * This allows adding more quotes/invoices to existing customer access
   */
  async upsertCustomerPortalToken(
    userId: string,
    customerEmail: string,
    options: {
      customerName?: string;
      customerPhone?: string;
      quoteIds?: number[];
      invoiceIds?: number[];
      jobIds?: number[];
    }
  ): Promise<{ token: string; portalUrl: string }> {
    // Check if token exists for this customer
    const existing = await db
      .select()
      .from(customerPortalTokens)
      .where(
        and(
          eq(customerPortalTokens.userId, userId),
          eq(customerPortalTokens.customerEmail, customerEmail),
          gt(customerPortalTokens.expiresAt, new Date())
        )
      )
      .limit(1);

    if (existing.length > 0) {
      // Update existing token with new resources
      const existingToken = existing[0];
      const existingQuoteIds = (existingToken.quoteIds as number[]) || [];
      const existingInvoiceIds = (existingToken.invoiceIds as number[]) || [];
      const existingJobIds = (existingToken.jobIds as number[]) || [];

      const mergedQuoteIds = Array.from(new Set([...existingQuoteIds, ...(options.quoteIds || [])]));
      const mergedInvoiceIds = Array.from(new Set([...existingInvoiceIds, ...(options.invoiceIds || [])]));
      const mergedJobIds = Array.from(new Set([...existingJobIds, ...(options.jobIds || [])]));

      await db
        .update(customerPortalTokens)
        .set({
          quoteIds: mergedQuoteIds,
          invoiceIds: mergedInvoiceIds,
          jobIds: mergedJobIds,
          customerName: options.customerName || existingToken.customerName,
          customerPhone: options.customerPhone || existingToken.customerPhone,
        })
        .where(eq(customerPortalTokens.id, existingToken.id));

      // Return existing token
      const token = await this.findTokenByHash(existingToken.tokenHash);
      const appUrl = process.env.APP_BASE_URL || 'https://bluetradie.com';
      const portalUrl = `${appUrl}/portal?token=${token}`;

      return { token, portalUrl };
    }

    // Create new token
    const token = this.generateSecureToken();
    const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
    const tokenId = crypto.randomUUID();
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 90); // 90 days validity

    await db.insert(customerPortalTokens).values({
      id: tokenId,
      userId,
      customerEmail,
      customerName: options.customerName,
      customerPhone: options.customerPhone,
      tokenHash,
      expiresAt,
      quoteIds: options.quoteIds || [],
      invoiceIds: options.invoiceIds || [],
      jobIds: options.jobIds || [],
    });

    const appUrl = process.env.APP_BASE_URL || 'https://bluetradie.com';
    const portalUrl = `${appUrl}/portal?token=${token}`;

    console.log(`[CUSTOMER_PORTAL] Created/updated portal access for ${customerEmail}`);
    return { token, portalUrl };
  }

  /**
   * Find original token by hash (for returning to user)
   * Note: In production, we'd store token reference separately or return at creation
   */
  private async findTokenByHash(hash: string): Promise<string> {
    // In a real implementation, we'd need to store the original token
    // For now, we return a placeholder - this should be improved
    return hash.slice(0, 32);
  }

  /**
   * Generate secure random token
   */
  private generateSecureToken(): string {
    return crypto.randomBytes(32).toString('hex');
  }

  /**
   * Revoke customer portal access (e.g., after dispute)
   */
  async revokeCustomerAccess(userId: string, customerEmail: string): Promise<void> {
    await db
      .update(customerPortalTokens)
      .set({
        expiresAt: new Date(), // Set expiry to now
      })
      .where(
        and(
          eq(customerPortalTokens.userId, userId),
          eq(customerPortalTokens.customerEmail, customerEmail)
        )
      );

    console.log(`[CUSTOMER_PORTAL] Revoked portal access for ${customerEmail}`);
  }

  /**
   * Get portal statistics
   */
  async getPortalStats(userId: string): Promise<{
    totalCustomers: number;
    activeTokens: number;
    totalViews: number;
  }> {
    const tokens = await db
      .select()
      .from(customerPortalTokens)
      .where(eq(customerPortalTokens.userId, userId));

    const activeTokens = tokens.filter(t => t.expiresAt && new Date(t.expiresAt) > new Date()).length;

    return {
      totalCustomers: tokens.length,
      activeTokens,
      totalViews: 0, // Would need view tracking table for this
    };
  }
}

export const customerPortalService = new CustomerPortalService();
