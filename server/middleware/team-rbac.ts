import { Request, Response, NextFunction } from "express";
import { teamService } from "../services/teamService";

/**
 * Extend Express Request to include team information
 */
declare global {
  namespace Express {
    interface Request {
      teamMember?: any;
      effectiveUserId?: string;
    }
  }
}

/**
 * Middleware to load team member information for authenticated users
 * This should be applied AFTER authentication middleware
 */
export async function loadTeamMember(
  req: any,
  res: Response,
  next: NextFunction
) {
  try {
    if (!req.user?.claims?.sub) {
      return next(); // No user, skip team loading
    }

    const userId = req.user.claims.sub;

    // Check if user is a team member
    const member = await teamService.getMemberDetails(userId);

    if (member) {
      // User is a team member
      req.teamMember = member;
      req.effectiveUserId = member.ownerId; // Access owner's data
    } else {
      // User is not a team member (is an owner or solo user)
      req.teamMember = null;
      req.effectiveUserId = userId; // Access own data
    }

    next();
  } catch (error) {
    console.error("[RBAC] Error loading team member:", error);
    // Don't fail the request, just continue without team info
    req.teamMember = null;
    req.effectiveUserId = req.user?.claims?.sub;
    next();
  }
}

/**
 * Middleware factory to require specific permissions
 * Usage: requirePermission('invoices', 'create')
 */
export function requirePermission(resource: string, action: string) {
  return async (req: any, res: Response, next: NextFunction) => {
    try {
      if (!req.user?.claims?.sub) {
        return res.status(401).json({ message: "Unauthorized" });
      }

      // If no team member info is loaded, assume full permissions (owner)
      if (!req.teamMember) {
        return next(); // Owner has all permissions
      }

      // Check if team member has the required permission
      const hasPermission = teamService.hasPermission(
        req.teamMember,
        resource,
        action
      );

      if (!hasPermission) {
        return res.status(403).json({
          message: `You don't have permission to ${action} ${resource}`,
          required: { resource, action },
        });
      }

      next();
    } catch (error) {
      console.error("[RBAC] Permission check error:", error);
      res.status(500).json({ message: "Permission check failed" });
    }
  };
}

/**
 * Middleware to require owner-only access
 * Team members (even admins) cannot perform this action
 */
export function requireOwner(req: any, res: Response, next: NextFunction) {
  if (!req.user?.claims?.sub) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  // If user is a team member, deny access
  if (req.teamMember) {
    return res.status(403).json({
      message: "This action can only be performed by the business owner",
    });
  }

  next();
}

/**
 * Middleware to require admin or owner access
 */
export function requireAdminOrOwner(
  req: any,
  res: Response,
  next: NextFunction
) {
  if (!req.user?.claims?.sub) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  // If no team member (is owner), allow
  if (!req.teamMember) {
    return next();
  }

  // Check if team member is admin
  if (req.teamMember.role === 'admin') {
    return next();
  }

  return res.status(403).json({
    message: "This action requires admin or owner privileges",
  });
}

/**
 * Middleware to require Teams tier subscription
 */
export async function requireTeamsTier(
  req: any,
  res: Response,
  next: NextFunction
) {
  try {
    if (!req.user?.claims?.sub) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const userId = req.user.claims.sub;

    // Import storage dynamically to avoid circular dependencies
    const { storage } = await import("../storage");
    const user = await storage.getUser(userId);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    if (user.subscriptionTier !== 'Blue Teams') {
      return res.status(403).json({
        message: "This feature requires a Blue Teams subscription",
        tier: user.subscriptionTier,
        required: 'Blue Teams',
      });
    }

    next();
  } catch (error) {
    console.error("[RBAC] Teams tier check error:", error);
    res.status(500).json({ message: "Subscription check failed" });
  }
}

/**
 * Helper to get effective user ID from request
 * Returns the owner's ID if user is a team member, otherwise returns user's own ID
 */
export function getEffectiveUserId(req: any): string {
  return req.effectiveUserId || req.user?.claims?.sub;
}
