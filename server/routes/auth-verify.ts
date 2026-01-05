import { Router, type Request, type Response } from "express";
import jwt from "jsonwebtoken";
import { storage } from "../storage";
import { authService } from "../services/auth-service";
import { analyticsService } from "../services/analyticsService";

const MAGIC_LINK_JWT_SECRET = process.env.MAGIC_LINK_JWT_SECRET || process.env.SESSION_SECRET || 'fallback-jwt-secret';
const DEFAULT_REDIRECT = "/dashboard?fresh=1";

export const authVerifyRouter = Router();

authVerifyRouter.get("/auth/verify", async (req: Request, res: Response) => {
  // Never cache magic link verification responses
  res.setHeader('Cache-Control', 'no-store');

  const token = String(req.query.token || "");
  if (!token) {
    console.error("[VERIFY] Missing token parameter");
    return res.redirect("/login?error=missing_token");
  }

  try {
    // Step 1: Verify JWT signature and extract payload
    const payload = jwt.verify(token, MAGIC_LINK_JWT_SECRET) as {
      email: string;
      userId: string;
      tokenId: string;
      redirect?: string;
      exp: number;
      iat: number;
    };

    console.log("[VERIFY] JWT verified, checking single-use token:", {
      tokenId: payload.tokenId,
      email: payload.email,
      userId: payload.userId
    });

    // Step 2: Check if token has been consumed (single-use enforcement)
    const magicToken = await authService.verifyAndConsumeMagicLinkToken(payload.tokenId);
    if (!magicToken) {
      console.error("[VERIFY] Token not found, expired, or already used:", payload.tokenId);
      return res.redirect("/login?error=invalid_or_expired_token");
    }

    const sess: any = (req as any).session;
    if (!sess) {
      console.error("[VERIFY] No session object on request");
      return res.redirect("/login?error=session_error");
    }

    // Step 3: Load user to get current onboarding status
    let user;
    try {
      user = await storage.getUser(payload.userId);
      if (!user || user.email !== payload.email) {
        console.error("[VERIFY] User not found or email mismatch");
        return res.redirect("/login?error=user_not_found");
      }
    } catch (error) {
      console.error("[VERIFY] Error loading user:", error);
      return res.redirect("/login?error=user_not_found");
    }

    // Step 4: Write session in the format our app expects
    sess.userId = payload.userId;
    sess.email = payload.email;
    sess.passwordAuthenticated = true;
    sess.isOnboarded = Boolean(user.isOnboarded);

    // Step 5: Check if this is first login and set welcome tour flag
    if (!user.firstLoginAt) {
      try {
        await storage.updateUser(user.id, { firstLoginAt: new Date() });
        sess.firstLogin = true;
        console.log(`[VERIFY] First login detected for user ${user.id}`);
      } catch (error) {
        console.error(`[VERIFY] Failed to update firstLoginAt:`, error);
      }
    }

    // Step 6: Determine redirect destination
    const redirect = payload.redirect || (sess.isOnboarded ? "/dashboard?fresh=1" : "/onboarding") || DEFAULT_REDIRECT;

    console.log("[VERIFY] About to save session before redirect:", {
      sessionId: sess.id,
      userId: sess.userId,
      email: sess.email,
      isOnboarded: sess.isOnboarded,
      firstLogin: sess.firstLogin,
      sessionKeys: Object.keys(sess),
      redirectTo: redirect
    });

    // Track login analytics event
    await analyticsService.trackEvent({
      userId: payload.userId,
      eventType: sess.firstLogin ? 'first_login' : 'login',
      eventCategory: 'user',
      eventData: {
        method: 'magic_link',
        isOnboarded: sess.isOnboarded,
        isFirstLogin: sess.firstLogin || false,
        redirectTo: redirect,
      },
      req,
    });

    // Start analytics session for user
    const analyticsSessionId = await analyticsService.startSession(payload.userId, req);

    // Step 7: Persist session BEFORE redirect to avoid race conditions
    sess.save((err: unknown) => {
      if (err) {
        console.error("[VERIFY] ❌ session.save error:", err);
        return res.redirect("/login?error=session_failed");
      }
      console.log("[VERIFY] ✅ Session saved successfully, redirecting:", {
        sessionId: sess.id,
        userId: payload.userId,
        email: payload.email,
        isOnboarded: sess.isOnboarded,
        firstLogin: sess.firstLogin,
        redirect
      });
      return res.redirect(redirect);
    });
  } catch (e: any) {
    console.error("[VERIFY] Token verification failed:", e?.message);
    return res.redirect("/login?error=invalid_token");
  }
});

export default authVerifyRouter;