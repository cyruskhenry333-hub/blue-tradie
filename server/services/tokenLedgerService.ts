import { db, pool, getClientWithTimeouts } from '../db';
import { tokenLedger, tokenAlerts, users, type TokenLedgerEntry } from '@shared/schema';
import { eq, desc, and, gte } from 'drizzle-orm';
import { randomUUID } from 'crypto';

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
   * Helper to log timing for DB operations
   */
  private logTiming(requestId: string, operation: string, startTime: number) {
    const duration = Date.now() - startTime;
    console.log(`[TokenLedger ${requestId}] ${operation} - took ${duration}ms`);
  }

  /**
   * Get current balance for a user by reading the most recent ledger entry
   */
  async getCurrentBalance(userId: string, requestId?: string): Promise<number> {
    const reqId = requestId || randomUUID();
    console.log(`[TokenLedger ${reqId}] getCurrentBalance START - userId=${userId}`);
    const startTime = Date.now();

    const entries = await db
      .select()
      .from(tokenLedger)
      .where(eq(tokenLedger.userId, userId))
      .orderBy(desc(tokenLedger.createdAt))
      .limit(1);

    this.logTiming(reqId, 'getCurrentBalance: SELECT latest entry', startTime);

    if (entries.length === 0) {
      console.log(`[TokenLedger ${reqId}] No entries found - initializing with monthly grant`);

      // No entries yet - initialize with monthly grant
      const userStartTime = Date.now();
      const user = await db.select().from(users).where(eq(users.id, userId)).limit(1);
      this.logTiming(reqId, 'getCurrentBalance: SELECT user', userStartTime);

      if (!user[0]) throw new Error('User not found');

      const plan = user[0].subscriptionTier || 'Blue Lite';
      const monthlyGrant = TOKEN_LIMITS[plan as keyof typeof TOKEN_LIMITS] || TOKEN_LIMITS['Blue Lite'];

      // Create initial grant
      await this.grantTokens(userId, monthlyGrant, 'initial_grant', { plan }, reqId);
      console.log(`[TokenLedger ${reqId}] getCurrentBalance COMPLETE - balance=${monthlyGrant} (initialized)`);
      return monthlyGrant;
    }

    console.log(`[TokenLedger ${reqId}] getCurrentBalance COMPLETE - balance=${entries[0].balanceAfter}`);
    return entries[0].balanceAfter;
  }

  /**
   * Grant tokens (monthly allocation, purchase, rollover, etc.)
   */
  async grantTokens(
    userId: string,
    amount: number,
    reason: string,
    metadata?: any,
    requestId?: string
  ): Promise<TokenLedgerEntry> {
    const reqId = requestId || randomUUID();
    console.log(`[TokenLedger ${reqId}] grantTokens START - userId=${userId}, amount=${amount}, reason=${reason}`);

    const balanceStartTime = Date.now();
    const currentBalance = await this.getCurrentBalance(userId, reqId);
    this.logTiming(reqId, 'grantTokens: getCurrentBalance', balanceStartTime);

    const transactionId = this.generateTraceId();
    const currentMonth = new Date().toISOString().slice(0, 7);
    const idempotencyKey = `grant-${userId}-${reason}-${currentMonth}`;

    console.log(`[TokenLedger ${reqId}] grantTokens: Inserting grant entry - newBalance=${currentBalance + amount}`);
    const insertStartTime = Date.now();

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

    this.logTiming(reqId, 'grantTokens: INSERT grant entry', insertStartTime);
    console.log(`[TokenLedger ${reqId}] grantTokens COMPLETE - entryId=${entry.id}`);

    return entry;
  }

  /**
   * Provision tokens (pessimistic lock before API call)
   * Uses transaction with row locking to prevent race conditions
   */
  async provisionTokens(
    userId: string,
    estimatedTokens: number,
    context: { advisor: string; messageId?: number },
    requestId?: string
  ): Promise<{ provisionId: number; transactionId: string; balanceAfter: number }> {
    const reqId = requestId || randomUUID();
    console.log(`[TokenLedger ${reqId}] provisionTokens START - userId=${userId}, estimated=${estimatedTokens}`);
    const overallStartTime = Date.now();

    const transactionId = this.generateTraceId();

    // Use raw SQL transaction with SELECT FOR UPDATE to prevent race conditions
    console.log(`[TokenLedger ${reqId}] provisionTokens: Acquiring client with guaranteed timeouts...`);
    const clientStartTime = Date.now();
    const client = await getClientWithTimeouts();
    this.logTiming(reqId, 'provisionTokens: Acquired client with timeouts', clientStartTime);

    console.log(`[TokenLedger ${reqId}] provisionTokens: Starting transaction with row lock...`);

    try {
      const txStartTime = Date.now();
      await client.query('BEGIN');
      this.logTiming(reqId, 'provisionTokens: BEGIN transaction', txStartTime);

      // Lock and get latest balance (prevents concurrent provisions from corrupting balance)
      console.log(`[TokenLedger ${reqId}] provisionTokens: Acquiring row lock on latest ledger entry...`);
      const lockStartTime = Date.now();

      const lockResult = await client.query(
        `SELECT balance_after FROM token_ledger
         WHERE user_id = $1
         ORDER BY created_at DESC
         LIMIT 1
         FOR UPDATE`,
        [userId]
      );

      this.logTiming(reqId, 'provisionTokens: SELECT FOR UPDATE (row lock)', lockStartTime);

      let currentBalance: number;

      if (lockResult.rows.length === 0) {
        // No entries yet - need to initialize
        console.log(`[TokenLedger ${reqId}] provisionTokens: No entries found, initializing user...`);
        const userStartTime = Date.now();

        const userResult = await client.query(
          `SELECT subscription_tier FROM users WHERE id = $1`,
          [userId]
        );

        this.logTiming(reqId, 'provisionTokens: SELECT user for initialization', userStartTime);

        if (userResult.rows.length === 0) {
          await client.query('ROLLBACK');
          throw new Error('User not found');
        }

        const plan = userResult.rows[0].subscription_tier || 'Blue Lite';
        const monthlyGrant = TOKEN_LIMITS[plan as keyof typeof TOKEN_LIMITS] || TOKEN_LIMITS['Blue Lite'];
        currentBalance = monthlyGrant;

        // Insert initial grant within same transaction
        console.log(`[TokenLedger ${reqId}] provisionTokens: Inserting initial grant of ${monthlyGrant} tokens...`);
        const grantStartTime = Date.now();

        await client.query(
          `INSERT INTO token_ledger (user_id, amount, balance_after, reason, metadata, transaction_id, idempotency_key, reconciliation_status)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
          [
            userId,
            monthlyGrant,
            monthlyGrant,
            'initial_grant',
            JSON.stringify({ plan }),
            transactionId,
            `grant-${userId}-initial_grant-${new Date().toISOString().slice(0, 7)}`,
            'confirmed'
          ]
        );

        this.logTiming(reqId, 'provisionTokens: INSERT initial grant', grantStartTime);
      } else {
        currentBalance = lockResult.rows[0].balance_after;
        console.log(`[TokenLedger ${reqId}] provisionTokens: Current balance locked - balance=${currentBalance}`);
      }

      // Check sufficient balance
      if (currentBalance < estimatedTokens) {
        await client.query('ROLLBACK');
        console.error(`[TokenLedger ${reqId}] provisionTokens FAILED - insufficient balance: ${currentBalance} < ${estimatedTokens}`);
        throw new Error(`Insufficient token balance. Available: ${currentBalance}, Required: ${estimatedTokens}`);
      }

      // Insert provision entry
      console.log(`[TokenLedger ${reqId}] provisionTokens: Inserting provision entry - deducting ${estimatedTokens} tokens...`);
      const insertStartTime = Date.now();

      const insertResult = await client.query(
        `INSERT INTO token_ledger (user_id, amount, balance_after, reason, metadata, transaction_id, idempotency_key, reconciliation_status)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
         RETURNING id, balance_after`,
        [
          userId,
          -estimatedTokens,
          currentBalance - estimatedTokens,
          'provision',
          JSON.stringify({ ...context, estimated: true }),
          transactionId,
          `provision-${transactionId}`,
          'pending'
        ]
      );

      this.logTiming(reqId, 'provisionTokens: INSERT provision entry', insertStartTime);

      const commitStartTime = Date.now();
      await client.query('COMMIT');
      this.logTiming(reqId, 'provisionTokens: COMMIT transaction', commitStartTime);

      const provision = insertResult.rows[0];
      const totalDuration = Date.now() - overallStartTime;

      console.log(`[TokenLedger ${reqId}] provisionTokens COMPLETE - provisionId=${provision.id}, newBalance=${provision.balance_after}, totalDuration=${totalDuration}ms`);

      return {
        provisionId: provision.id,
        transactionId,
        balanceAfter: provision.balance_after,
      };

    } catch (error: any) {
      await client.query('ROLLBACK');
      console.error(`[TokenLedger ${reqId}] provisionTokens ERROR - ${error.message}`);
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * Reconcile after API call completes
   */
  async reconcileTokens(
    provisionId: number,
    transactionId: string,
    actualTokens: number,
    openaiUsage: any,
    requestId?: string
  ): Promise<void> {
    const reqId = requestId || randomUUID();
    console.log(`[TokenLedger ${reqId}] reconcileTokens START - provisionId=${provisionId}, actual=${actualTokens}`);
    const overallStartTime = Date.now();

    // Mark provision as confirmed
    console.log(`[TokenLedger ${reqId}] reconcileTokens: Marking provision as confirmed...`);
    const updateStartTime = Date.now();

    await db
      .update(tokenLedger)
      .set({ reconciliationStatus: 'confirmed' })
      .where(eq(tokenLedger.id, provisionId));

    this.logTiming(reqId, 'reconcileTokens: UPDATE provision status', updateStartTime);

    // Get provision entry to calculate difference
    console.log(`[TokenLedger ${reqId}] reconcileTokens: Fetching provision entry...`);
    const selectStartTime = Date.now();

    const [provision] = await db
      .select()
      .from(tokenLedger)
      .where(eq(tokenLedger.id, provisionId))
      .limit(1);

    this.logTiming(reqId, 'reconcileTokens: SELECT provision entry', selectStartTime);

    if (!provision) {
      throw new Error('Provision not found');
    }

    const estimatedTokens = Math.abs(provision.amount);
    const difference = estimatedTokens - actualTokens;

    console.log(`[TokenLedger ${reqId}] reconcileTokens: estimated=${estimatedTokens}, actual=${actualTokens}, difference=${difference}`);

    // If actual usage differs from estimate, create adjustment entry
    if (difference !== 0) {
      console.log(`[TokenLedger ${reqId}] reconcileTokens: Creating adjustment entry (difference=${difference})...`);
      const adjustmentStartTime = Date.now();

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

      this.logTiming(reqId, 'reconcileTokens: INSERT adjustment entry', adjustmentStartTime);

      // Check if alert needed with adjusted balance
      await this.checkAndSendAlert(provision.userId, provision.balanceAfter + difference, reqId);
    } else {
      console.log(`[TokenLedger ${reqId}] reconcileTokens: No adjustment needed (actual === estimated)`);

      // No adjustment needed, but still check alerts
      await this.checkAndSendAlert(provision.userId, provision.balanceAfter, reqId);
    }

    const totalDuration = Date.now() - overallStartTime;
    console.log(`[TokenLedger ${reqId}] reconcileTokens COMPLETE - totalDuration=${totalDuration}ms`);
  }

  /**
   * Rollback provision on error
   */
  async rollbackProvision(provisionId: number, transactionId: string, error: string, requestId?: string): Promise<void> {
    const reqId = requestId || randomUUID();
    console.log(`[TokenLedger ${reqId}] rollbackProvision START - provisionId=${provisionId}, error=${error}`);
    const overallStartTime = Date.now();

    // Get provision entry
    console.log(`[TokenLedger ${reqId}] rollbackProvision: Fetching provision entry...`);
    const selectStartTime = Date.now();

    const [provision] = await db
      .select()
      .from(tokenLedger)
      .where(eq(tokenLedger.id, provisionId))
      .limit(1);

    this.logTiming(reqId, 'rollbackProvision: SELECT provision entry', selectStartTime);

    if (!provision) {
      throw new Error('Provision not found');
    }

    // Mark provision as rolled back
    console.log(`[TokenLedger ${reqId}] rollbackProvision: Marking provision as rolled_back...`);
    const updateStartTime = Date.now();

    await db
      .update(tokenLedger)
      .set({ reconciliationStatus: 'rolled_back' })
      .where(eq(tokenLedger.id, provisionId));

    this.logTiming(reqId, 'rollbackProvision: UPDATE provision status', updateStartTime);

    // Create rollback entry (credit back the tokens)
    const rollbackAmount = Math.abs(provision.amount);
    console.log(`[TokenLedger ${reqId}] rollbackProvision: Inserting rollback entry (crediting ${rollbackAmount} tokens)...`);
    const insertStartTime = Date.now();

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

    this.logTiming(reqId, 'rollbackProvision: INSERT rollback entry', insertStartTime);

    const totalDuration = Date.now() - overallStartTime;
    console.log(`[TokenLedger ${reqId}] rollbackProvision COMPLETE - totalDuration=${totalDuration}ms`);
  }

  /**
   * Check if 80% alert should be sent (once per month)
   */
  private async checkAndSendAlert(userId: string, currentBalance: number, requestId?: string): Promise<void> {
    const reqId = requestId || randomUUID();
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
