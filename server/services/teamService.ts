import { db } from "../db";
import {
  teamMembers,
  teamInvitations,
  users,
  type TeamMember,
  type TeamInvitation,
  type InsertTeamMember,
  type InsertTeamInvitation,
} from "@shared/schema";
import { eq, and, or } from "drizzle-orm";
import crypto from "crypto";
import { emailService } from "./sendgrid-email-service";

/**
 * Permission sets for different team roles
 */
const ROLE_PERMISSIONS = {
  owner: {
    invoices: ['view', 'create', 'edit', 'delete', 'send'],
    quotes: ['view', 'create', 'edit', 'delete', 'send'],
    jobs: ['view', 'create', 'edit', 'delete'],
    expenses: ['view', 'create', 'edit', 'delete'],
    team: ['view', 'invite', 'edit', 'remove'],
    settings: ['view', 'edit'],
    reports: ['view'],
  },
  admin: {
    invoices: ['view', 'create', 'edit', 'send'],
    quotes: ['view', 'create', 'edit', 'send'],
    jobs: ['view', 'create', 'edit'],
    expenses: ['view', 'create', 'edit'],
    team: ['view', 'invite'],
    settings: ['view'],
    reports: ['view'],
  },
  member: {
    invoices: ['view', 'create'],
    quotes: ['view', 'create'],
    jobs: ['view', 'create', 'edit'],
    expenses: ['view', 'create'],
    team: ['view'],
    settings: [],
    reports: [],
  },
  viewer: {
    invoices: ['view'],
    quotes: ['view'],
    jobs: ['view'],
    expenses: ['view'],
    team: [],
    settings: [],
    reports: [],
  },
};

export class TeamService {
  /**
   * Create a team invitation
   */
  async createInvitation(
    ownerId: string,
    invitedBy: string,
    email: string,
    role: 'admin' | 'member' | 'viewer' = 'member'
  ): Promise<TeamInvitation> {
    // Verify owner has Teams tier subscription
    const [owner] = await db.select().from(users).where(eq(users.id, ownerId)).limit(1);
    if (!owner) {
      throw new Error('Owner not found');
    }

    if (owner.subscriptionTier !== 'Blue Teams') {
      throw new Error('Teams tier subscription required to invite team members');
    }

    // Check if invitation already exists for this email
    const [existingInvite] = await db
      .select()
      .from(teamInvitations)
      .where(
        and(
          eq(teamInvitations.ownerId, ownerId),
          eq(teamInvitations.email, email),
          eq(teamInvitations.status, 'pending')
        )
      )
      .limit(1);

    if (existingInvite) {
      throw new Error('An invitation for this email already exists');
    }

    // Check if user is already a team member
    const existingUser = await db
      .select()
      .from(users)
      .where(eq(users.email, email))
      .limit(1);

    if (existingUser.length > 0) {
      const [existing] = await db
        .select()
        .from(teamMembers)
        .where(
          and(
            eq(teamMembers.ownerId, ownerId),
            eq(teamMembers.memberId, existingUser[0].id)
          )
        )
        .limit(1);

      if (existing) {
        throw new Error('User is already a team member');
      }
    }

    // Generate secure token
    const token = crypto.randomBytes(32).toString('hex');
    const tokenHash = crypto.createHash('sha256').update(token).digest('hex');

    // Create invitation
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7); // 7 days expiry

    const [invitation] = await db
      .insert(teamInvitations)
      .values({
        ownerId,
        email,
        role,
        token,
        tokenHash,
        status: 'pending',
        invitedBy,
        expiresAt,
      })
      .returning();

    // Send invitation email
    await this.sendInvitationEmail(invitation, owner, token);

    return invitation;
  }

  /**
   * Accept team invitation
   */
  async acceptInvitation(token: string, userId: string): Promise<TeamMember> {
    const tokenHash = crypto.createHash('sha256').update(token).digest('hex');

    // Find invitation
    const [invitation] = await db
      .select()
      .from(teamInvitations)
      .where(
        and(
          eq(teamInvitations.tokenHash, tokenHash),
          eq(teamInvitations.status, 'pending')
        )
      )
      .limit(1);

    if (!invitation) {
      throw new Error('Invalid or expired invitation');
    }

    // Check expiry
    if (new Date() > new Date(invitation.expiresAt)) {
      await db
        .update(teamInvitations)
        .set({ status: 'expired' })
        .where(eq(teamInvitations.id, invitation.id));
      throw new Error('Invitation has expired');
    }

    // Verify user email matches invitation
    const [user] = await db.select().from(users).where(eq(users.id, userId)).limit(1);
    if (!user || user.email !== invitation.email) {
      throw new Error('User email does not match invitation');
    }

    // Create team member
    const permissions = ROLE_PERMISSIONS[invitation.role as keyof typeof ROLE_PERMISSIONS] || ROLE_PERMISSIONS.member;

    const [teamMember] = await db
      .insert(teamMembers)
      .values({
        ownerId: invitation.ownerId,
        memberId: userId,
        role: invitation.role,
        permissions,
        status: 'active',
        invitedBy: invitation.invitedBy,
      })
      .returning();

    // Mark invitation as accepted
    await db
      .update(teamInvitations)
      .set({
        status: 'accepted',
        acceptedAt: new Date(),
      })
      .where(eq(teamInvitations.id, invitation.id));

    return teamMember;
  }

  /**
   * Cancel team invitation
   */
  async cancelInvitation(invitationId: number, ownerId: string): Promise<void> {
    const [invitation] = await db
      .select()
      .from(teamInvitations)
      .where(
        and(
          eq(teamInvitations.id, invitationId),
          eq(teamInvitations.ownerId, ownerId)
        )
      )
      .limit(1);

    if (!invitation) {
      throw new Error('Invitation not found');
    }

    await db
      .update(teamInvitations)
      .set({
        status: 'cancelled',
        cancelledAt: new Date(),
      })
      .where(eq(teamInvitations.id, invitationId));
  }

  /**
   * Get all team members for a business owner
   */
  async getTeamMembers(ownerId: string): Promise<Array<TeamMember & { memberEmail?: string; memberName?: string }>> {
    const members = await db
      .select({
        id: teamMembers.id,
        ownerId: teamMembers.ownerId,
        memberId: teamMembers.memberId,
        role: teamMembers.role,
        permissions: teamMembers.permissions,
        status: teamMembers.status,
        invitedBy: teamMembers.invitedBy,
        joinedAt: teamMembers.joinedAt,
        createdAt: teamMembers.createdAt,
        updatedAt: teamMembers.updatedAt,
        memberEmail: users.email,
        memberName: users.firstName,
      })
      .from(teamMembers)
      .leftJoin(users, eq(teamMembers.memberId, users.id))
      .where(eq(teamMembers.ownerId, ownerId));

    return members as Array<TeamMember & { memberEmail?: string; memberName?: string }>;
  }

  /**
   * Get pending invitations for a business owner
   */
  async getPendingInvitations(ownerId: string): Promise<TeamInvitation[]> {
    return await db
      .select()
      .from(teamInvitations)
      .where(
        and(
          eq(teamInvitations.ownerId, ownerId),
          eq(teamInvitations.status, 'pending')
        )
      );
  }

  /**
   * Update team member role
   */
  async updateMemberRole(
    teamMemberId: number,
    ownerId: string,
    newRole: 'admin' | 'member' | 'viewer'
  ): Promise<TeamMember> {
    const [member] = await db
      .select()
      .from(teamMembers)
      .where(
        and(
          eq(teamMembers.id, teamMemberId),
          eq(teamMembers.ownerId, ownerId)
        )
      )
      .limit(1);

    if (!member) {
      throw new Error('Team member not found');
    }

    const permissions = ROLE_PERMISSIONS[newRole];

    const [updated] = await db
      .update(teamMembers)
      .set({
        role: newRole,
        permissions,
        updatedAt: new Date(),
      })
      .where(eq(teamMembers.id, teamMemberId))
      .returning();

    return updated;
  }

  /**
   * Remove team member
   */
  async removeMember(teamMemberId: number, ownerId: string): Promise<void> {
    const [member] = await db
      .select()
      .from(teamMembers)
      .where(
        and(
          eq(teamMembers.id, teamMemberId),
          eq(teamMembers.ownerId, ownerId)
        )
      )
      .limit(1);

    if (!member) {
      throw new Error('Team member not found');
    }

    await db.delete(teamMembers).where(eq(teamMembers.id, teamMemberId));
  }

  /**
   * Get team member details (for checking if user is part of a team)
   */
  async getMemberDetails(userId: string): Promise<TeamMember | null> {
    const [member] = await db
      .select()
      .from(teamMembers)
      .where(
        and(
          eq(teamMembers.memberId, userId),
          eq(teamMembers.status, 'active')
        )
      )
      .limit(1);

    return member || null;
  }

  /**
   * Check if user has permission for an action
   */
  hasPermission(
    member: TeamMember | null,
    resource: string,
    action: string
  ): boolean {
    if (!member) return false;

    const permissions = member.permissions as Record<string, string[]>;
    if (!permissions || !permissions[resource]) return false;

    return permissions[resource].includes(action);
  }

  /**
   * Get the effective userId for data access
   * If user is a team member, return the owner's ID
   * If user is an owner, return their own ID
   */
  async getEffectiveUserId(userId: string): Promise<string> {
    const member = await this.getMemberDetails(userId);
    return member ? member.ownerId : userId;
  }

  /**
   * Send invitation email
   */
  private async sendInvitationEmail(
    invitation: TeamInvitation,
    owner: any,
    token: string
  ): Promise<boolean> {
    const appUrl = process.env.APP_BASE_URL || 'https://bluetradie.com';
    const inviteUrl = `${appUrl}/team/accept?token=${token}`;

    const subject = `You're invited to join ${owner.businessName || owner.email}'s team on Blue Tradie`;
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #ea580c; color: white; padding: 20px; text-align: center; border-radius: 8px; }
          .content { padding: 20px; background: #f9f9f9; margin-top: 20px; border-radius: 8px; }
          .button { display: inline-block; background: #ea580c; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; margin: 10px 0; }
          .role-badge { background: #f0f0f0; padding: 4px 12px; border-radius: 4px; display: inline-block; margin: 10px 0; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Team Invitation</h1>
            <p>You've been invited to join a team</p>
          </div>

          <div class="content">
            <p>G'day!</p>
            <p><strong>${owner.businessName || owner.email}</strong> has invited you to join their team on Blue Tradie.</p>

            <div class="role-badge">
              Role: <strong>${invitation.role}</strong>
            </div>

            <p>As a ${invitation.role}, you'll be able to:</p>
            <ul>
              ${this.getRoleDescription(invitation.role)}
            </ul>

            <div style="text-align: center; margin: 30px 0;">
              <a href="${inviteUrl}" class="button">Accept Invitation</a>
            </div>

            <p style="color: #666; font-size: 14px;">
              This invitation will expire in 7 days. If you don't want to join this team, you can simply ignore this email.
            </p>

            <p style="color: #666; font-size: 12px; margin-top: 20px;">
              If the button doesn't work, copy and paste this link:<br>
              ${inviteUrl}
            </p>
          </div>
        </div>
      </body>
      </html>
    `;

    return await emailService.sendEmail({
      to: invitation.email,
      subject,
      html,
    });
  }

  /**
   * Get role description for email
   */
  private getRoleDescription(role: string): string {
    const descriptions = {
      admin: `
        <li>View, create, and edit invoices and quotes</li>
        <li>Manage jobs and expenses</li>
        <li>Invite new team members</li>
        <li>View business reports</li>
      `,
      member: `
        <li>View and create invoices and quotes</li>
        <li>View, create, and edit jobs</li>
        <li>View and create expenses</li>
        <li>View team members</li>
      `,
      viewer: `
        <li>View invoices and quotes</li>
        <li>View jobs and expenses</li>
        <li>View business data (read-only access)</li>
      `,
    };

    return descriptions[role as keyof typeof descriptions] || descriptions.member;
  }
}

export const teamService = new TeamService();
