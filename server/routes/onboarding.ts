import { Router, type Request, type Response } from "express";
import { requireAuth } from "../middleware/require-auth";
import { storage } from "../storage";
import { isCountryAllowed } from "../../shared/market-config";

const APP_HOME_PATH = "/";

export const onboardingRouter = Router();

onboardingRouter.post("/api/user/onboarding", requireAuth, async (req: Request, res: Response) => {
  const sess: any = (req as any).session;
  const userId = sess?.userId;
  if (!userId) return res.status(401).json({ message: "Unauthorized" });

  try {
    const onboardingData = req.body;
    const currentOrgId = sess?.currentOrgId || 'demo-org-default';
    
    console.log(`[ONBOARDING] User ${userId} completing onboarding for org ${currentOrgId}`);
    
    // Update per-org onboarding status in organizationUsers table
    const { db } = await import('../db');
    const { organizationUsers, organizations } = await import('../../shared/schema');
    const { and, eq } = await import('drizzle-orm');
    
    // Ensure organization exists
    await db.insert(organizations).values({
      id: currentOrgId,
      name: currentOrgId.includes('demo') ? 'Demo Organization' : 'Default Organization',
      type: currentOrgId.includes('demo') ? 'demo' : 'trial',
      isDemo: currentOrgId.includes('demo'),
    }).onConflictDoNothing();
    
    // Update org-user relationship with onboarding completion
    await db.insert(organizationUsers).values({
      userId,
      organizationId: currentOrgId,
      role: 'owner',
      isOnboarded: true,
      onboardedAt: new Date(),
    }).onConflictDoNothing();

    const { businessName, trade, serviceArea, country, isGstRegistered } = onboardingData;

    // Market lock enforcement - reject countries not allowed in this environment
    if (!isCountryAllowed(country)) {
      console.log(`[ONBOARDING] Blocked country: ${country}`);
      return res.status(400).json({
        message: "Australia is not supported yet. New Zealand only.",
        field: "country"
      });
    }

    // Update user in database (works for both demo and regular users)
    await storage.updateUserOnboarding(userId, {
      businessName,
      trade,
      serviceArea,
      country,
      isGstRegistered: isGstRegistered || false,
      isOnboarded: true // Legacy field for backward compatibility
    });

    // CRITICAL: Update session isOnboarded flag
    sess.isOnboarded = true;

    // Persist session then respond with redirect
    sess.save((err: unknown) => {
      if (err) {
        console.error("[ONBOARDING] session.save error:", err);
        return res.status(200).json({ ok: true, redirect: APP_HOME_PATH });
      }
      console.log("[ONBOARDING] Saved session for", userId, "org:", currentOrgId);
      return res.status(200).json({
        ok: true,
        redirect: APP_HOME_PATH,
        userId,
        organizationId: currentOrgId,
        organizationOnboarded: true
      });
    });
  } catch (e) {
    console.error("[ONBOARDING] Error:", e);
    return res.status(500).json({ message: "Failed to complete onboarding" });
  }
});