/**
 * DEV-ONLY ADMIN BYPASS MIDDLEWARE
 *
 * This middleware ONLY runs in development when ENABLE_DEV_ADMIN=true
 * It creates a real admin user in the database to bypass authentication for local QA.
 *
 * CRITICAL SAFETY GUARDS:
 * - Never runs in production (double-checked)
 * - Requires explicit env flag
 * - Logs clearly when active
 */

import type { Request, Response, NextFunction } from "express";

const DEV_USER_ID = 'dev-admin-bypass-user';
const DEV_USER_EMAIL = 'admin@dev.local';

// Cache to avoid repeated database lookups
let devUserCreated = false;

export async function devAdminBypass(req: Request, res: Response, next: NextFunction) {
  // DOUBLE GUARD: Never run in production
  if (process.env.NODE_ENV === 'production') {
    console.error('[DEV-ADMIN-BYPASS] BLOCKED: Attempted to run in production!');
    return next();
  }

  // Only activate if explicitly enabled
  if (process.env.ENABLE_DEV_ADMIN !== 'true') {
    return next();
  }

  try {
    // Ensure dev user exists in database (only once)
    if (!devUserCreated) {
      const { db } = await import('../db');
      const { users } = await import('../../shared/schema');
      const { eq } = await import('drizzle-orm');

      const existingUser = await db
        .select()
        .from(users)
        .where(eq(users.id, DEV_USER_ID))
        .limit(1);

      if (existingUser.length === 0) {
        await db.insert(users).values({
          id: DEV_USER_ID,
          email: DEV_USER_EMAIL,
          firstName: 'Dev',
          lastName: 'Admin',
          businessName: 'Dev Testing Co',
          trade: 'Electrician',
          country: 'AU',
          createdAt: new Date(),
        });
        console.log('[DEV-ADMIN-BYPASS] Created dev admin user in database');
      }

      devUserCreated = true;
    }

    const sess: any = req.session;

    // Always set session data if not present
    if (!sess.userId) {
      sess.userId = DEV_USER_ID;
      sess.email = DEV_USER_EMAIL;
      sess.passwordAuthenticated = true;
      sess.isOnboarded = true;

      // Only log once per session
      if (!sess._devBypassLogged) {
        console.log('[DEV-ADMIN-BYPASS] ✅ Active - bypassing auth as admin');
        sess._devBypassLogged = true;
      }
    }

    // ALWAYS set req.user for OAuth-style routes (documents API, etc.)
    if (!(req as any).user) {
      (req as any).user = {
        claims: {
          sub: DEV_USER_ID,
          email: DEV_USER_EMAIL,
        },
        id: DEV_USER_ID,
        email: DEV_USER_EMAIL,
      };
    }

    next();
  } catch (error) {
    console.error('[DEV-ADMIN-BYPASS] Error setting up dev user:', error);
    next(); // Continue even if setup fails
  }
}

/**
 * Instructions to disable:
 *
 * 1. In .env.local, set ENABLE_DEV_ADMIN=false (or remove the line)
 * 2. Restart the dev server
 * 3. Clear browser cookies for localhost:5173
 *
 * This middleware will never run in production builds.
 */
