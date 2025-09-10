import type { Express, RequestHandler } from "express";
import session from "express-session";
import MemoryStore from "memorystore";
import { storage } from "./storage";

// Simple development authentication for beta testing
export function setupSimpleAuth(app: Express) {
  
  // Setup session middleware with persistent memory store
  const MemoryStoreSession = MemoryStore(session);
  app.use(session({
    secret: process.env.SESSION_SECRET || 'beta-testing-secret',
    resave: false,
    saveUninitialized: false,
    store: new MemoryStoreSession({
      checkPeriod: 86400000 // prune expired entries every 24h
    }),
    cookie: { secure: false, maxAge: 7 * 24 * 60 * 60 * 1000 } // 7 days
  }));
  
  // Demo login endpoint - validates demo codes
  app.post('/api/demo-login', async (req, res) => {
    try {
      const { demoCode, firstName, lastName, email } = req.body;
      
      if (!demoCode || !firstName || !lastName || !email) {
        return res.status(400).json({ message: "All fields required" });
      }

      // Validate demo code format (demo + registration number)
      if (!demoCode.toLowerCase().startsWith('demo')) {
        return res.status(400).json({ message: "Invalid demo code format" });
      }

      // Extract registration number from demo code
      const registrationNumber = demoCode.toLowerCase().replace('demo', '');
      if (!registrationNumber || registrationNumber.length < 1) {
        return res.status(400).json({ message: "Demo code must include a registration number" });
      }

      // Check if user already exists with this email
      let existingUser;
      try {
        existingUser = await storage.getUser(`demo-${email.replace('@', '-').replace(/\./g, '-')}`);
      } catch (error) {
        // User doesn't exist, proceed with creation
      }

      // Create user ID based on email for consistency
      const userId = `demo-${email.replace('@', '-').replace(/\./g, '-')}`;
      
      // Check existing user's onboarding status before upsert
      let existingOnboardedStatus = false;
      try {
        const existingUser = await storage.getUser(userId);
        existingOnboardedStatus = existingUser?.isOnboarded || false;
        console.log(`[DEMO LOGIN] Found existing user ${userId} with isOnboarded=${existingOnboardedStatus}`);
      } catch (error) {
        console.log(`[DEMO LOGIN] No existing user found for ${userId}, creating new`);
      }

      // Create or update demo user with provided details
      // CRITICAL FIX: Only set basic fields on upsert to avoid overwriting onboarding status
      const user = await storage.upsertUser({
        id: userId,
        email: email,
        firstName: firstName,
        lastName: lastName,
        profileImageUrl: `https://api.dicebear.com/7.x/avataaars/svg?seed=${firstName}`,
        country: "Australia", // Default for demos
        isDemoUser: true,
        subscriptionTier: 'Demo Access',
        // For new users only - existing users keep their onboarding status
        ...(existingOnboardedStatus === false ? { isOnboarded: false } : {}),
        hasLifetimeBetaAccess: true,
        // Demo users get 1 million tokens
        demoTokenLimit: 1000000,
        demoTokensUsed: 0
      });

      // Set comprehensive demo session - acts as full authenticated state
      (req as any).session.testUser = {
        id: userId,
        firstName: firstName,
        lastName: lastName,
        email: email,
        demoCode: demoCode,
        isDemoUser: true,
        hasFullAccess: true, // Demo users get unrestricted platform access
        isOnboarded: existingOnboardedStatus // CRITICAL FIX: Use database value, not hardcoded false
      };
      (req as any).session.isTestAuthenticated = true;
      (req as any).session.userId = userId; // Backup session identifier for compatibility
      
      // CRITICAL: Force session save to ensure persistence
      await new Promise((resolve, reject) => {
        (req as any).session.save((err: any) => {
          if (err) {
            console.error('[DEMO LOGIN] Session save error:', err);
            reject(err);
          } else {
            console.log(`[DEMO LOGIN] Session saved successfully for ${userId}`);
            resolve(undefined);
          }
        });
      });
      
      console.log(`[DEMO LOGIN] User ${firstName} ${lastName} accessed with code: ${demoCode}`);
      res.json({ success: true, user: { id: userId, firstName, lastName, email } });
    } catch (error) {
      console.error("Demo login error:", error);
      res.status(500).json({ message: "Demo access failed" });
    }
  });

  // Simple login endpoint for development/beta testing
  app.post('/api/simple-login', async (req, res) => {
    try {
      const { email, firstName = "Beta", lastName = "User" } = req.body;
      
      if (!email) {
        return res.status(400).json({ message: "Email required" });
      }

      // Create user ID and use upsertUser
      const userId = `beta-${email.replace('@', '-').replace(/\./g, '-')}`;
      
      // Use upsertUser which handles create or update
      const user = await storage.upsertUser({
        id: userId,
        email: email,
        firstName: firstName,
        lastName: lastName,
        profileImageUrl: null,
        country: "Australia", // Default for beta
        isBetaUser: true,
        hasLifetimeBetaAccess: true, // Grant lifetime access to beta users
      });

      // Set session with user ID
      (req as any).session.userId = userId;
      
      res.json({ success: true, user: { id: userId, email, firstName, lastName } });
    } catch (error) {
      console.error("Simple login error:", error);
      res.status(500).json({ message: "Login failed" });
    }
  });

  // Logout
  app.post('/api/simple-logout', (req, res) => {
    (req as any).session.destroy();
    res.json({ success: true });
  });
}

// Simple auth middleware for development (supports both regular users and demo users)
export const isSimpleAuthenticated: RequestHandler = async (req, res, next) => {
  const session = req.session as any;
  
  // Check for demo/test user session first
  if (session?.isTestAuthenticated && session?.testUser) {
    const userId = session.testUser.id;
    
    // Auto-create database record for demo user if it doesn't exist
    try {
      const { storage } = await import('./storage');
      await storage.createOrUpdateDemoUser(userId);
      console.log(`[SIMPLE AUTH] Demo user DB record ensured: ${userId}`);
    } catch (error) {
      console.error(`[SIMPLE AUTH] Error ensuring demo user record:`, error);
    }
    
    // Mock the user structure expected by routes for demo users
    (req as any).user = {
      claims: {
        sub: userId,
        email: session.testUser.email,
        first_name: session.testUser.firstName,
        last_name: session.testUser.lastName
      }
    };
    console.log(`[SIMPLE AUTH] Demo user authenticated: ${userId}`);
    return next();
  }
  
  // Fall back to regular session-based auth
  const userId = session?.userId;
  
  if (!userId) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  try {
    const user = await storage.getUser(userId);
    if (!user) {
      return res.status(401).json({ message: "User not found" });
    }
    
    // Mock the user structure expected by routes
    (req as any).user = {
      claims: {
        sub: userId,
        email: user.email,
        first_name: user.firstName,
        last_name: user.lastName
      }
    };
    
    next();
  } catch (error) {
    console.error("Auth check error:", error);
    res.status(401).json({ message: "Unauthorized" });
  }
};