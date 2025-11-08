import { db } from '../db';
import { tokenLedger, tokenAlerts, users, type TokenLedgerEntry } from '@shared/schema';
import { eq, desc, and, gte } from 'drizzle-orm';

const TOKEN_LIMITS = {
  'Blue Lite': 1000,
  'Blue Core': 2000,
  'Blue Teams': 4000,
  'demo': 1000000,
};

export class TokenLedgerService {

  /**
   * Generate a unique trace ID for transaction grouping
   */
  private generateTraceId(): string {
    return `tx-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
  }

  /**
   * Get current balance for a user by reading the most recent ledger entry
   */
  async getCurrentBalance(userId: string): Promise<number> {
    const entries = await db
      .select()
      .from(tokenLedger)
      .where(eq(tokenLedger.userId, userId))
      .orderBy(desc(tokenLedger.createdAt))
      .limit(1);

    if (entries.length === 0) {
      // No entries yet - initialize with monthly grant
      const user = await db.select().from(users).where(eq(users.id, userId)).limit(1);
      if (!user[0]) throw new Error('User not found');

      const plan = user[0].subscriptionTier || 'Blue Lite';
      const monthlyGrant = TOKEN_LIMITS[plan as keyof typeof TOKEN_LIMITS] || TOKEN_LIMITS['Blue Lite'];

      // Create initial grant
      await this.grantTokens(userId, monthlyGrant, 'initial_grant', { plan });
      return monthlyGrant;
    }

    return entries[0].balanceAfter;
  }

  /**
   * Grant tokens (monthly allocation, purchase, rollover, etc.)
   */
  async grantTokens(
    userId: string,
    amount: number,
    reason: string,
    metadata?: any
  ): Promise<TokenLedgerEntry> {
    const currentBalance = await this.getCurrentBalance(userId);
    const transactionId = this.generateTraceId();
    const currentMonth = new Date().toISOString().slice(0, 7);
    const idempotencyKey = `grant-${userId}-${reason}-${currentMonth}`;

    const [entry] = await db
      .insert(tokenLedger)
      .values({
        userId,
        amount,
        balanceAfter: currentBalance + amount,
        reason,
        metadata,
        transactionId,
        idempotencyKey,
        reconciliationStatus: 'confirmed',
      })
      .returning();

    return entry;
  }

  /**
   * Provision tokens (pessimistic lock before API call)
   */
  async provisionTokens(
    userId: string,
    estimatedTokens: number,
    context: { advisor: string; messageId?: number }
  ): Promise<{ provisionId: number; transactionId: string; balanceAfter: number }> {
    const currentBalance = await this.getCurrentBalance(userId);

    if (currentBalance < estimatedTokens) {
      throw new Error(`Insufficient token balance. Available: ${currentBalance}, Required: ${estimatedTokens}`);
    }

    const transactionId = this.generateTraceId();

    const [provision] = await db
      .insert(tokenLedger)
      .values({
        userId,
        amount: -estimatedTokens,
        balanceAfter: currentBalance - estimatedTokens,
        reason: 'provision',
        metadata: { ...context, estimated: true },
        transactionId,
        idempotencyKey: `provision-${transactionId}`,
        reconciliationStatus: 'pending',
      })
      .returning();

    return {
      provisionId: provision.id,
      transactionId,
      balanceAfter: provision.balanceAfter,
    };
  }

  /**
   * Reconcile after API call completes
   */
  async reconcileTokens(
    provisionId: number,
    transactionId: string,
    actualTokens: number,
    openaiUsage: any
  ): Promise<void> {
    // Mark provision as confirmed
    await db
      .update(tokenLedger)
      .set({ reconciliationStatus: 'confirmed' })
      .where(eq(tokenLedger.id, provisionId));

    // Get provision entry to calculate difference
    const [provision] = await db
      .select()
      .from(tokenLedger)
      .where(eq(tokenLedger.id, provisionId))
      .limit(1);

    if (!provision) {
      throw new Error('Provision not found');
    }

    const estimatedTokens = Math.abs(provision.amount);
    const difference = estimatedTokens - actualTokens;

    // If actual usage differs from estimate, create adjustment entry
    if (difference !== 0) {
      await db.insert(tokenLedger).values({
        userId: provision.userId,
        amount: difference, // positive if we overcharged, negative if we undercharged
        balanceAfter: provision.balanceAfter + difference,
        reason: 'reconciliation_adjustment',
        metadata: {
          provisionId,
          estimated: estimatedTokens,
          actual: actualTokens,
          openaiUsage,
        },
        transactionId,
        idempotencyKey: `reconcile-${transactionId}`,
        reconciliationStatus: 'confirmed',
      });

      // Check if alert needed with adjusted balance
      await this.checkAndSendAlert(provision.userId, provision.balanceAfter + difference);
    } else {
      // No adjustment needed, but still check alerts
      await this.checkAndSendAlert(provision.userId, provision.balanceAfter);
    }
  }

  /**
   * Rollback provision on error
   */
  async rollbackProvision(provisionId: number, transactionId: string, error: string): Promise<void> {
    // Get provision entry
    const [provision] = await db
      .select()
      .from(tokenLedger)
      .where(eq(tokenLedger.id, provisionId))
      .limit(1);

    if (!provision) {
      throw new Error('Provision not found');
    }

    // Mark provision as rolled back
    await db
      .update(tokenLedger)
      .set({ reconciliationStatus: 'rolled_back' })
      .where(eq(tokenLedger.id, provisionId));

    // Create rollback entry (credit back the tokens)
    const rollbackAmount = Math.abs(provision.amount);
    await db.insert(tokenLedger).values({
      userId: provision.userId,
      amount: rollbackAmount,
      balanceAfter: provision.balanceAfter + rollbackAmount,
      reason: 'provision_rollback',
      metadata: { provisionId, error },
      transactionId,
      idempotencyKey: `rollback-${transactionId}`,
      reconciliationStatus: 'confirmed',
    });
  }

  /**
   * Check if 80% alert should be sent (once per month)
   */
  private async checkAndSendAlert(userId: string, currentBalance: number): Promise<void> {
    // Get user's plan
    const [user] = await db.select().from(users).where(eq(users.id, userId)).limit(1);
    if (!user) return;

    const plan = user.subscriptionTier || 'Blue Lite';
    const monthlyLimit = TOKEN_LIMITS[plan as keyof typeof TOKEN_LIMITS] || TOKEN_LIMITS['Blue Lite'];

    const usagePercentage = ((monthlyLimit - currentBalance) / monthlyLimit) * 100;
    const currentMonth = new Date().toISOString().slice(0, 7); // 'YYYY-MM'

    // Check if 80% threshold crossed
    if (usagePercentage >= 80 && usagePercentage < 100) {
      // Check if alert already sent this month
      const existingAlert = await db
        .select()
        .from(tokenAlerts)
        .where(
          and(
            eq(tokenAlerts.userId, userId),
            eq(tokenAlerts.alertType, '80_percent'),
            eq(tokenAlerts.month, currentMonth)
          )
        )
        .limit(1);

      if (existingAlert.length === 0) {
        // Send alert
        await db.insert(tokenAlerts).values({
          userId,
          alertType: '80_percent',
          month: currentMonth,
          balance: currentBalance,
          limit: monthlyLimit,
        });

        console.log(`[TOKEN ALERT] 80% warning sent to user ${userId}. Balance: ${currentBalance}/${monthlyLimit}`);
        // TODO: Trigger email/notification here
      }
    }

    // Check if 100% threshold crossed
    if (currentBalance <= 0) {
      const existingAlert = await db
        .select()
        .from(tokenAlerts)
        .where(
          and(
            eq(tokenAlerts.userId, userId),
            eq(tokenAlerts.alertType, '100_percent'),
            eq(tokenAlerts.month, currentMonth)
          )
        )
        .limit(1);

      if (existingAlert.length === 0) {
        await db.insert(tokenAlerts).values({
          userId,
          alertType: '100_percent',
          month: currentMonth,
          balance: 0,
          limit: monthlyLimit,
        });

        console.log(`[TOKEN ALERT] 100% limit reached for user ${userId}`);
        // TODO: Trigger email/notification here
      }
    }
  }

  /**
   * Get token usage statistics for a user
   */
  async getTokenStats(userId: string): Promise<{
    currentBalance: number;
    monthlyLimit: number;
    usedThisMonth: number;
    usagePercentage: number;
    rolledOverFromLastMonth: number;
  }> {
    const [user] = await db.select().from(users).where(eq(users.id, userId)).limit(1);
    if (!user) throw new Error('User not found');

    const plan = user.subscriptionTier || 'Blue Lite';
    const monthlyLimit = TOKEN_LIMITS[plan as keyof typeof TOKEN_LIMITS] || TOKEN_LIMITS['Blue Lite'];

    const currentBalance = await this.getCurrentBalance(userId);

    // Get all entries this month
    const firstOfMonth = new Date();
    firstOfMonth.setDate(1);
    firstOfMonth.setHours(0, 0, 0, 0);

    const thisMonthEntries = await db
      .select()
      .from(tokenLedger)
      .where(
        and(
          eq(tokenLedger.userId, userId),
          gte(tokenLedger.createdAt, firstOfMonth)
        )
      );

    const usedThisMonth = thisMonthEntries
      .filter(e => e.reason === 'provision' || e.reason === 'advisor_chat')
      .reduce((sum, e) => sum + Math.abs(e.amount), 0);

    const grantedThisMonth = thisMonthEntries
      .filter(e => e.reason === 'monthly_grant')
      .reduce((sum, e) => sum + e.amount, 0);

    const rolledOver = currentBalance - (grantedThisMonth - usedThisMonth);

    return {
      currentBalance,
      monthlyLimit,
      usedThisMonth,
      usagePercentage: (usedThisMonth / monthlyLimit) * 100,
      rolledOverFromLastMonth: Math.max(0, rolledOver),
    };
  }

  /**
   * Monthly rollover job (run on 1st of each month)
   */
  async performMonthlyRollover(userId: string): Promise<void> {
    const [user] = await db.select().from(users).where(eq(users.id, userId)).limit(1);
    if (!user) return;

    const plan = user.subscriptionTier || 'Blue Lite';
    const monthlyGrant = TOKEN_LIMITS[plan as keyof typeof TOKEN_LIMITS] || TOKEN_LIMITS['Blue Lite'];

    await this.grantTokens(userId, monthlyGrant, 'monthly_grant', {
      plan,
      month: new Date().toISOString().slice(0, 7),
    });

    console.log(`[ROLLOVER] Granted ${monthlyGrant} tokens to user ${userId} (${plan})`);
  }
}

export const tokenLedgerService = new TokenLedgerService();
