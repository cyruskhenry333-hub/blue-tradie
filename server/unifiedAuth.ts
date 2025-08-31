import type { RequestHandler } from "express";
import { isAuthenticated } from "./replitAuth";

// Unified authentication middleware that handles both demo/test users and Replit Auth users
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
  
  // Fall back to regular Replit Auth for production users
  return isAuthenticated(req, res, next);
};