import { Router, type Request, type Response } from "express";
import { db } from "../db";
import { users } from "@shared/schema";
import { desc, count, like, or } from "drizzle-orm";

export const adminUsersRouter = Router();

// Admin guard middleware
function isAdmin(req: Request): boolean {
  const sess: any = (req as any).session;
  const userEmail = sess?.email;

  if (!userEmail) return false;

  const adminEmails = process.env.ADMIN_EMAILS?.split(',').map(e => e.trim().toLowerCase()) || [];
  return adminEmails.includes(userEmail.toLowerCase());
}

// GET /api/admin/users - List all users with pagination
adminUsersRouter.get("/api/admin/users", async (req: Request, res: Response) => {
  const sess: any = (req as any).session;

  // Check authentication
  if (!sess?.userId || !sess?.passwordAuthenticated) {
    console.log("[ADMIN-USERS] Unauthorized access attempt");
    return res.status(401).json({ message: "Unauthorized" });
  }

  // Check admin permission
  if (!isAdmin(req)) {
    console.log("[ADMIN-USERS] Non-admin user attempted access:", sess.email);
    return res.status(403).json({ message: "Forbidden: Admin access required" });
  }

  try {
    const limit = parseInt(req.query.limit as string) || 50;
    const offset = parseInt(req.query.offset as string) || 0;
    const search = (req.query.search as string) || '';

    console.log("[ADMIN-USERS] Fetching users:", { limit, offset, search, requestedBy: sess.email });

    // Build query
    let query = db.select({
      id: users.id,
      email: users.email,
      firstName: users.firstName,
      lastName: users.lastName,
      businessName: users.businessName,
      trade: users.trade,
      country: users.country,
      isOnboarded: users.isOnboarded,
      isBetaUser: users.isBetaUser,
      betaTier: users.betaTier,
      stripeCustomerId: users.stripeCustomerId,
      stripeSubscriptionId: users.stripeSubscriptionId,
      subscriptionStatus: users.subscriptionStatus,
      subscriptionTier: users.subscriptionTier,
      isDemoUser: users.isDemoUser,
      demoStatus: users.demoStatus,
      createdAt: users.createdAt,
      firstLoginAt: users.firstLoginAt,
      welcomeSentAt: users.welcomeSentAt,
    }).from(users);

    // Apply search filter if provided
    if (search) {
      query = query.where(
        or(
          like(users.email, `%${search}%`),
          like(users.businessName, `%${search}%`),
          like(users.firstName, `%${search}%`),
          like(users.lastName, `%${search}%`)
        )
      ) as any;
    }

    // Get paginated results
    const userList = await query
      .orderBy(desc(users.createdAt))
      .limit(limit)
      .offset(offset);

    // Get total count for pagination
    const [{ value: totalCount }] = await db
      .select({ value: count() })
      .from(users);

    console.log("[ADMIN-USERS] Successfully fetched users:", {
      count: userList.length,
      total: totalCount,
      requestedBy: sess.email
    });

    return res.json({
      users: userList,
      pagination: {
        limit,
        offset,
        total: totalCount,
        hasMore: offset + limit < totalCount
      }
    });
  } catch (error) {
    console.error("[ADMIN-USERS] Error fetching users:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
});

// GET /api/admin/users/:id - Get single user details
adminUsersRouter.get("/api/admin/users/:id", async (req: Request, res: Response) => {
  const sess: any = (req as any).session;

  if (!sess?.userId || !sess?.passwordAuthenticated) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  if (!isAdmin(req)) {
    return res.status(403).json({ message: "Forbidden: Admin access required" });
  }

  try {
    const userId = req.params.id;
    const [user] = await db.select().from(users).where((t) => t.id === userId);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    console.log("[ADMIN-USERS] Fetched user details:", { userId, requestedBy: sess.email });

    // Return full user object (excluding sensitive fields if needed)
    const { ...userDetails } = user;
    return res.json(userDetails);
  } catch (error) {
    console.error("[ADMIN-USERS] Error fetching user details:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
});

export default adminUsersRouter;
