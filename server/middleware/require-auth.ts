import type { Request, Response, NextFunction } from "express";

export function requireAuth(req: Request, res: Response, next: NextFunction) {
  try {
    const sess: any = (req as any).session;
    if (!sess) {
      console.warn("[AUTH BLOCK]", { hasSession: false, path: req.path, keys: [] });
      return res.status(401).json({ message: "Unauthorized" });
    }

    const userId = sess.userId;
    const isPwd = Boolean(sess.passwordAuthenticated);
    if (userId && isPwd) return next();

    console.warn("[AUTH BLOCK]", { 
      hasSession: true, 
      path: req.path,
      keys: Object.keys(sess || {}),
      hasUserId: !!userId,
      hasPasswordAuth: isPwd
    });
    return res.status(401).json({ message: "Unauthorized" });
  } catch (err) {
    console.error("[AUTH] Middleware error:", err);
    return res.status(401).json({ message: "Unauthorized" });
  }
}