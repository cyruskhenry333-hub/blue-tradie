import { Request, Response, NextFunction } from 'express';
import { storage } from '../storage';

interface AuthenticatedRequest extends Request {
  session: any;
  user?: any;
}

export function onboardingGateMiddleware(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  // Skip onboarding gate for specific routes
  if (req.path.startsWith('/api/') || 
      req.path.startsWith('/health') ||
      req.path.startsWith('/assets/') ||
      req.path.startsWith('/_vite/') ||
      req.path.startsWith('/onboarding') ||
      req.path.startsWith('/auth/') ||
      req.path.startsWith('/password-gate') ||
      req.path.startsWith('/verify-demo') ||
      req.path.startsWith('/debug/') ||
      req.path.startsWith('/login') ||
      req.path.endsWith('.js') ||
      req.path.endsWith('.css') ||
      req.path.endsWith('.png') ||
      req.path.endsWith('.jpg') ||
      req.path.endsWith('.ico')) {
    return next();
  }

  // Skip if not authenticated
  if (!req.session?.isTestAuthenticated && !req.user) {
    return next();
  }

  // Check PER-ORG onboarding status
  const checkOnboardingStatus = async () => {
    try {
      // For session-based demo users - check current org onboarding
      if (req.session?.testUser) {
        const currentOrgId = req.session.currentOrgId || 'demo-org-default';
        
        // Check if this user has completed onboarding for the current org
        const { db } = await import('../db');
        const { organizationUsers } = await import('../../shared/schema');
        const { and, eq } = await import('drizzle-orm');
        
        const orgUser = await db
          .select()
          .from(organizationUsers)
          .where(and(
            eq(organizationUsers.userId, req.session.testUser.id),
            eq(organizationUsers.organizationId, currentOrgId)
          ))
          .limit(1);

        const isOnboardedForCurrentOrg = orgUser.length > 0 ? orgUser[0].isOnboarded : false;
        
        if (!isOnboardedForCurrentOrg) {
          console.log(`[ONBOARDING GATE] Demo user ${req.session.testUser.id} not onboarded for org ${currentOrgId}, redirecting to /onboarding`);
          return res.redirect('/onboarding');
        }
        return next();
      }

      // For database users - check current org onboarding
      if (req.user?.claims?.sub) {
        const currentOrgId = req.session?.currentOrgId || 'default-org';
        
        const { db } = await import('../db');
        const { organizationUsers } = await import('../../shared/schema');
        const { and, eq } = await import('drizzle-orm');
        
        const orgUser = await db
          .select()
          .from(organizationUsers)
          .where(and(
            eq(organizationUsers.userId, req.user.claims.sub),
            eq(organizationUsers.organizationId, currentOrgId)
          ))
          .limit(1);

        const isOnboardedForCurrentOrg = orgUser.length > 0 ? orgUser[0].isOnboarded : false;
        
        if (!isOnboardedForCurrentOrg) {
          console.log(`[ONBOARDING GATE] User ${req.user.claims.sub} not onboarded for org ${currentOrgId}, redirecting to /onboarding`);
          return res.redirect('/onboarding');
        }
      }

      next();
    } catch (error) {
      console.error('[ONBOARDING GATE] Error checking onboarding status:', error);
      next(); // Allow through on error to prevent infinite loops
    }
  };

  checkOnboardingStatus();
}