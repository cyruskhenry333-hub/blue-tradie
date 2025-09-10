import type { Express } from "express";
import { z } from "zod";
import { storage } from "../storage";
import { SendGridEmailService } from "../services/sendgrid-email-service";
import { db } from "../db";
import { users } from "@shared/schema";
import { eq } from "drizzle-orm";

const demoRequestSchema = z.object({
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  email: z.string().email(),
  country: z.string(),
  trade: z.string()
});

const demoLoginSchema = z.object({
  demoCode: z.string().min(1)
});

const resendSchema = z.object({
  email: z.string().email()
});

export function registerDemoRoutes(app: Express) {
  // Request demo code
  app.post('/api/demo/request-code', async (req, res) => {
    try {
      const data = demoRequestSchema.parse(req.body);
      
      // Generate unique demo code
      const demoCodeNumber = Math.floor(Math.random() * 10000) + 1000;
      const demoCode = `Demo${demoCodeNumber}`;
      
      // Create or update demo user
      const userId = `demo-${data.email.replace(/[@.]/g, '-')}`;
      const user = await storage.upsertUser({
        id: userId,
        email: data.email,
        firstName: data.firstName,
        lastName: data.lastName,
        country: data.country,
        trade: data.trade,
        isDemoUser: true,
        demoTokenLimit: 1000000, // 1 million tokens for demo
        isOnboarded: false,
        metadata: { demoCode },
        profileImageUrl: null,
        businessName: null
      });

      // Send demo code email
      const emailContent = {
        subject: "Your Blue Tradie demo code",
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #1e40af;">Welcome to Blue Tradie!</h2>
            <p>Hi ${data.firstName},</p>
            <p>Thanks for your interest in Blue Tradie. Here's your demo access code:</p>
            <div style="background: #f3f4f6; padding: 20px; text-align: center; margin: 20px 0; border-radius: 8px;">
              <h3 style="margin: 0; font-size: 24px; color: #1e40af; font-family: monospace;">${demoCode}</h3>
            </div>
            <p><a href="${process.env.APP_BASE_URL || 'http://localhost:5000'}/demo?code=${demoCode}" 
                  style="background: #1e40af; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
              Access Demo Now
            </a></p>
            <p>This demo gives you full access to explore Blue Tradie's features including:</p>
            <ul>
              <li>AI-powered business advice</li>
              <li>Job management</li>
              <li>Invoice generation</li>
              <li>Expense tracking</li>
              <li>Business intelligence dashboard</li>
            </ul>
            <p>Questions? Reply to this email and we'll help you get started.</p>
            <p>Cheers,<br>The Blue Tradie Team</p>
          </div>
        `,
        text: `Welcome to Blue Tradie!\n\nHi ${data.firstName},\n\nThanks for your interest in Blue Tradie. Here's your demo access code: ${demoCode}\n\nAccess your demo at: ${process.env.APP_BASE_URL || 'http://localhost:5000'}/demo?code=${demoCode}\n\nCheers,\nThe Blue Tradie Team`
      };

      const emailService = new SendGridEmailService();
      await emailService.sendEmail({
        to: data.email,
        subject: emailContent.subject,
        html: emailContent.html
      });

      res.json({ 
        success: true, 
        message: "Demo code sent to your email",
        demoCode // Include for immediate use if needed
      });
    } catch (error) {
      console.error('Demo request error:', error);
      res.status(400).json({ 
        success: false, 
        message: error instanceof z.ZodError ? "Invalid form data" : "Unable to process request" 
      });
    }
  });

  // Demo login
  app.post('/api/demo/login', async (req: any, res) => {
    console.log('[DEMO LOGIN] Starting demo login process');
    
    try {
      const { demoCode } = demoLoginSchema.parse(req.body);
      console.log('[DEMO LOGIN] Demo code submitted:', demoCode);
      
      // Find user by demo code in metadata
      let user = null;
      try {
        // First, get all demo users
        const allUsers = await db.select().from(users).where(eq(users.isDemoUser, true));
        console.log('[DEMO LOGIN] Found demo users count:', allUsers.length);
        
        // Find user with matching demo code in metadata
        user = allUsers.find(u => 
          u.metadata && 
          typeof u.metadata === 'object' &&
          (u.metadata as any).demoCode === demoCode
        );
        
        if (!user) {
          console.log('[DEMO LOGIN] Demo code not found in database');
          return res.status(401).json({ 
            success: false, 
            message: "Invalid demo code. Please check your email for the correct code." 
          });
        }
        
        console.log('[DEMO LOGIN] Demo user found:', user.id, 'isOnboarded:', user.isOnboarded);
      } catch (error) {
        console.error('[DEMO LOGIN] Database error:', error);
        return res.status(500).json({ 
          success: false, 
          message: "Database error during login" 
        });
      }

      // Set demo session with explicit cookie configuration
      req.session.isTestAuthenticated = true;
      req.session.testUser = {
        id: user.id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        country: user.country,
        trade: user.trade,
        businessName: user.businessName || `${user.firstName}'s ${user.trade} Services`,
        profileImageUrl: user.profileImageUrl,
        isOnboarded: user.isOnboarded || false,
        isDemoUser: true
      };

      console.log('[DEMO LOGIN] Session set, saving session...');
      console.log('[DEMO LOGIN] Session ID:', req.session.id);
      
      // CRITICAL: Save session before response
      req.session.save((err: any) => {
        if (err) {
          console.error('[DEMO LOGIN] Session save error:', err);
          return res.status(500).json({ 
            success: false, 
            message: "Session save failed" 
          });
        }
        
        console.log('[DEMO LOGIN] Session saved successfully');
        console.log('[DEMO LOGIN] Set-Cookie header will be sent');

        const responseData = { 
          success: true, 
          message: "Demo login successful",
          user: {
            id: user.id,
            firstName: user.firstName,
            lastName: user.lastName,
            email: user.email,
            isOnboarded: user.isOnboarded || false
          }
        };
        
        console.log('[DEMO LOGIN] Sending response:', responseData);
        res.json(responseData);
      });
    } catch (error) {
      console.error('Demo login error:', error);
      res.status(400).json({
        success: false,
        message: "Login failed. Please try again."
      });
    }
  });

  // Resend demo code
  app.post('/api/demo/resend', async (req, res) => {
    try {
      const { email } = resendSchema.parse(req.body);
      
      // Find demo user by email pattern
      const userId = `demo-${email.replace(/[@.]/g, '-')}`;
      const user = await storage.getUser(userId);

      if (!user || !user.isDemoUser || !user.metadata || !(user.metadata as any).demoCode) {
        return res.status(400).json({
          success: false,
          message: "No demo code found for this email address."
        });
      }

      const demoCode = (user.metadata as any).demoCode;

      // Resend email
      const emailContent = {
        subject: "Your Blue Tradie demo code (resent)",
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #1e40af;">Your Blue Tradie Demo Code</h2>
            <p>Hi ${user.firstName},</p>
            <p>Here's your demo access code again:</p>
            <div style="background: #f3f4f6; padding: 20px; text-align: center; margin: 20px 0; border-radius: 8px;">
              <h3 style="margin: 0; font-size: 24px; color: #1e40af; font-family: monospace;">${demoCode}</h3>
            </div>
            <p><a href="${process.env.APP_BASE_URL || 'http://localhost:5000'}/demo?code=${demoCode}" 
                  style="background: #1e40af; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
              Access Demo Now
            </a></p>
            <p>Cheers,<br>The Blue Tradie Team</p>
          </div>
        `,
        text: `Your Blue Tradie Demo Code\n\nHi ${user.firstName},\n\nHere's your demo access code: ${demoCode}\n\nAccess your demo at: ${process.env.APP_BASE_URL || 'http://localhost:5000'}/demo?code=${demoCode}\n\nCheers,\nThe Blue Tradie Team`
      };

      const emailService = new SendGridEmailService();
      await emailService.sendEmail({
        to: email,
        subject: emailContent.subject,
        html: emailContent.html
      });

      res.json({
        success: true,
        message: "Demo code resent to your email"
      });
    } catch (error) {
      console.error('Demo resend error:', error);
      res.status(400).json({
        success: false,
        message: "Unable to resend email. Please try again."
      });
    }
  });

  // Demo dashboard data endpoint
  app.get('/api/demo/dashboard', (req, res) => {
    // Return sample dashboard data for demo
    res.json({
      success: true,
      data: {
        user: {
          id: 'demo-user',
          firstName: 'Demo',
          lastName: 'User',
          businessName: 'Demo Electrical Services',
          totalEarnings: 24500,
          jobsThisMonth: 8,
          unpaidInvoices: 3200,
          completedJobs: 15
        },
        recentJobs: [
          { id: '1', description: 'Kitchen rewiring', status: 'completed', amount: 1200 },
          { id: '2', description: 'Outlet installation', status: 'in-progress', amount: 350 },
          { id: '3', description: 'Safety inspection', status: 'scheduled', amount: 180 }
        ]
      }
    });
  });
}