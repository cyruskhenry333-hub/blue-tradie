import { Request, Response, NextFunction } from 'express';

interface DemoAuthenticatedRequest extends Request {
  session: any;
}

export function demoDashboardGuard(req: DemoAuthenticatedRequest, res: Response, next: NextFunction) {
  const isPreview = process.env.NODE_ENV !== 'production';
  
  // Only apply in preview environment
  if (!isPreview) {
    return next();
  }

  // Only guard /demo* routes
  if (!req.path.startsWith('/demo')) {
    return next();
  }

  // Check demo mode and proper org
  if (req.session?.mode !== 'demo' || req.session?.currentOrgId !== 'demo-org-default') {
    console.log(`[DEMO GUARD] ${req.path} access denied - mode: ${req.session?.mode}, orgId: ${req.session?.currentOrgId}`);
    
    return res.status(403).send(`
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Demo Access Required</title>
        <style>
          body { font-family: Arial, sans-serif; max-width: 600px; margin: 50px auto; text-align: center; padding: 20px; }
          h1 { color: #dc2626; }
          a { color: #3b82f6; text-decoration: underline; }
          .debug { background: #f8f9fa; padding: 20px; margin: 20px 0; text-align: left; border-radius: 8px; }
        </style>
      </head>
      <body>
        <h1>🚫 Demo Access Required</h1>
        <p>You must be authenticated in demo mode to access demo features.</p>
        <div class="debug">
          <strong>Session Debug:</strong><br>
          Mode: ${req.session?.mode || 'none'}<br>
          Org ID: ${req.session?.currentOrgId || 'none'}<br>
          Expected: mode='demo', orgId='demo-org-default'
        </div>
        <a href="/login">Go to Login</a> | 
        <a href="/debug/session">Debug Session</a>
      </body>
      </html>
    `);
  }

  console.log(`[DEMO GUARD] ${req.path} access granted for user ${req.session.testUser?.id}`);
  next();
}