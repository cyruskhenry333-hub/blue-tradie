/**
 * DEV-ONLY ADMIN BYPASS MIDDLEWARE
 *
 * This middleware ONLY runs in development when ENABLE_DEV_ADMIN=true
 * It creates a fake admin session to bypass authentication for local QA.
 *
 * CRITICAL SAFETY GUARDS:
 * - Never runs in production (double-checked)
 * - Requires explicit env flag
 * - Logs clearly when active
 */

import type { Request, Response, NextFunction } from "express";

export function devAdminBypass(req: Request, res: Response, next: NextFunction) {
  // DOUBLE GUARD: Never run in production
  if (process.env.NODE_ENV === 'production') {
    console.error('[DEV-ADMIN-BYPASS] BLOCKED: Attempted to run in production!');
    return next();
  }

  // Only activate if explicitly enabled
  if (process.env.ENABLE_DEV_ADMIN !== 'true') {
    return next();
  }

  const sess: any = req.session;

  // Always set session data if not present
  if (!sess.userId) {
    sess.userId = 'dev-admin-bypass-user-id';
    sess.email = 'admin@dev.local';
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
        sub: 'dev-admin-bypass-user-id',
        email: 'admin@dev.local',
      },
      id: 'dev-admin-bypass-user-id',
      email: 'admin@dev.local',
    };
  }

  next();
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
