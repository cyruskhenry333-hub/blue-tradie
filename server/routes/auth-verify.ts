import { Router, type Request, type Response } from "express";
import jwt from "jsonwebtoken";
import { storage } from "../storage";

const MAGIC_LINK_JWT_SECRET = process.env.MAGIC_LINK_JWT_SECRET || process.env.SESSION_SECRET || 'fallback-jwt-secret';
const DEFAULT_REDIRECT = "/dashboard";

export const authVerifyRouter = Router();

authVerifyRouter.get("/auth/verify", async (req: Request, res: Response) => {
  const token = String(req.query.token || "");
  if (!token) return res.status(400).send("Missing token");

  try {
    const payload = jwt.verify(token, MAGIC_LINK_JWT_SECRET) as {
      email: string;
      userId: string;
      redirect?: string;
      exp: number;
      iat: number;
    };

    const sess: any = (req as any).session;
    if (!sess) {
      console.error("[VERIFY] No session object on request");
      return res.redirect("/login");
    }

    // Load user to get current onboarding status
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

    // Write session in the format our app expects
    sess.userId = payload.userId;
    sess.email = payload.email;
    sess.passwordAuthenticated = true;
    sess.isOnboarded = Boolean(user.isOnboarded);

    // Check if this is first login and set welcome tour flag
    if (!user.firstLoginAt) {
      try {
        await storage.updateUser(user.id, { firstLoginAt: new Date() });
        sess.firstLogin = true;
        console.log(`[VERIFY] First login detected for user ${user.id}`);
      } catch (error) {
        console.error(`[VERIFY] Failed to update firstLoginAt:`, error);
      }
    }

    const redirect =
      payload.redirect ||
      (sess.isOnboarded ? "/dashboard" : "/onboarding") ||
      DEFAULT_REDIRECT;

    // Persist session BEFORE redirect to avoid race conditions
    sess.save((err: unknown) => {
      if (err) {
        console.error("[VERIFY] session.save error:", err);
        return res.redirect("/login?error=session_failed");
      }
      console.log("[VERIFY OK]", {
        userId: payload.userId,
        email: payload.email,
        isOnboarded: sess.isOnboarded,
        redirect,
        sessionKeys: Object.keys(sess)
      });
      return res.redirect(redirect);
    });
  } catch (e: any) {
    console.error("[VERIFY] Invalid token:", e?.message);
    return res.redirect("/login");
  }
});

export default authVerifyRouter;