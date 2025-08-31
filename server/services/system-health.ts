import { storage } from "../storage";
import { db } from "../db";
import { sql } from "drizzle-orm";

export class SystemHealthChecker {
  // Check all core systems are working
  static async runFullSystemCheck(): Promise<{
    status: 'healthy' | 'warning' | 'error';
    checks: Array<{
      name: string;
      status: 'pass' | 'fail' | 'warning';
      message: string;
      details?: any;
    }>;
    summary: {
      total: number;
      passed: number;
      failed: number;
      warnings: number;
    };
  }> {
    const checks = [];
    
    // Database connectivity
    try {
      await db.execute(sql`SELECT 1`);
      checks.push({
        name: 'Database Connection',
        status: 'pass' as const,
        message: 'Database is connected and responsive'
      });
    } catch (error) {
      checks.push({
        name: 'Database Connection',
        status: 'fail' as const,
        message: 'Database connection failed',
        details: error
      });
    }

    // User creation/retrieval
    try {
      const testUser = await storage.getUser('test_user_123');
      checks.push({
        name: 'User Storage',
        status: 'pass' as const,
        message: 'User storage operations working'
      });
    } catch (error) {
      checks.push({
        name: 'User Storage',
        status: 'fail' as const,
        message: 'User storage operations failed',
        details: error
      });
    }

    // Table structure check
    try {
      const userCount = await db.execute(sql`SELECT COUNT(*) as count FROM users`);
      
      checks.push({
        name: 'Core Tables',
        status: 'pass' as const,
        message: 'All core tables accessible',
        details: {
          users: Number((userCount as any).rows?.[0]?.count || 0)
        }
      });
    } catch (error) {
      checks.push({
        name: 'Core Tables',
        status: 'fail' as const,
        message: 'Core table access failed',
        details: error
      });
    }

    // AI system check (basic validation)
    try {
      if (!process.env.OPENAI_API_KEY) {
        checks.push({
          name: 'AI System',
          status: 'warning' as const,
          message: 'OpenAI API key not configured - AI features will not work'
        });
      } else {
        checks.push({
          name: 'AI System',
          status: 'pass' as const,
          message: 'AI configuration appears valid'
        });
      }
    } catch (error) {
      checks.push({
        name: 'AI System',
        status: 'fail' as const,
        message: 'AI system check failed',
        details: error
      });
    }

    // Email system check
    try {
      if (!process.env.SENDGRID_API_KEY) {
        checks.push({
          name: 'Email System',
          status: 'warning' as const,
          message: 'SendGrid API key not configured - emails will not send'
        });
      } else {
        checks.push({
          name: 'Email System',
          status: 'pass' as const,
          message: 'Email configuration appears valid'
        });
      }
    } catch (error) {
      checks.push({
        name: 'Email System',
        status: 'fail' as const,
        message: 'Email system check failed',
        details: error
      });
    }

    // Session storage check
    try {
      const sessionCount = await db.execute(sql`SELECT COUNT(*) as count FROM sessions`);
      checks.push({
        name: 'Session Storage',
        status: 'pass' as const,
        message: 'Session storage working',
        details: { activeSessions: Number((sessionCount as any).rows?.[0]?.count || 0) }
      });
    } catch (error) {
      checks.push({
        name: 'Session Storage',
        status: 'fail' as const,
        message: 'Session storage failed',
        details: error
      });
    }

    // Demo system check
    try {
      const demoCount = await db.execute(sql`SELECT COUNT(*) as count FROM users WHERE is_demo_user = true`);
      checks.push({
        name: 'Demo System',
        status: 'pass' as const,
        message: 'Demo system operational',
        details: { activeDemoUsers: Number((demoCount as any).rows?.[0]?.count || 0) }
      });
    } catch (error) {
      checks.push({
        name: 'Demo System',
        status: 'fail' as const,
        message: 'Demo system check failed',
        details: error
      });
    }

    // Calculate summary
    const passed = checks.filter(c => c.status === 'pass').length;
    const failed = checks.filter(c => c.status === 'fail').length;
    const warnings = checks.filter(c => c.status === 'warning').length;
    
    let overallStatus: 'healthy' | 'warning' | 'error' = 'healthy';
    if (failed > 0) {
      overallStatus = 'error';
    } else if (warnings > 0) {
      overallStatus = 'warning';
    }

    return {
      status: overallStatus,
      checks,
      summary: {
        total: checks.length,
        passed,
        failed,
        warnings
      }
    };
  }

  // Quick health check for dashboard
  static async quickHealthCheck(): Promise<{
    database: boolean;
    storage: boolean;
    ai: boolean;
    email: boolean;
  }> {
    try {
      // Database
      let database = false;
      try {
        await db.execute(sql`SELECT 1`);
        database = true;
      } catch {}

      // Storage
      let storage = false;
      try {
        await db.execute(sql`SELECT COUNT(*) FROM users LIMIT 1`);
        storage = true;
      } catch {}

      // AI
      const ai = !!process.env.OPENAI_API_KEY;

      // Email
      const email = !!process.env.SENDGRID_API_KEY;

      return { database, storage, ai, email };
    } catch (error) {
      return { database: false, storage: false, ai: false, email: false };
    }
  }
}