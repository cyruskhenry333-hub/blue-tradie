import { randomBytes, createHash } from 'crypto';
import { nanoid } from 'nanoid';
import { eq, and, lt, isNull, gt } from 'drizzle-orm';
import { db } from '../db';
import { authSessions, magicLinkTokens, users } from '../../shared/schema';
import type { AuthSession, MagicLinkToken, InsertAuthSession, InsertMagicLinkToken } from '../../shared/schema';

const SESSION_TTL_DAYS = parseInt(process.env.SESSION_TTL_DAYS || '30');
const MAGIC_LINK_TTL_MINUTES = parseInt(process.env.MAGIC_LINK_TTL_MINUTES || '15');
const SESSION_COOKIE_NAME = process.env.SESSION_COOKIE_NAME || 'bt_sess';

export class AuthService {
  
  // Session Management
  async createSession(userId: string, ipAddress?: string, userAgent?: string): Promise<AuthSession> {
    const sessionId = nanoid();
    const expiresAt = new Date(Date.now() + SESSION_TTL_DAYS * 24 * 60 * 60 * 1000);
    
    const [session] = await db.insert(authSessions).values({
      id: sessionId,
      userId,
      expiresAt,
      ipAddress,
      userAgent,
    }).returning();
    
    return session;
  }
  
  async getValidSession(sessionId: string): Promise<AuthSession | null> {
    const [session] = await db.select()
      .from(authSessions)
      .where(
        and(
          eq(authSessions.id, sessionId),
          isNull(authSessions.revokedAt),
          gt(authSessions.expiresAt, new Date())
        )
      )
      .limit(1);
    
    return session || null;
  }
  
  async revokeSession(sessionId: string): Promise<boolean> {
    const result = await db.update(authSessions)
      .set({ revokedAt: new Date() })
      .where(eq(authSessions.id, sessionId));
    
    return (result.rowCount || 0) > 0;
  }
  
  async revokeAllUserSessions(userId: string): Promise<number> {
    const result = await db.update(authSessions)
      .set({ revokedAt: new Date() })
      .where(
        and(
          eq(authSessions.userId, userId),
          isNull(authSessions.revokedAt)
        )
      );
    
    return result.rowCount || 0;
  }
  
  // Magic Link Token Management
  async createMagicLinkToken(
    email: string, 
    userId?: string, 
    ipAddress?: string, 
    userAgent?: string
  ): Promise<{ token: string; tokenId: string }> {
    // Generate a secure random token
    const token = randomBytes(32).toString('hex');
    const tokenHash = createHash('sha256').update(token).digest('hex');
    const tokenId = nanoid();
    const expiresAt = new Date(Date.now() + MAGIC_LINK_TTL_MINUTES * 60 * 1000);
    
    await db.insert(magicLinkTokens).values({
      id: tokenId,
      email: email.toLowerCase(),
      userId,
      tokenHash,
      purpose: 'login',
      expiresAt,
      ipAddress,
      userAgent,
    });
    
    return { token, tokenId };
  }
  
  async verifyAndConsumeMagicLinkToken(token: string): Promise<MagicLinkToken | null> {
    const tokenHash = createHash('sha256').update(token).digest('hex');
    
    // Find valid, unconsumed token
    const [magicToken] = await db.select()
      .from(magicLinkTokens)
      .where(
        and(
          eq(magicLinkTokens.tokenHash, tokenHash),
          isNull(magicLinkTokens.consumedAt),
          gt(magicLinkTokens.expiresAt, new Date())
        )
      )
      .limit(1);
    
    if (!magicToken) {
      return null;
    }
    
    // Mark token as consumed
    await db.update(magicLinkTokens)
      .set({ consumedAt: new Date() })
      .where(eq(magicLinkTokens.id, magicToken.id));
    
    return magicToken;
  }
  
  // User lookup for magic links
  async getUserByEmail(email: string) {
    const [user] = await db.select()
      .from(users)
      .where(eq(users.email, email.toLowerCase()))
      .limit(1);
    
    return user || null;
  }
  
  // Cookie management helpers
  getSessionCookieName(): string {
    return SESSION_COOKIE_NAME;
  }
  
  getSessionCookieOptions() {
    return {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax' as const,
      maxAge: SESSION_TTL_DAYS * 24 * 60 * 60 * 1000, // milliseconds
      domain: process.env.APP_DOMAIN || undefined,
    };
  }
  
  // Cleanup expired tokens and sessions
  async cleanupExpired(): Promise<{ sessions: number; tokens: number }> {
    const now = new Date();
    
    const [sessionResult, tokenResult] = await Promise.all([
      db.update(authSessions)
        .set({ revokedAt: now })
        .where(
          and(
            lt(authSessions.expiresAt, now),
            isNull(authSessions.revokedAt)
          )
        ),
      db.delete(magicLinkTokens)
        .where(lt(magicLinkTokens.expiresAt, now))
    ]);
    
    return {
      sessions: sessionResult.rowCount || 0,
      tokens: tokenResult.rowCount || 0,
    };
  }
}

export const authService = new AuthService();