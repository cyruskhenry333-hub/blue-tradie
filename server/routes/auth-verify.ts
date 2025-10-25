import express from 'express';
import jwt from 'jsonwebtoken';
import { storage } from '../storage';

const router = express.Router();
const MAGIC_LINK_JWT_SECRET = process.env.MAGIC_LINK_JWT_SECRET || process.env.SESSION_SECRET || 'fallback-jwt-secret';

router.get('/auth/verify', async (req, res) => {
  try {
    const { token } = req.query;
    
    if (!token || typeof token !== 'string') {
      console.log('[VERIFY ERROR] Missing or invalid token');
      return res.redirect('/login?error=invalid_link');
    }
    
    // Verify JWT token
    let payload: any;
    try {
      payload = jwt.verify(token, MAGIC_LINK_JWT_SECRET);
    } catch (jwtError) {
      console.log('[VERIFY ERROR] JWT verification failed:', (jwtError as Error).message);
      return res.redirect('/login?error=expired_link');
    }
    
    const { userId, email, redirect } = payload;
    
    if (!userId || !email) {
      console.log('[VERIFY ERROR] Missing userId or email in token');
      return res.redirect('/login?error=invalid_link');
    }
    
    // Load user from database
    let user;
    try {
      user = await storage.getUser(userId);
    } catch (error) {
      console.log('[VERIFY ERROR] User not found:', userId);
      return res.redirect('/login?error=user_not_found');
    }
    
    if (!user || user.email !== email) {
      console.log('[VERIFY ERROR] User mismatch or not found');
      return res.redirect('/login?error=user_not_found');
    }
    
    // Set session data
    (req.session as any).userId = userId;
    (req.session as any).email = email;
    (req.session as any).passwordAuthenticated = true;
    
    // Force session save
    await new Promise<void>((resolve, reject) => {
      req.session.save((err) => {
        if (err) {
          console.error('[VERIFY ERROR] Session save failed:', err);
          reject(err);
        } else {
          resolve();
        }
      });
    });
    
    // Determine redirect target
    let redirectTarget;
    if (redirect && redirect.startsWith('/')) {
      redirectTarget = redirect;
    } else if (!user.isOnboarded) {
      redirectTarget = '/onboarding';
    } else {
      redirectTarget = '/dashboard';
    }
    
    console.log('[VERIFY OK]', { userId, email: user.email, redirect: redirectTarget });
    res.redirect(redirectTarget);
    
  } catch (error) {
    console.error('[VERIFY ERROR] Unexpected error:', error);
    res.redirect('/login?error=verification_failed');
  }
});

export default router;