import { db } from '../db';
import { demoTokens, organizations, organizationUsers } from '../../shared/schema';
import { eq, and, gt } from 'drizzle-orm';
import crypto from 'crypto';

export class DemoTokenService {
  // Current signing key - rotate this to invalidate old tokens
  private static CURRENT_SIGNING_KEY = 'preview-2024-v2-' + Date.now().toString(36);
  
  // Get current environment base URL
  private static getCurrentBaseUrl(): string {
    const repl_id = process.env.REPL_ID;
    const repl_owner = process.env.REPL_OWNER;
    const replit_domain = process.env.REPLIT_DEV_DOMAIN;
    
    if (repl_id && repl_owner) {
      return `https://${repl_id}.${repl_owner}.repl.co`;
    } else if (replit_domain) {
      return `https://${replit_domain}`;
    } else {
      return 'https://bluetradie.com'; // Production fallback
    }
  }
  
  // Generate secure demo token
  static async generateDemoToken(email: string, organizationId?: string): Promise<string> {
    const token = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 24); // 24 hour expiry
    
    const environment = process.env.NODE_ENV === 'production' ? 'production' : 'preview';
    const baseUrl = this.getCurrentBaseUrl();
    
    // Store token in database
    await db.insert(demoTokens).values({
      token,
      email,
      organizationId: organizationId || 'demo-org-default',
      expiresAt,
      environment,
      baseUrl,
      signingKey: this.CURRENT_SIGNING_KEY,
    });
    
    console.log(`[DEMO TOKEN] Generated token for ${email} valid for ${baseUrl} in ${environment}`);
    return token;
  }
  
  // Verify demo token and create session
  static async verifyDemoToken(token: string, requestHost: string): Promise<{
    success: boolean;
    user?: any;
    organizationId?: string;
    error?: string;
  }> {
    try {
      // Find valid token
      const tokenRecord = await db
        .select()
        .from(demoTokens)
        .where(and(
          eq(demoTokens.token, token),
          gt(demoTokens.expiresAt, new Date()),
          eq(demoTokens.signingKey, this.CURRENT_SIGNING_KEY) // Only current signing key tokens
        ))
        .limit(1);
      
      if (tokenRecord.length === 0) {
        console.log(`[DEMO TOKEN] Invalid or expired token: ${token}`);
        return { success: false, error: 'Invalid or expired demo link' };
      }
      
      const record = tokenRecord[0];
      
      // Verify host matches (prevent token reuse across environments)
      const currentBaseUrl = this.getCurrentBaseUrl();
      if (record.baseUrl !== currentBaseUrl) {
        console.log(`[DEMO TOKEN] Host mismatch. Token for ${record.baseUrl}, request from ${currentBaseUrl}`);
        return { success: false, error: 'Demo link not valid for this environment' };
      }
      
      // Mark token as used
      await db
        .update(demoTokens)
        .set({ usedAt: new Date() })
        .where(eq(demoTokens.token, token));
      
      // Create or get user and organization
      const userId = `demo-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      const orgId = record.organizationId || 'demo-org-default';
      
      // Ensure demo organization exists
      await db.insert(organizations).values({
        id: orgId,
        name: 'Demo Organization',
        type: 'demo',
        isDemo: true,
      }).onConflictDoNothing();
      
      // Create demo user
      const demoUser = {
        id: userId,
        email: record.email,
        firstName: 'Demo',
        lastName: 'User',
        country: 'Australia',
        trade: 'Electrician',
        businessName: 'Demo Electrical Services',
        profileImageUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=demo',
        isOnboarded: false, // Force onboarding for new demo
      };
      
      // Create organization user relationship (NOT ONBOARDED)
      await db.insert(organizationUsers).values({
        userId,
        organizationId: orgId,
        role: 'owner',
        isOnboarded: false, // Force onboarding per org
      }).onConflictDoNothing();
      
      console.log(`[DEMO TOKEN] Verified token for ${record.email}, created user ${userId} in org ${orgId}`);
      
      return {
        success: true,
        user: demoUser,
        organizationId: orgId,
      };
      
    } catch (error) {
      console.error('[DEMO TOKEN] Verification error:', error);
      return { success: false, error: 'Token verification failed' };
    }
  }
  
  // Generate demo URL for emails
  static generateDemoUrl(token: string, baseUrl?: string): string {
    const url = baseUrl || this.getCurrentBaseUrl();
    return `${url}/verify-demo/${token}`;
  }
  
  // Clean up expired tokens (run periodically)
  static async cleanupExpiredTokens(): Promise<number> {
    const result = await db
      .delete(demoTokens)
      .where(and(
        eq(demoTokens.usedAt, null),
        gt(new Date(), demoTokens.expiresAt)
      ));
    
    return result.rowCount || 0;
  }
}