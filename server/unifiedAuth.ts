import type { RequestHandler } from "express";
import { authService } from "./services/auth-service";

// Unified authentication middleware that handles demo users and magic-link authentication
export const unifiedAuth: RequestHandler = async (req, res, next) => {
  // Check if this is a demo/test user session first
  const session = req.session as any;
  
  if (session?.isTestAuthenticated && session?.testUser) {
    // Comprehensive user structure for demo users - full platform access
    (req as any).user = {
      claims: {
        sub: session.testUser.id,
        email: session.testUser.email,
        first_name: session.testUser.firstName,
        last_name: session.testUser.lastName,
        // Demo users get elevated permissions for seamless experience
        roles: ['demo_user', 'authenticated'],
        permissions: ['full_platform_access']
      },
      // Mark as demo for special handling if needed
      isDemoUser: true,
      hasFullAccess: session.testUser.hasFullAccess || true
    };
    console.log(`[UNIFIED AUTH] Demo user authenticated with full access: ${session.testUser.id}`);
    return next();
  }
  
  // Check for magic-link authentication
  try {
    const cookieName = authService.getSessionCookieName();
    const sessionId = req.cookies[cookieName];
    
    if (sessionId) {
      const authSession = await authService.getValidSession(sessionId);
      if (authSession) {
        // Set user context for magic-link authenticated users
        (req as any).user = {
          claims: {
            sub: authSession.userId,
            // Note: We'd need to fetch user details from DB if needed
          },
          isAuthenticatedUser: true,
          sessionId: authSession.id
        };
        console.log(`[UNIFIED AUTH] Magic-link user authenticated: ${authSession.userId}`);
        return next();
      }
    }
  } catch (error) {
    console.error('[UNIFIED AUTH] Magic-link auth check failed:', error);
  }
  
  // No valid authentication found
  return res.status(401).json({ message: "Unauthorized" });
};