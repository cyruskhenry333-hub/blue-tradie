import type { Express } from "express";
import { db } from "../db";
import version from "../../version.json";

export function registerHealthRoutes(app: Express) {
  // Health check endpoint
  app.get('/health', async (req, res) => {
    try {
      // Test database connection
      let dbStatus = false;
      try {
        await db.execute(`SELECT 1 as test`);
        dbStatus = true;
      } catch (dbError) {
        console.error('[HEALTH] Database check failed:', dbError);
      }

      const health = {
        ok: true,
        version: version.build,
        commit: version.commit,
        buildDate: version.buildDate,
        environment: process.env.NODE_ENV || 'development',
        db: dbStatus,
        timestamp: new Date().toISOString(),
        uptime: Math.floor(process.uptime()),
        features: {
          subscriptions: process.env.FEATURE_SUBSCRIPTIONS === 'true',
          stripe: !!process.env.STRIPE_SECRET_KEY,
          sendgrid: !!process.env.SENDGRID_API_KEY,
          sentry: !!process.env.SENTRY_DSN
        }
      };

      // Return 503 if database is down
      if (!dbStatus) {
        return res.status(503).json({
          ...health,
          ok: false,
          error: 'Database connection failed'
        });
      }

      res.json(health);
    } catch (error) {
      console.error('[HEALTH] Health check error:', error);
      res.status(503).json({
        ok: false,
        version: version.build,
        error: 'Health check failed',
        timestamp: new Date().toISOString()
      });
    }
  });

  // Readiness probe for Kubernetes/container orchestration
  app.get('/ready', async (req, res) => {
    try {
      // More comprehensive readiness check
      await db.execute(`SELECT 1 as test`);
      res.json({ ready: true, timestamp: new Date().toISOString() });
    } catch (error) {
      res.status(503).json({ 
        ready: false, 
        error: 'Database not ready',
        timestamp: new Date().toISOString() 
      });
    }
  });

  // Liveness probe
  app.get('/alive', (req, res) => {
    res.json({ 
      alive: true, 
      uptime: Math.floor(process.uptime()),
      timestamp: new Date().toISOString() 
    });
  });
}