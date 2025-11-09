import { db } from "@db";
import {
  taxSettings,
  basReports,
  taxCategories,
  taxDeductions,
  invoices,
  expenses,
  type TaxSettings,
  type BasReport,
  type InsertBasReport,
  type TaxDeduction,
  type TaxCategory,
} from "@shared/schema";
import { eq, and, between, sql, desc, gte, lte } from "drizzle-orm";
import Anthropic from "@anthropic-ai/sdk";

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY || "",
});

interface BasPeriod {
  start: Date;
  end: Date;
  quarter: string;
}

interface BasCalculation {
  totalSales: number;
  gstOnSales: number;
  totalPurchases: number;
  gstOnPurchases: number;
  netGst: number;
}

export class AccountingService {
  /**
   * Get or create tax settings for user
   */
  async getTaxSettings(userId: string): Promise<TaxSettings> {
    const [settings] = await db
      .select()
      .from(taxSettings)
      .where(eq(taxSettings.userId, userId))
      .limit(1);

    if (settings) {
      return settings;
    }

    // Create default settings
    const [newSettings] = await db
      .insert(taxSettings)
      .values({
        userId,
        gstRegistered: false,
        financialYearEnd: "30-06",
        accountingBasis: "accrual",
        basReportingPeriod: "quarterly",
        gstRate: "10.00",
      })
      .returning();

    return newSettings;
  }

  /**
   * Update tax settings
   */
  async updateTaxSettings(
    userId: string,
    updates: Partial<TaxSettings>
  ): Promise<TaxSettings> {
    const [updated] = await db
      .update(taxSettings)
      .set({
        ...updates,
        updatedAt: new Date(),
      })
      .where(eq(taxSettings.userId, userId))
      .returning();

    if (!updated) {
      throw new Error('Tax settings not found');
    }

    return updated;
  }

  /**
   * Calculate BAS period based on quarter
   */
  private getBasPeriod(quarter: string): BasPeriod {
    const [q, year] = quarter.split(' ');
    const yearNum = parseInt(year);

    const periods: Record<string, { start: [number, number], end: [number, number] }> = {
      'Q1': { start: [6, 1], end: [8, 31] },   // Jul-Sep
      'Q2': { start: [9, 1], end: [11, 30] },  // Oct-Dec
      'Q3': { start: [0, 1], end: [2, 31] },   // Jan-Mar
      'Q4': { start: [3, 1], end: [5, 30] },   // Apr-Jun
    };

    const period = periods[q];
    if (!period) {
      throw new Error(`Invalid quarter: ${quarter}`);
    }

    const start = new Date(yearNum, period.start[0], period.start[1]);
    const end = new Date(yearNum, period.end[0], period.end[1]);

    return { start, end, quarter };
  }

  /**
   * Generate current quarter string (e.g., "Q1 2025")
   */
  getCurrentQuarter(): string {
    const now = new Date();
    const month = now.getMonth();
    const year = now.getFullYear();

    // Australian financial year: Jul-Jun
    if (month >= 6 && month <= 8) return `Q1 ${year}`;      // Jul-Sep
    if (month >= 9 && month <= 11) return `Q2 ${year}`;     // Oct-Dec
    if (month >= 0 && month <= 2) return `Q3 ${year}`;      // Jan-Mar
    return `Q4 ${year}`;                                     // Apr-Jun
  }

  /**
   * Calculate BAS for a given quarter
   */
  async calculateBas(userId: string, quarter: string): Promise<BasCalculation> {
    const settings = await this.getTaxSettings(userId);
    const period = this.getBasPeriod(quarter);

    // Get all invoices (sales) for the period
    const salesInvoices = await db
      .select()
      .from(invoices)
      .where(
        and(
          eq(invoices.userId, userId),
          gte(invoices.createdAt, period.start),
          lte(invoices.createdAt, period.end)
        )
      );

    // Get all expenses (purchases) for the period
    const purchaseExpenses = await db
      .select()
      .from(expenses)
      .where(
        and(
          eq(expenses.userId, userId),
          gte(expenses.date, period.start),
          lte(expenses.date, period.end)
        )
      );

    // Calculate totals
    const totalSales = salesInvoices.reduce(
      (sum, inv) => sum + parseFloat(inv.total),
      0
    );

    const totalPurchases = purchaseExpenses.reduce(
      (sum, exp) => sum + parseFloat(exp.amount),
      0
    );

    // GST calculations (assuming GST is included in prices)
    const gstRate = parseFloat(settings.gstRate) / 100;
    const gstDivisor = 1 + gstRate; // 1.1 for 10% GST

    const gstOnSales = totalSales - (totalSales / gstDivisor);
    const gstOnPurchases = totalPurchases - (totalPurchases / gstDivisor);

    const netGst = gstOnSales - gstOnPurchases;

    return {
      totalSales,
      gstOnSales,
      totalPurchases,
      gstOnPurchases,
      netGst,
    };
  }

  /**
   * Generate BAS report for a quarter
   */
  async generateBasReport(userId: string, quarter: string): Promise<BasReport> {
    const period = this.getBasPeriod(quarter);
    const calc = await this.calculateBas(userId, quarter);

    // Check if report already exists
    const [existing] = await db
      .select()
      .from(basReports)
      .where(
        and(
          eq(basReports.userId, userId),
          eq(basReports.quarter, quarter)
        )
      )
      .limit(1);

    if (existing) {
      // Update existing report
      const [updated] = await db
        .update(basReports)
        .set({
          g1TotalSales: calc.totalSales.toFixed(2),
          g1aGstOnSales: calc.gstOnSales.toFixed(2),
          g11NonCapitalPurchases: calc.totalPurchases.toFixed(2),
          g1bGstOnPurchases: calc.gstOnPurchases.toFixed(2),
          totalGstPayable: calc.netGst.toFixed(2),
          updatedAt: new Date(),
        })
        .where(eq(basReports.id, existing.id))
        .returning();

      return updated;
    }

    // Create new report
    const [report] = await db
      .insert(basReports)
      .values({
        userId,
        periodStart: period.start,
        periodEnd: period.end,
        quarter,
        g1TotalSales: calc.totalSales.toFixed(2),
        g1aGstOnSales: calc.gstOnSales.toFixed(2),
        g11NonCapitalPurchases: calc.totalPurchases.toFixed(2),
        g1bGstOnPurchases: calc.gstOnPurchases.toFixed(2),
        totalGstPayable: calc.netGst.toFixed(2),
        status: 'draft',
      })
      .returning();

    return report;
  }

  /**
   * Get all BAS reports for user
   */
  async getBasReports(userId: string): Promise<BasReport[]> {
    return await db
      .select()
      .from(basReports)
      .where(eq(basReports.userId, userId))
      .orderBy(desc(basReports.periodEnd));
  }

  /**
   * Get a specific BAS report
   */
  async getBasReport(reportId: number, userId: string): Promise<BasReport | null> {
    const [report] = await db
      .select()
      .from(basReports)
      .where(
        and(
          eq(basReports.id, reportId),
          eq(basReports.userId, userId)
        )
      )
      .limit(1);

    return report || null;
  }

  /**
   * Submit BAS report
   */
  async submitBasReport(reportId: number, userId: string): Promise<BasReport> {
    const [report] = await db
      .update(basReports)
      .set({
        status: 'submitted',
        submittedAt: new Date(),
        updatedAt: new Date(),
      })
      .where(
        and(
          eq(basReports.id, reportId),
          eq(basReports.userId, userId)
        )
      )
      .returning();

    if (!report) {
      throw new Error('BAS report not found');
    }

    return report;
  }

  /**
   * Mark BAS report as paid
   */
  async markBasPaid(reportId: number, userId: string): Promise<BasReport> {
    const [report] = await db
      .update(basReports)
      .set({
        status: 'paid',
        paidAt: new Date(),
        updatedAt: new Date(),
      })
      .where(
        and(
          eq(basReports.id, reportId),
          eq(basReports.userId, userId)
        )
      )
      .returning();

    if (!report) {
      throw new Error('BAS report not found');
    }

    return report;
  }

  /**
   * Get default tax categories
   */
  async getTaxCategories(): Promise<TaxCategory[]> {
    return await db
      .select()
      .from(taxCategories)
      .where(eq(taxCategories.isDefault, true));
  }

  /**
   * Seed default tax categories (call once on setup)
   */
  async seedTaxCategories(): Promise<void> {
    const categories = [
      {
        name: 'Vehicle Expenses',
        description: 'Fuel, maintenance, registration, insurance for work vehicle',
        category: 'vehicle',
        deductible: true,
        deductionRate: '100.00',
        atoCategory: 'D1',
        requiresReceipt: true,
        isDefault: true,
      },
      {
        name: 'Tools & Equipment',
        description: 'Power tools, hand tools, safety equipment',
        category: 'tools',
        deductible: true,
        deductionRate: '100.00',
        atoCategory: 'D2',
        requiresReceipt: true,
        isDefault: true,
      },
      {
        name: 'Materials & Supplies',
        description: 'Building materials, supplies used for jobs',
        category: 'materials',
        deductible: true,
        deductionRate: '100.00',
        atoCategory: 'D3',
        requiresReceipt: true,
        isDefault: true,
      },
      {
        name: 'Advertising & Marketing',
        description: 'Website, business cards, online ads, signage',
        category: 'marketing',
        deductible: true,
        deductionRate: '100.00',
        atoCategory: 'D4',
        requiresReceipt: true,
        isDefault: true,
      },
      {
        name: 'Insurance',
        description: 'Public liability, professional indemnity, income protection',
        category: 'insurance',
        deductible: true,
        deductionRate: '100.00',
        atoCategory: 'D5',
        requiresReceipt: true,
        isDefault: true,
      },
      {
        name: 'Phone & Internet',
        description: 'Mobile phone, internet for business use',
        category: 'phone_internet',
        deductible: true,
        deductionRate: '100.00',
        atoCategory: 'D6',
        requiresReceipt: true,
        isDefault: true,
      },
      {
        name: 'Accounting & Legal',
        description: 'Bookkeeper, accountant, tax agent fees',
        category: 'professional',
        deductible: true,
        deductionRate: '100.00',
        atoCategory: 'D7',
        requiresReceipt: true,
        isDefault: true,
      },
      {
        name: 'Training & Education',
        description: 'Trade courses, safety training, certifications',
        category: 'training',
        deductible: true,
        deductionRate: '100.00',
        atoCategory: 'D8',
        requiresReceipt: true,
        isDefault: true,
      },
      {
        name: 'Clothing & PPE',
        description: 'Work boots, hi-vis, protective clothing',
        category: 'clothing',
        deductible: true,
        deductionRate: '100.00',
        atoCategory: 'D9',
        requiresReceipt: true,
        isDefault: true,
      },
      {
        name: 'Home Office',
        description: 'Portion of rent/mortgage, utilities for home office',
        category: 'home_office',
        deductible: true,
        deductionRate: '100.00',
        atoCategory: 'D10',
        requiresReceipt: false,
        isDefault: true,
      },
    ];

    for (const category of categories) {
      // Check if already exists
      const [existing] = await db
        .select()
        .from(taxCategories)
        .where(eq(taxCategories.category, category.category))
        .limit(1);

      if (!existing) {
        await db.insert(taxCategories).values(category);
      }
    }
  }

  /**
   * Generate AI-powered tax deduction suggestions
   */
  async generateTaxSuggestions(userId: string): Promise<TaxDeduction[]> {
    try {
      // Get recent expenses without tax categories
      const recentExpenses = await db
        .select()
        .from(expenses)
        .where(
          and(
            eq(expenses.userId, userId),
            gte(expenses.date, new Date(Date.now() - 90 * 24 * 60 * 60 * 1000)) // Last 90 days
          )
        )
        .orderBy(desc(expenses.date))
        .limit(50);

      if (recentExpenses.length === 0) {
        return [];
      }

      // Build AI prompt with expense context
      const expenseList = recentExpenses.map(e =>
        `- ${e.description || 'Unnamed'}: $${e.amount} (${new Date(e.date).toLocaleDateString()})`
      ).join('\n');

      const prompt = `You are a tax advisor for Australian tradies. Review these recent business expenses and identify potential tax deductions they might be missing.

Recent expenses:
${expenseList}

For each potential tax deduction, provide:
1. A clear, short title (max 50 chars)
2. A brief explanation of why it's deductible
3. Estimated tax saving (assume 30% tax rate)
4. Your confidence level (0-100)

Focus on:
- Common tradie expenses (vehicle, tools, materials, PPE, training)
- ATO-approved deductions for sole traders
- Legitimate business expenses

Return your response as a JSON array with this structure:
[
  {
    "title": "...",
    "description": "...",
    "estimatedAmount": 0,
    "estimatedSaving": 0,
    "confidence": 85,
    "reasoning": "..."
  }
]

Only suggest genuine, ATO-compliant deductions. If no suggestions, return empty array.`;

      const message = await anthropic.messages.create({
        model: "claude-3-5-sonnet-20241022",
        max_tokens: 2000,
        messages: [{
          role: "user",
          content: prompt
        }],
      });

      const content = message.content[0].type === 'text'
        ? message.content[0].text
        : '';

      // Parse AI response
      const jsonMatch = content.match(/\[[\s\S]*\]/);
      if (!jsonMatch) {
        return [];
      }

      const suggestions = JSON.parse(jsonMatch[0]);

      // Save suggestions to database
      const savedSuggestions: TaxDeduction[] = [];

      for (const suggestion of suggestions) {
        const [deduction] = await db
          .insert(taxDeductions)
          .values({
            userId,
            suggestionType: 'unclaimed_deduction',
            title: suggestion.title,
            description: suggestion.description,
            estimatedAmount: suggestion.estimatedAmount?.toFixed(2) || '0',
            estimatedSaving: suggestion.estimatedSaving?.toFixed(2) || '0',
            confidence: suggestion.confidence?.toFixed(2) || '0',
            aiReasoning: suggestion.reasoning,
            status: 'pending',
          })
          .returning();

        savedSuggestions.push(deduction);
      }

      return savedSuggestions;
    } catch (error) {
      console.error('Error generating tax suggestions:', error);
      return [];
    }
  }

  /**
   * Get tax deduction suggestions
   */
  async getTaxSuggestions(userId: string): Promise<TaxDeduction[]> {
    return await db
      .select()
      .from(taxDeductions)
      .where(eq(taxDeductions.userId, userId))
      .orderBy(desc(taxDeductions.createdAt));
  }

  /**
   * Accept tax deduction suggestion
   */
  async acceptTaxSuggestion(
    suggestionId: number,
    userId: string,
    notes?: string
  ): Promise<TaxDeduction> {
    const [suggestion] = await db
      .update(taxDeductions)
      .set({
        status: 'accepted',
        userNotes: notes,
        actionedAt: new Date(),
      })
      .where(
        and(
          eq(taxDeductions.id, suggestionId),
          eq(taxDeductions.userId, userId)
        )
      )
      .returning();

    if (!suggestion) {
      throw new Error('Tax suggestion not found');
    }

    return suggestion;
  }

  /**
   * Dismiss tax deduction suggestion
   */
  async dismissTaxSuggestion(
    suggestionId: number,
    userId: string,
    notes?: string
  ): Promise<TaxDeduction> {
    const [suggestion] = await db
      .update(taxDeductions)
      .set({
        status: 'dismissed',
        userNotes: notes,
        actionedAt: new Date(),
      })
      .where(
        and(
          eq(taxDeductions.id, suggestionId),
          eq(taxDeductions.userId, userId)
        )
      )
      .returning();

    if (!suggestion) {
      throw new Error('Tax suggestion not found');
    }

    return suggestion;
  }

  /**
   * Calculate tax summary for dashboard
   */
  async getTaxSummary(userId: string): Promise<{
    currentQuarter: string;
    estimatedGstPayable: number;
    totalDeductions: number;
    potentialSavings: number;
    nextBasDueDate: Date | null;
  }> {
    const settings = await this.getTaxSettings(userId);
    const currentQuarter = this.getCurrentQuarter();
    const calc = await this.calculateBas(userId, currentQuarter);

    // Get pending tax suggestions
    const suggestions = await db
      .select()
      .from(taxDeductions)
      .where(
        and(
          eq(taxDeductions.userId, userId),
          eq(taxDeductions.status, 'pending')
        )
      );

    const potentialSavings = suggestions.reduce(
      (sum, s) => sum + parseFloat(s.estimatedSaving || '0'),
      0
    );

    return {
      currentQuarter,
      estimatedGstPayable: calc.netGst,
      totalDeductions: calc.gstOnPurchases,
      potentialSavings,
      nextBasDueDate: settings.nextBasDueDate,
    };
  }
}

export const accountingService = new AccountingService();
