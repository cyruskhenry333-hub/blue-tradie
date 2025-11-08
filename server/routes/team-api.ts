import { Router, type Request, type Response } from "express";
import { teamService } from "../services/teamService";
import { insertTeamInvitationSchema } from "@shared/schema";

export const teamApiRouter = Router();

/**
 * Get all team members for the authenticated user's business
 */
teamApiRouter.get("/api/team/members", async (req: any, res: Response) => {
  try {
    if (!req.user?.claims?.sub) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const userId = req.user.claims.sub;
    const members = await teamService.getTeamMembers(userId);

    res.json(members);
  } catch (error) {
    console.error("[TEAM API] Error fetching team members:", error);
    res.status(500).json({ message: "Failed to fetch team members" });
  }
});

/**
 * Get pending invitations
 */
teamApiRouter.get("/api/team/invitations", async (req: any, res: Response) => {
  try {
    if (!req.user?.claims?.sub) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const userId = req.user.claims.sub;
    const invitations = await teamService.getPendingInvitations(userId);

    res.json(invitations);
  } catch (error) {
    console.error("[TEAM API] Error fetching invitations:", error);
    res.status(500).json({ message: "Failed to fetch invitations" });
  }
});

/**
 * Create team invitation
 */
teamApiRouter.post("/api/team/invitations", async (req: any, res: Response) => {
  try {
    if (!req.user?.claims?.sub) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const userId = req.user.claims.sub;
    const { email, role } = req.body;

    if (!email) {
      return res.status(400).json({ message: "Email is required" });
    }

    // Validate role
    const validRoles = ['admin', 'member', 'viewer'];
    if (role && !validRoles.includes(role)) {
      return res.status(400).json({ message: "Invalid role" });
    }

    const invitation = await teamService.createInvitation(
      userId,
      userId,
      email,
      role || 'member'
    );

    res.json(invitation);
  } catch (error) {
    console.error("[TEAM API] Error creating invitation:", error);
    res.status(500).json({
      message: (error as Error).message || "Failed to create invitation",
    });
  }
});

/**
 * Cancel invitation
 */
teamApiRouter.delete("/api/team/invitations/:id", async (req: any, res: Response) => {
  try {
    if (!req.user?.claims?.sub) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const userId = req.user.claims.sub;
    const invitationId = parseInt(req.params.id);

    await teamService.cancelInvitation(invitationId, userId);

    res.json({ success: true });
  } catch (error) {
    console.error("[TEAM API] Error cancelling invitation:", error);
    res.status(500).json({
      message: (error as Error).message || "Failed to cancel invitation",
    });
  }
});

/**
 * Accept team invitation (public endpoint, no auth required)
 */
teamApiRouter.post("/api/team/accept-invitation", async (req: any, res: Response) => {
  try {
    const { token } = req.body;

    if (!token) {
      return res.status(400).json({ message: "Token is required" });
    }

    // User must be authenticated to accept invitation
    if (!req.user?.claims?.sub) {
      return res.status(401).json({
        message: "You must be logged in to accept an invitation",
      });
    }

    const userId = req.user.claims.sub;
    const teamMember = await teamService.acceptInvitation(token, userId);

    res.json(teamMember);
  } catch (error) {
    console.error("[TEAM API] Error accepting invitation:", error);
    res.status(500).json({
      message: (error as Error).message || "Failed to accept invitation",
    });
  }
});

/**
 * Update team member role
 */
teamApiRouter.put("/api/team/members/:id/role", async (req: any, res: Response) => {
  try {
    if (!req.user?.claims?.sub) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const userId = req.user.claims.sub;
    const teamMemberId = parseInt(req.params.id);
    const { role } = req.body;

    // Validate role
    const validRoles = ['admin', 'member', 'viewer'];
    if (!role || !validRoles.includes(role)) {
      return res.status(400).json({ message: "Invalid role" });
    }

    const updated = await teamService.updateMemberRole(teamMemberId, userId, role);

    res.json(updated);
  } catch (error) {
    console.error("[TEAM API] Error updating member role:", error);
    res.status(500).json({
      message: (error as Error).message || "Failed to update member role",
    });
  }
});

/**
 * Remove team member
 */
teamApiRouter.delete("/api/team/members/:id", async (req: any, res: Response) => {
  try {
    if (!req.user?.claims?.sub) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const userId = req.user.claims.sub;
    const teamMemberId = parseInt(req.params.id);

    await teamService.removeMember(teamMemberId, userId);

    res.json({ success: true });
  } catch (error) {
    console.error("[TEAM API] Error removing team member:", error);
    res.status(500).json({
      message: (error as Error).message || "Failed to remove team member",
    });
  }
});

/**
 * Get current user's team membership status
 */
teamApiRouter.get("/api/team/my-membership", async (req: any, res: Response) => {
  try {
    if (!req.user?.claims?.sub) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const userId = req.user.claims.sub;
    const member = await teamService.getMemberDetails(userId);

    res.json({
      isMember: !!member,
      membership: member,
    });
  } catch (error) {
    console.error("[TEAM API] Error fetching membership:", error);
    res.status(500).json({ message: "Failed to fetch membership status" });
  }
});

export default teamApiRouter;
