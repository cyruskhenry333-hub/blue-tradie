import express from 'express';

const router = express.Router();

// Environment check
const isPreview = process.env.NODE_ENV !== 'production';
const PREVIEW_DISABLE_MAGIC_LINKS = process.env.PREVIEW_DISABLE_MAGIC_LINKS === 'true';

// Simple demo codes for preview testing
const VALID_DEMO_CODES = [
  'DEMO2024',
  'PREVIEW123', 
  'TEST456',
  'CY789',
  `test-demo-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}`
];

// POST /auth/demo/verify - Code-entry only verification
router.post('/auth/demo/verify', async (req, res) => {
  if (!isPreview || !PREVIEW_DISABLE_MAGIC_LINKS) {
    return res.status(403).json({ error: 'Code verification only available in preview mode' });
  }

  try {
    const { code } = req.body;
    
    if (!code || typeof code !== 'string') {
      return res.status(400).json({ error: 'Demo code required' });
    }

    // Validate demo code
    if (!VALID_DEMO_CODES.includes(code.trim())) {
      console.log(`[PREVIEW DEMO] Invalid code attempted: ${code}`);
      return res.status(401).json({ error: 'Invalid demo code' });
    }

    // Generate unique demo user for this session
    const userId = `demo-user-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`;
    const orgId = 'demo-org-default';
    
    // Create demo user session
    req.session.testUser = {
      id: userId,
      firstName: 'Demo',
      lastName: 'User',
      email: 'demo@bluetradie.com',
      country: 'Australia',
      trade: 'Electrician',
      businessName: 'Demo Electrical Services',
      profileImageUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=demo',
      tokenBalance: 200,
      subscriptionTier: 'Demo Access',
      isOnboarded: false, // Force onboarding
      serviceArea: 'Sydney',
      isGstRegistered: true
    };
    
    req.session.isTestAuthenticated = true;
    req.session.currentOrgId = orgId;
    req.session.mode = 'demo'; // Critical for demo dashboard guard
    
    // Set host-only cookie (preview only)
    req.session.cookie.secure = false; // Preview HTTP
    req.session.cookie.httpOnly = true;
    req.session.cookie.sameSite = 'lax';
    // NO Domain attribute = host-only cookie
    
    // Ensure demo org exists in database
    const { db } = await import('../db');
    const { organizations, organizationUsers } = await import('../../shared/schema');
    
    await db.insert(organizations).values({
      id: orgId,
      name: 'Demo Organization',
      type: 'demo',
      isDemo: true,
    }).onConflictDoNothing();
    
    // Create org-user relationship (NOT ONBOARDED)
    await db.insert(organizationUsers).values({
      userId,
      organizationId: orgId,
      role: 'owner',
      isOnboarded: false, // Force onboarding flow
    }).onConflictDoNothing();
    
    console.log(`[PREVIEW DEMO] Code ${code} verified, user ${userId} created in org ${orgId}`);
    console.log(`[PREVIEW DEMO] Session mode: ${req.session.mode}, orgId: ${req.session.currentOrgId}`);
    
    res.json({ 
      success: true,
      userId,
      orgId,
      mode: 'demo',
      redirectTo: '/onboarding'
    });

  } catch (error) {
    console.error('[PREVIEW DEMO] Code verification error:', error);
    res.status(500).json({ error: 'Demo verification failed' });
  }
});

// GET /debug/session - Preview debugging only
router.get('/debug/session', (req, res) => {
  if (!isPreview) {
    return res.status(403).json({ error: 'Debug endpoint only available in preview' });
  }

  const sessionData = {
    isTestAuthenticated: req.session?.isTestAuthenticated || false,
    testUser: req.session?.testUser || null,
    currentOrgId: req.session?.currentOrgId || null,
    mode: req.session?.mode || null,
    sessionId: req.session?.id || null,
    cookie: {
      secure: req.session?.cookie?.secure,
      httpOnly: req.session?.cookie?.httpOnly,
      sameSite: req.session?.cookie?.sameSite,
      domain: req.session?.cookie?.domain || 'host-only'
    },
    environment: process.env.NODE_ENV,
    previewDisableMagicLinks: PREVIEW_DISABLE_MAGIC_LINKS
  };

  console.log('[DEBUG SESSION]', JSON.stringify(sessionData, null, 2));
  res.json(sessionData);
});

export default router;