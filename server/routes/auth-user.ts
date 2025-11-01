import { Router, type Request, type Response } from "express";

export const authUserRouter = Router();

authUserRouter.get("/api/auth/user", (req: Request, res: Response) => {
  const sess: any = (req as any).session;
  if (sess?.userId && sess?.passwordAuthenticated) {
    return res.status(200).json({
      userId: sess.userId,
      email: sess.email,
      isOnboarded: Boolean(sess.isOnboarded),
    });
  }
  return res.status(401).json({ message: "Unauthorized" });
});

authUserRouter.get("/api/user/first-run", (req: Request, res: Response) => {
  const sess: any = (req as any).session;
  if (!sess?.userId || !sess?.passwordAuthenticated) {
    return res.status(401).json({ message: "Unauthorized" });
  }
  
  const showWelcome = Boolean(sess.firstLogin);
  
  // Clear the first login flag after checking
  if (showWelcome) {
    sess.firstLogin = false;
    sess.save((err) => {
      if (err) console.error("[FIRST-RUN] Failed to clear firstLogin flag:", err);
    });
  }
  
  return res.json({ showWelcome });
});