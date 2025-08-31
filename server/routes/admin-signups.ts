import { Router } from 'express';
import { db } from '../db';
import { users, waitlist } from '@shared/schema';
import { desc, eq, or } from 'drizzle-orm';

// Simple admin authentication middleware
function requireAuth(req: any, res: any, next: any) {
  const authHeader = req.headers.authorization;
  const validToken = process.env.ADMIN_TOKEN || 'bluetradie-admin-2025';
  
  if (authHeader === `Bearer ${validToken}` || req.headers['x-admin-key'] === validToken) {
    return next();
  }
  
  // Check for basic auth
  if (authHeader && authHeader.startsWith('Basic ')) {
    const base64Credentials = authHeader.split(' ')[1];
    const credentials = Buffer.from(base64Credentials, 'base64').toString('ascii');
    const [username, password] = credentials.split(':');
    
    if (username === 'admin' && password === (process.env.ADMIN_PASSWORD || 'bluetradie2025')) {
      return next();
    }
  }
  
  res.status(401).set('WWW-Authenticate', 'Basic realm="Admin Panel"').json({
    message: 'Admin authentication required'
  });
}

const router = Router();

/**
 * Admin Signup Monitoring Dashboard
 * GET /admin/signups
 */
router.get('/signups', requireAuth, async (req, res) => {
  try {
    // Get all demo users and waitlist users
    const [demoUsers, waitlistUsers] = await Promise.all([
      // Demo users from users table
      db.select({
        id: users.id,
        firstName: users.firstName,
        lastName: users.lastName,
        email: users.email,
        country: users.country,
        trade: users.trade,
        isOnboarded: users.isOnboarded,
        isDemoUser: users.isDemoUser,
        createdAt: users.createdAt,
        businessName: users.businessName,
        subscriptionTier: users.subscriptionTier
      })
      .from(users)
      .where(eq(users.isDemoUser, true))
      .orderBy(desc(users.createdAt)),
      
      // VIP waitlist users
      db.select({
        id: waitlist.id,
        firstName: waitlist.firstName,
        lastName: waitlist.lastName,
        email: waitlist.email,
        country: waitlist.country,
        trade: waitlist.trade,
        demoCode: waitlist.demoCode,
        demoCodeSent: waitlist.demoCodeSent,
        signupDate: waitlist.signupDate,
        earlyAccessRequested: waitlist.earlyAccessRequested
      })
      .from(waitlist)
      .orderBy(desc(waitlist.id))
    ]);

    // Calculate stats
    const stats = {
      totalDemoUsers: demoUsers.length,
      onboardedDemoUsers: demoUsers.filter(u => u.isOnboarded).length,
      totalWaitlistUsers: waitlistUsers.length,
      demoCodesIssued: waitlistUsers.filter(u => u.demoCode).length,
      earlyAccessRequests: waitlistUsers.filter(u => u.earlyAccessRequested).length
    };

    // Create HTML admin dashboard
    const html = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Blue Tradie - Admin Signup Monitor</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 0; padding: 20px; background: #f5f7fa; }
        .container { max-width: 1600px; margin: 0 auto; }
        .header { background: #1e40af; color: white; padding: 20px; border-radius: 8px; margin-bottom: 20px; }
        .header h1 { margin: 0; font-size: 24px; }
        .subtitle { opacity: 0.9; margin-top: 5px; }
        
        .stats { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 15px; margin-bottom: 30px; }
        .stat-card { background: white; padding: 20px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); text-align: center; }
        .stat-number { font-size: 2em; font-weight: bold; color: #1e40af; }
        .stat-label { color: #666; margin-top: 5px; font-size: 14px; }
        
        .section { background: white; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 4px rgba(0,0,0,0.1); margin-bottom: 30px; }
        .section-header { background: #f8f9fa; padding: 15px 20px; border-bottom: 1px solid #dee2e6; font-weight: 600; color: #495057; }
        
        table { width: 100%; border-collapse: collapse; }
        th { background: #f8f9fa; padding: 12px; text-align: left; border-bottom: 2px solid #dee2e6; font-weight: 600; font-size: 14px; }
        td { padding: 10px 12px; border-bottom: 1px solid #f1f3f4; font-size: 14px; }
        tr:hover { background: #f8f9fa; }
        
        .status-badge { padding: 4px 8px; border-radius: 12px; font-size: 12px; font-weight: 500; }
        .status-completed { background: #d4edda; color: #155724; }
        .status-pending { background: #fff3cd; color: #856404; }
        .status-demo { background: #d1ecf1; color: #0c5460; }
        .status-vip { background: #f8d7da; color: #721c24; }
        
        .demo-code { font-family: monospace; background: #f8f9fa; padding: 2px 6px; border-radius: 4px; font-size: 12px; }
        .email { color: #6c757d; }
        .name { font-weight: 500; }
        
        .refresh-btn { background: #28a745; color: white; border: none; padding: 8px 16px; border-radius: 4px; cursor: pointer; float: right; margin-left: 10px; }
        .refresh-btn:hover { background: #218838; }
        
        .timestamp { color: #6c757d; font-size: 12px; margin-top: 10px; }
        
        @media (max-width: 768px) {
            .container { padding: 10px; }
            .stats { grid-template-columns: 1fr 1fr; }
            table { font-size: 12px; }
            th, td { padding: 8px; }
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>Blue Tradie Admin - Signup Monitor</h1>
            <div class="subtitle">Real-time VIP waitlist and demo user monitoring</div>
            <button class="refresh-btn" onclick="location.reload()">🔄 Refresh</button>
        </div>
        
        <div class="stats">
            <div class="stat-card">
                <div class="stat-number">${stats.totalDemoUsers}</div>
                <div class="stat-label">Demo Users</div>
            </div>
            <div class="stat-card">
                <div class="stat-number">${stats.onboardedDemoUsers}</div>
                <div class="stat-label">Onboarded</div>
            </div>
            <div class="stat-card">
                <div class="stat-number">${stats.totalWaitlistUsers}</div>
                <div class="stat-label">VIP Waitlist</div>
            </div>
            <div class="stat-card">
                <div class="stat-number">${stats.demoCodesIssued}</div>
                <div class="stat-label">Demo Codes Issued</div>
            </div>
            <div class="stat-card">
                <div class="stat-number">${stats.earlyAccessRequests}</div>
                <div class="stat-label">Early Access</div>
            </div>
        </div>
        
        <div class="section">
            <div class="section-header">Demo Users (${demoUsers.length})</div>
            <table>
                <thead>
                    <tr>
                        <th>Name</th>
                        <th>Email</th>
                        <th>Country</th>
                        <th>Trade</th>
                        <th>Demo Code</th>
                        <th>Onboarding</th>
                        <th>Created</th>
                        <th>Business</th>
                    </tr>
                </thead>
                <tbody>
                    ${demoUsers.map(user => `
                        <tr>
                            <td class="name">${user.firstName} ${user.lastName}</td>
                            <td class="email">${user.email}</td>
                            <td>${user.country || 'N/A'}</td>
                            <td>${user.trade || 'N/A'}</td>
                            <td><span class="demo-code">${user.id.replace('demo-', '').substring(0, 12)}...</span></td>
                            <td>
                                <span class="status-badge ${user.isOnboarded ? 'status-completed' : 'status-pending'}">
                                    ${user.isOnboarded ? '✅ Complete' : '⏳ Pending'}
                                </span>
                            </td>
                            <td>${user.createdAt ? new Date(user.createdAt).toLocaleString() : 'N/A'}</td>
                            <td>${user.businessName || 'Not set'}</td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        </div>
        
        <div class="section">
            <div class="section-header">VIP Waitlist (${waitlistUsers.length})</div>
            <table>
                <thead>
                    <tr>
                        <th>Name</th>
                        <th>Email</th>
                        <th>Country</th>
                        <th>Trade</th>
                        <th>Demo Code</th>
                        <th>Code Sent</th>
                        <th>Early Access</th>
                        <th>Signup Date</th>
                    </tr>
                </thead>
                <tbody>
                    ${waitlistUsers.map(user => `
                        <tr>
                            <td class="name">${user.firstName || 'N/A'} ${user.lastName || ''}</td>
                            <td class="email">${user.email}</td>
                            <td>${user.country || 'N/A'}</td>
                            <td>${user.trade || 'N/A'}</td>
                            <td>
                                ${user.demoCode ? `<span class="demo-code">${user.demoCode}</span>` : 'Not issued'}
                            </td>
                            <td>
                                <span class="status-badge ${user.demoCodeSent ? 'status-completed' : 'status-pending'}">
                                    ${user.demoCodeSent ? '✅ Sent' : '⏳ Pending'}
                                </span>
                            </td>
                            <td>
                                <span class="status-badge ${user.earlyAccessRequested ? 'status-vip' : 'status-pending'}">
                                    ${user.earlyAccessRequested ? '🌟 Requested' : '-'}
                                </span>
                            </td>
                            <td>${user.signupDate ? new Date(user.signupDate).toLocaleString() : 'N/A'}</td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        </div>
        
        <div class="timestamp">
            Last updated: ${new Date().toLocaleString()} | Auto-refresh to see latest data
        </div>
    </div>
</body>
</html>
    `;

    res.send(html);
  } catch (error) {
    console.error('[ADMIN] Signup monitor error:', error);
    res.status(500).json({ message: 'Failed to load signup data' });
  }
});

/**
 * API endpoint for signup data (JSON)
 * GET /admin/signups/api
 */
router.get('/signups/api', requireAuth, async (req, res) => {
  try {
    const [demoUsers, waitlistUsers] = await Promise.all([
      db.select().from(users).where(eq(users.isDemoUser, true)).orderBy(desc(users.createdAt)),
      db.select().from(waitlist).orderBy(desc(waitlist.id))
    ]);

    res.json({
      demoUsers,
      waitlistUsers,
      stats: {
        totalDemoUsers: demoUsers.length,
        onboardedDemoUsers: demoUsers.filter(u => u.isOnboarded).length,
        totalWaitlistUsers: waitlistUsers.length,
        demoCodesIssued: waitlistUsers.filter(u => u.demoCode).length,
        earlyAccessRequests: waitlistUsers.filter(u => u.earlyAccessRequested).length
      },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('[ADMIN] API error:', error);
    res.status(500).json({ message: 'Failed to fetch signup data' });
  }
});

export default router;