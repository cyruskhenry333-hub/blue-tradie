import { db } from '../db';
import { quotes, invoices, customerPortalTokens, type Quote, type InsertQuote } from '@shared/schema';
import { eq, and, desc, gte } from 'drizzle-orm';
import crypto from 'crypto';
import { emailService } from './sendgrid-email-service';

export class QuoteService {

  /**
   * Generate next quote number for the year (Q001-2025, Q002-2025, etc.)
   */
  private async generateQuoteNumber(userId: string): Promise<{ quoteNumber: string; yearSequence: number }> {
    const currentYear = new Date().getFullYear();
    const yearStart = new Date(currentYear, 0, 1);

    // Get all quotes for this user in current year
    const yearQuotes = await db
      .select()
      .from(quotes)
      .where(
        and(
          eq(quotes.userId, userId),
          gte(quotes.createdAt, yearStart)
        )
      )
      .orderBy(desc(quotes.yearSequence));

    const nextSequence = yearQuotes.length > 0 ? (yearQuotes[0].yearSequence || 0) + 1 : 1;
    const quoteNumber = `Q${String(nextSequence).padStart(3, '0')}-${currentYear}`;

    return { quoteNumber, yearSequence: nextSequence };
  }

  /**
   * Create a new quote
   */
  async createQuote(data: InsertQuote): Promise<Quote> {
    const { quoteNumber, yearSequence } = await this.generateQuoteNumber(data.userId);

    // Generate portal access token for customer
    const portalToken = this.generateSecureToken();

    const [quote] = await db
      .insert(quotes)
      .values({
        ...data,
        quoteNumber,
        yearSequence,
        portalAccessToken: portalToken,
      })
      .returning();

    console.log(`[QUOTE] Created quote ${quoteNumber} for user ${data.userId}`);
    return quote;
  }

  /**
   * Get quote by ID (with user ownership check)
   */
  async getQuote(quoteId: number, userId: string): Promise<Quote | null> {
    const [quote] = await db
      .select()
      .from(quotes)
      .where(
        and(
          eq(quotes.id, quoteId),
          eq(quotes.userId, userId)
        )
      )
      .limit(1);

    return quote || null;
  }

  /**
   * Get all quotes for a user
   */
  async getQuotesByUser(userId: string): Promise<Quote[]> {
    return await db
      .select()
      .from(quotes)
      .where(eq(quotes.userId, userId))
      .orderBy(desc(quotes.createdAt));
  }

  /**
   * Get quotes by customer email
   */
  async getQuotesByCustomerEmail(customerEmail: string, userId: string): Promise<Quote[]> {
    return await db
      .select()
      .from(quotes)
      .where(
        and(
          eq(quotes.customerEmail, customerEmail),
          eq(quotes.userId, userId)
        )
      )
      .orderBy(desc(quotes.createdAt));
  }

  /**
   * Update quote
   */
  async updateQuote(quoteId: number, userId: string, data: Partial<InsertQuote>): Promise<Quote | null> {
    const [updated] = await db
      .update(quotes)
      .set({
        ...data,
        updatedAt: new Date(),
      })
      .where(
        and(
          eq(quotes.id, quoteId),
          eq(quotes.userId, userId)
        )
      )
      .returning();

    return updated || null;
  }

  /**
   * Send quote to customer via email/SMS
   */
  async sendQuote(quoteId: number, userId: string): Promise<{ success: boolean; portalUrl: string }> {
    const quote = await this.getQuote(quoteId, userId);
    if (!quote) {
      throw new Error('Quote not found');
    }

    if (!quote.customerEmail) {
      throw new Error('Customer email is required to send quote');
    }

    // Generate portal URL with magic link
    const appUrl = process.env.APP_BASE_URL || 'https://bluetradie.com';
    const portalUrl = `${appUrl}/portal?token=${quote.portalAccessToken}`;

    // Create customer portal token for this quote
    await this.createCustomerPortalToken(userId, quote);

    // Send email with quote details
    const emailSent = await this.sendQuoteEmail(quote, portalUrl);

    if (emailSent) {
      // Mark quote as sent
      await db
        .update(quotes)
        .set({
          status: 'sent',
          sentAt: new Date(),
        })
        .where(eq(quotes.id, quoteId));

      console.log(`[QUOTE] Sent quote ${quote.quoteNumber} to ${quote.customerEmail}`);
    }

    return { success: emailSent, portalUrl };
  }

  /**
   * Customer accepts quote
   */
  async acceptQuote(quoteId: number, customerNotes?: string): Promise<{ quote: Quote; invoice: any }> {
    const [quote] = await db
      .select()
      .from(quotes)
      .where(eq(quotes.id, quoteId))
      .limit(1);

    if (!quote) {
      throw new Error('Quote not found');
    }

    if (quote.status === 'accepted') {
      throw new Error('Quote already accepted');
    }

    // Update quote status
    const [updatedQuote] = await db
      .update(quotes)
      .set({
        status: 'accepted',
        respondedAt: new Date(),
        customerNotes,
      })
      .where(eq(quotes.id, quoteId))
      .returning();

    // Auto-convert to invoice
    const invoice = await this.convertQuoteToInvoice(quoteId);

    console.log(`[QUOTE] Quote ${quote.quoteNumber} accepted by customer`);
    return { quote: updatedQuote, invoice };
  }

  /**
   * Customer rejects quote
   */
  async rejectQuote(quoteId: number, customerNotes?: string): Promise<Quote> {
    const [quote] = await db
      .update(quotes)
      .set({
        status: 'rejected',
        respondedAt: new Date(),
        customerNotes,
      })
      .where(eq(quotes.id, quoteId))
      .returning();

    console.log(`[QUOTE] Quote ${quote.quoteNumber} rejected by customer`);
    return quote;
  }

  /**
   * Convert accepted quote to invoice
   */
  async convertQuoteToInvoice(quoteId: number): Promise<any> {
    const [quote] = await db
      .select()
      .from(quotes)
      .where(eq(quotes.id, quoteId))
      .limit(1);

    if (!quote) {
      throw new Error('Quote not found');
    }

    if (quote.convertedToInvoiceId) {
      // Already converted, return existing invoice
      const [existingInvoice] = await db
        .select()
        .from(invoices)
        .where(eq(invoices.id, quote.convertedToInvoiceId))
        .limit(1);
      return existingInvoice;
    }

    // Generate invoice number (similar to quote number generation)
    const invoiceNumber = await this.generateInvoiceNumber(quote.userId);

    // Create invoice from quote
    const [invoice] = await db
      .insert(invoices)
      .values({
        userId: quote.userId,
        jobId: quote.jobId,
        invoiceNumber: invoiceNumber.invoiceNumber,
        yearSequence: invoiceNumber.yearSequence,
        customerName: quote.customerName,
        customerEmail: quote.customerEmail,
        status: 'draft',
        subtotal: quote.subtotal,
        gst: quote.gst,
        total: quote.total,
        lineItems: quote.lineItems,
        paymentStatus: 'draft',
      })
      .returning();

    // Link quote to invoice
    await db
      .update(quotes)
      .set({
        status: 'converted',
        convertedToInvoiceId: invoice.id,
        convertedAt: new Date(),
      })
      .where(eq(quotes.id, quoteId));

    console.log(`[QUOTE] Converted quote ${quote.quoteNumber} to invoice ${invoiceNumber.invoiceNumber}`);
    return invoice;
  }

  /**
   * Generate next invoice number (helper method)
   */
  private async generateInvoiceNumber(userId: string): Promise<{ invoiceNumber: string; yearSequence: number }> {
    const currentYear = new Date().getFullYear();
    const yearStart = new Date(currentYear, 0, 1);

    const yearInvoices = await db
      .select()
      .from(invoices)
      .where(
        and(
          eq(invoices.userId, userId),
          gte(invoices.createdAt, yearStart)
        )
      )
      .orderBy(desc(invoices.yearSequence));

    const nextSequence = yearInvoices.length > 0 ? (yearInvoices[0].yearSequence || 0) + 1 : 1;
    const invoiceNumber = `INV${String(nextSequence).padStart(3, '0')}-${currentYear}`;

    return { invoiceNumber, yearSequence: nextSequence };
  }

  /**
   * Mark quote as viewed by customer
   */
  async markQuoteAsViewed(quoteId: number): Promise<void> {
    const [quote] = await db
      .select()
      .from(quotes)
      .where(eq(quotes.id, quoteId))
      .limit(1);

    if (quote && !quote.viewedAt) {
      await db
        .update(quotes)
        .set({
          status: 'viewed',
          viewedAt: new Date(),
        })
        .where(eq(quotes.id, quoteId));

      console.log(`[QUOTE] Quote ${quote.quoteNumber} viewed by customer`);
    }
  }

  /**
   * Create customer portal token
   */
  private async createCustomerPortalToken(userId: string, quote: Quote): Promise<void> {
    if (!quote.customerEmail) return;

    const tokenId = crypto.randomUUID();
    const tokenHash = crypto.createHash('sha256').update(quote.portalAccessToken || '').digest('hex');
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 90); // Token valid for 90 days

    await db.insert(customerPortalTokens).values({
      id: tokenId,
      userId,
      customerEmail: quote.customerEmail,
      customerName: quote.customerName,
      customerPhone: quote.customerPhone,
      tokenHash,
      expiresAt,
      quoteIds: [quote.id],
      invoiceIds: [],
      jobIds: quote.jobId ? [quote.jobId] : [],
    });

    console.log(`[CUSTOMER_PORTAL] Created portal token for ${quote.customerEmail}`);
  }

  /**
   * Generate secure random token
   */
  private generateSecureToken(): string {
    return crypto.randomBytes(32).toString('hex');
  }

  /**
   * Send quote email to customer
   */
  private async sendQuoteEmail(quote: Quote, portalUrl: string): Promise<boolean> {
    if (!quote.customerEmail) return false;

    const subject = `Quote ${quote.quoteNumber} from ${quote.userId}`;
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #ea580c; color: white; padding: 20px; text-align: center; border-radius: 8px; }
          .content { padding: 20px; background: #f9f9f9; margin-top: 20px; border-radius: 8px; }
          .quote-details { background: white; padding: 15px; margin: 15px 0; border-radius: 5px; }
          .button { display: inline-block; background: #ea580c; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; margin: 10px 5px; }
          .total { font-size: 24px; font-weight: bold; color: #ea580c; margin-top: 10px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>New Quote</h1>
            <p>Quote #${quote.quoteNumber}</p>
          </div>

          <div class="content">
            <p>G'day ${quote.customerName},</p>
            <p>Thanks for the opportunity to quote on your job. Here are the details:</p>

            <div class="quote-details">
              <h3>${quote.title}</h3>
              ${quote.description ? `<p>${quote.description}</p>` : ''}

              <div style="margin-top: 15px;">
                <strong>Line Items:</strong>
                ${(quote.lineItems as any[])?.map((item: any) => `
                  <div style="padding: 8px 0; border-bottom: 1px solid #eee;">
                    ${item.description} - ${item.quantity} × $${item.rate} = $${item.amount}
                  </div>
                `).join('')}
              </div>

              <div style="margin-top: 15px; text-align: right;">
                <div>Subtotal: $${quote.subtotal}</div>
                <div>GST: $${quote.gst}</div>
                <div class="total">Total: $${quote.total}</div>
              </div>

              ${quote.validUntil ? `<p style="color: #666; margin-top: 10px;"><em>Valid until: ${new Date(quote.validUntil).toLocaleDateString()}</em></p>` : ''}
            </div>

            <div style="text-align: center; margin: 30px 0;">
              <a href="${portalUrl}" class="button">View & Accept Quote</a>
            </div>

            <p style="color: #666; font-size: 14px;">
              Click the button above to view your quote, ask questions, or accept the quote to get started.
            </p>
          </div>
        </div>
      </body>
      </html>
    `;

    return await emailService.sendEmail({
      to: quote.customerEmail,
      subject,
      html,
    });
  }

  /**
   * Get quote statistics for a user
   */
  async getQuoteStats(userId: string): Promise<{
    totalQuotes: number;
    sentQuotes: number;
    acceptedQuotes: number;
    rejectedQuotes: number;
    conversionRate: number;
    totalValue: number;
  }> {
    const allQuotes = await this.getQuotesByUser(userId);

    const totalQuotes = allQuotes.length;
    const sentQuotes = allQuotes.filter(q => ['sent', 'viewed', 'accepted', 'rejected'].includes(q.status)).length;
    const acceptedQuotes = allQuotes.filter(q => q.status === 'accepted').length;
    const rejectedQuotes = allQuotes.filter(q => q.status === 'rejected').length;
    const conversionRate = sentQuotes > 0 ? (acceptedQuotes / sentQuotes) * 100 : 0;
    const totalValue = allQuotes
      .filter(q => q.status === 'accepted')
      .reduce((sum, q) => sum + parseFloat(q.total), 0);

    return {
      totalQuotes,
      sentQuotes,
      acceptedQuotes,
      rejectedQuotes,
      conversionRate,
      totalValue,
    };
  }
}

export const quoteService = new QuoteService();
