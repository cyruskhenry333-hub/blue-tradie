import type { Request, Response } from "express";

export function getUserOr401(req: Request, res: Response) {
  const user = (req.session as any)?.user;
  if (!user) {
    res.status(401).json({ error: "Unauthorized" });
    return null;
  }
  return user as { id: string; email?: string; [k: string]: unknown };
}