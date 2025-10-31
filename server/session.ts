import express from 'express';
import session from 'express-session';
import MemoryStore from 'memorystore';

const SESSION_SECRET = process.env.SESSION_SECRET || 'production-session-secret-replace-me';
const SESSION_COOKIE_NAME = 'bt_sess';
const SESSION_DOMAIN = '.bluetradie.com';

export function mountSession(app: express.Express) {
  console.log('[AUTH CONFIG]', {
    cookieName: SESSION_COOKIE_NAME,
    domain: SESSION_DOMAIN,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production'
  });

  // Trust proxy for secure cookies behind proxy
  app.set('trust proxy', 1);
  
  // Setup session middleware with persistent memory store
  const MemoryStoreSession = MemoryStore(session);
  app.use(session({
    name: SESSION_COOKIE_NAME,
    secret: SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    store: new MemoryStoreSession({
      checkPeriod: 86400000 // prune expired entries every 24h
    }),
    cookie: {
      secure: process.env.NODE_ENV === 'production',
      httpOnly: true,
      sameSite: 'lax',
      domain: process.env.NODE_ENV === 'production' ? SESSION_DOMAIN : undefined,
      maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
    }
  }));
}