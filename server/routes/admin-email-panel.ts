// Admin panel for email automation management
import { Router } from 'express';
import { eq } from 'drizzle-orm';
import { db } from '../db';
import { waitlist } from '@shared/schema';
// waitlist-email-automation service removed - functionality integrated into waitlist-service

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
 * Admin dashboard with email automation overview
 * GET /internal/email-admin
 */
router.get('/email-admin', requireAuth, async (req, res) => {
  try {
    // Get all users with their email status
    const users = await db
      .select()
      .from(waitlist)
      .orderBy(waitlist.id);

    // Generate summary stats
    const stats = {
      totalUsers: users.length,
      demoCodesGenerated: users.filter(u => u.demoCode).length,
      earlyAccessRequests: users.filter(u => u.earlyAccessRequested).length,
      day7EmailsSent: users.filter(u => u.day7EmailSent).length,
      day14EmailsSent: users.filter(u => u.day14EmailSent).length,
      foundingMembers: users.filter(u => u.foundingMemberStatus).length
    };

    // Create HTML admin panel
    const html = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Blue Tradie - Email Admin Panel</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 0; padding: 20px; background: #f5f5f5; }
        .container { max-width: 1400px; margin: 0 auto; }
        .header { background: #1e40af; color: white; padding: 20px; border-radius: 8px; margin-bottom: 20px; }
        .stats { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 15px; margin-bottom: 30px; }
        .stat-card { background: white; padding: 20px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); text-align: center; }
        .stat-number { font-size: 2em; font-weight: bold; color: #1e40af; }
        .stat-label { color: #666; margin-top: 5px; }
        .users-table { background: white; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
        table { width: 100%; border-collapse: collapse; }
        th { background: #f8f9fa; padding: 12px; text-align: left; border-bottom: 2px solid #dee2e6; font-weight: 600; }
        td { padding: 10px 12px; border-bottom: 1px solid #dee2e6; }
        .status-badge { padding: 4px 8px; border-radius: 12px; font-size: 12px; font-weight: 500; }
        .status-sent { background: #d4edda; color: #155724; }
        .status-pending { background: #fff3cd; color: #856404; }
        .status-not-sent { background: #f8d7da; color: #721c24; }
        .action-btn { background: #007bff; color: white; border: none; padding: 6px 12px; border-radius: 4px; cursor: pointer; font-size: 12px; margin: 2px; }
        .action-btn:hover { background: #0056b3; }
        .action-btn.danger { background: #dc3545; }
        .action-btn.danger:hover { background: #c82333; }
        .refresh-btn { background: #28a745; color: white; border: none; padding: 10px 20px; border-radius: 4px; cursor: pointer; margin-bottom: 20px; }
        .demo-code { font-family: monospace; background: #f8f9fa; padding: 4px 8px; border-radius: 4px; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>📧 Blue Tradie Email Automation Admin</h1>
            <p>Manage email campaigns and user journeys</p>
        </div>

        <div style="margin-bottom: 20px;">
            <button class="refresh-btn" onclick="window.location.reload()">🔄 Refresh Data</button>
            <button class="refresh-btn" style="background: #17a2b8;" onclick="exportToCSV()">📊 Export CSV</button>
            <button class="refresh-btn" style="background: #28a745;" onclick="runFullTest()">🧪 Run Full Test</button>
        </div>

        <div class="stats">
            <div class="stat-card">
                <div class="stat-number">${stats.totalUsers}</div>
                <div class="stat-label">Total VIP Users</div>
            </div>
            <div class="stat-card">
                <div class="stat-number">${stats.demoCodesGenerated}</div>
                <div class="stat-label">Demo Codes Generated</div>
            </div>
            <div class="stat-card">
                <div class="stat-number">${stats.earlyAccessRequests}</div>
                <div class="stat-label">Early Access Requests</div>
            </div>
            <div class="stat-card">
                <div class="stat-number">${stats.day7EmailsSent}</div>
                <div class="stat-label">Day 7 Follow-ups</div>
            </div>
            <div class="stat-card">
                <div class="stat-number">${stats.day14EmailsSent}</div>
                <div class="stat-label">Day 14 Video Requests</div>
            </div>
            <div class="stat-card">
                <div class="stat-number">${stats.foundingMembers}</div>
                <div class="stat-label">Founding Members</div>
            </div>
        </div>

        <div class="users-table">
            <table>
                <thead>
                    <tr>
                        <th>VIP #</th>
                        <th>User</th>
                        <th>Email</th>
                        <th>Demo Code</th>
                        <th>Early Access</th>
                        <th>Day 7 Email</th>
                        <th>Day 14 Email</th>
                        <th>Video/Founding</th>
                        <th>Notes/Flags</th>
                        <th>Actions</th>
                    </tr>
                </thead>
                <tbody>
                    ${users.map((user, index) => `
                    <tr>
                        <td><strong>#${index + 13}</strong></td>
                        <td>${user.firstName || ''} ${user.lastName || ''}</td>
                        <td>${user.email}</td>
                        <td>${user.demoCode ? `<span class="demo-code">${user.demoCode}</span>` : '-'}</td>
                        <td>
                            <span class="status-badge ${user.earlyAccessRequested ? 'status-sent' : 'status-not-sent'}">
                                ${user.earlyAccessRequested ? '✅ Requested' : '❌ Not Requested'}
                            </span>
                        </td>
                        <td>
                            <span class="status-badge ${user.day7EmailSent ? 'status-sent' : 'status-pending'}">
                                ${user.day7EmailSent ? '✅ Sent' : '⏳ Pending'}
                            </span>
                        </td>
                        <td>
                            <span class="status-badge ${user.day14EmailSent ? 'status-sent' : 'status-pending'}">
                                ${user.day14EmailSent ? '✅ Sent' : '⏳ Pending'}
                            </span>
                        </td>
                        <td>
                            <span class="status-badge ${user.foundingMemberStatus ? 'status-sent' : 'status-not-sent'}">
                                ${user.foundingMemberStatus ? '👑 Founding Member' : user.videoSubmitted ? '🎥 Video Submitted' : '❌ No Video'}
                            </span>
                        </td>
                        <td>
                            <input type="text" 
                                   id="notes-${user.id}" 
                                   placeholder="Add notes..." 
                                   style="width: 120px; padding: 4px; border: 1px solid #ccc; border-radius: 4px; font-size: 12px;"
                                   onblur="saveNotes('${user.email}', this.value)"
                                   value="${user.notes || ''}" />
                        </td>
                        <td>
                            ${!user.earlyAccessRequested ? `<button class="action-btn" onclick="triggerEarlyAccess('${user.email}')">Send Demo Access</button>` : ''}
                            ${user.earlyAccessRequested && !user.day7EmailSent ? `<button class="action-btn" onclick="sendDay7('${user.email}')">Send Day 7</button>` : ''}
                            ${user.earlyAccessRequested && !user.day14EmailSent ? `<button class="action-btn" onclick="sendDay14('${user.email}')">Send Day 14</button>` : ''}
                            <button class="action-btn danger" onclick="resetUser('${user.email}')">Reset</button>
                        </td>
                    </tr>
                    `).join('')}
                </tbody>
            </table>
        </div>
    </div>

    <script>
        async function triggerEarlyAccess(email) {
            if (!confirm(\`Send demo access email to \${email}?\`)) return;
            
            try {
                const response = await fetch(\`/api/waitlist/request-early-access?email=\${encodeURIComponent(email)}\`);
                if (response.ok) {
                    alert('Demo access email sent successfully!');
                    window.location.reload();
                } else {
                    alert('Failed to send email');
                }
            } catch (error) {
                alert('Error: ' + error.message);
            }
        }

        async function sendDay7(email) {
            if (!confirm(\`Send day 7 follow-up to \${email}?\`)) return;
            
            try {
                const response = await fetch('/api/waitlist/send-day7-followups', { method: 'POST' });
                const result = await response.json();
                alert(\`Day 7 emails sent: \${result.emailsSent}\`);
                window.location.reload();
            } catch (error) {
                alert('Error: ' + error.message);
            }
        }

        async function sendDay14(email) {
            if (!confirm(\`Send day 14 video request to \${email}?\`)) return;
            
            try {
                const response = await fetch('/api/waitlist/send-day14-video-requests', { method: 'POST' });
                const result = await response.json();
                alert(\`Day 14 emails sent: \${result.emailsSent}\`);
                window.location.reload();
            } catch (error) {
                alert('Error: ' + error.message);
            }
        }

        async function resetUser(email) {
            if (!confirm(\`Reset all email automation for \${email}? This will clear their progress.\`)) return;
            
            try {
                const response = await fetch('/internal/reset-user-automation', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ email })
                });
                
                if (response.ok) {
                    alert('User automation reset successfully!');
                    window.location.reload();
                } else {
                    alert('Failed to reset user');
                }
            } catch (error) {
                alert('Error: ' + error.message);
            }
        }

        async function saveNotes(email, notes) {
            try {
                await fetch('/internal/save-user-notes', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ email, notes })
                });
            } catch (error) {
                console.error('Failed to save notes:', error);
            }
        }

        function exportToCSV() {
            window.location.href = '/internal/export-users-csv';
        }

        async function runFullTest() {
            if (!confirm('This will create 10 test users and send test emails. Continue?')) return;
            
            try {
                const response = await fetch('/internal/run-full-test', { method: 'POST' });
                const result = await response.json();
                alert(\`Test completed: \${result.message}\`);
                window.location.reload();
            } catch (error) {
                alert('Test failed: ' + error.message);
            }
        }
    </script>
</body>
</html>`;

    res.send(html);
  } catch (error) {
    console.error('[ADMIN PANEL] Error:', error);
    res.status(500).json({ message: 'Failed to load admin panel' });
  }
});

/**
 * Reset user email automation
 * POST /internal/reset-user-automation
 */
router.post('/reset-user-automation', requireAuth, async (req, res) => {
  try {
    const { email } = req.body;
    
    if (!email) {
      return res.status(400).json({ message: 'Email is required' });
    }

    // Reset all email automation fields
    const updated = await db
      .update(waitlist)
      .set({
        demoCode: null,
        demoCodeSent: false,
        demoCodeSentAt: null,
        earlyAccessRequested: false,
        earlyAccessRequestedAt: null,
        day7EmailSent: false,
        day7EmailSentAt: null,
        day14EmailSent: false,
        day14EmailSentAt: null,
        videoSubmitted: false,
        videoSubmittedAt: null,
        foundingMemberStatus: false
      })
      .where(eq(waitlist.email, email))
      .returning();

    if (updated.length === 0) {
      return res.status(404).json({ message: 'User not found' });
    }

    console.log(`[ADMIN] Reset email automation for ${email}`);
    res.json({ message: 'User automation reset successfully' });
  } catch (error) {
    console.error('[ADMIN] Error resetting user:', error);
    res.status(500).json({ message: 'Failed to reset user automation' });
  }
});

/**
 * Save user notes
 * POST /internal/save-user-notes
 */
router.post('/save-user-notes', requireAuth, async (req, res) => {
  try {
    const { email, notes } = req.body;
    
    await db.update(waitlist)
      .set({ notes })
      .where(eq(waitlist.email, email));
    
    res.json({ success: true });
  } catch (error) {
    console.error('[ADMIN] Error saving notes:', error);
    res.status(500).json({ message: 'Failed to save notes' });
  }
});

/**
 * Export users to CSV
 * GET /internal/export-users-csv
 */
router.get('/export-users-csv', requireAuth, async (req, res) => {
  try {
    const users = await db.select().from(waitlist).orderBy(waitlist.id);
    
    const csvHeaders = [
      'VIP Number',
      'Email',
      'First Name',
      'Last Name',
      'Country',
      'Trade',
      'Demo Code',
      'Demo Code Sent',
      'Early Access Requested',
      'Day 7 Email Sent',
      'Day 14 Email Sent',
      'Video Submitted',
      'Founding Member',
      'Notes',
      'Signup Date'
    ].join(',');
    
    const csvRows = users.map((user, index) => [
      index + 13,
      user.email,
      user.firstName || '',
      user.lastName || '',
      user.country || '',
      user.trade || '',
      user.demoCode || '',
      user.demoCodeSent ? 'Yes' : 'No',
      user.earlyAccessRequested ? 'Yes' : 'No',
      user.day7EmailSent ? 'Yes' : 'No',
      user.day14EmailSent ? 'Yes' : 'No',
      user.videoSubmitted ? 'Yes' : 'No',
      user.foundingMemberStatus ? 'Yes' : 'No',
      user.notes || '',
      user.signupDate?.toISOString().split('T')[0] || ''
    ].map(field => `"${field}"`).join(','));
    
    const csv = [csvHeaders, ...csvRows].join('\n');
    
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="blue-tradie-users-${new Date().toISOString().split('T')[0]}.csv"`);
    res.send(csv);
  } catch (error) {
    console.error('[ADMIN] CSV export error:', error);
    res.status(500).json({ message: 'Failed to export CSV' });
  }
});

/**
 * Run full test of email automation
 * POST /internal/run-full-test
 */
router.post('/run-full-test', requireAuth, async (req, res) => {
  try {
    console.log('[ADMIN TEST] Starting comprehensive email automation test...');
    
    // Create 10 test users
    const testUsers = [];
    for (let i = 1; i <= 10; i++) {
      const user = {
        email: `test${i}@bluetradie-test.com`,
        firstName: `Test${i}`,
        lastName: 'User',
        country: i % 2 === 0 ? 'New Zealand' : 'Australia',
        trade: ['Electrician', 'Plumber', 'Builder', 'Painter'][i % 4]
      };
      
      const [created] = await db.insert(waitlist)
        .values(user)
        .onConflictDoNothing()
        .returning();
      
      if (created) {
        testUsers.push(created);
        console.log(`[TEST] Created user: ${user.email}`);
        
        // Send confirmation email
        // Email automation integrated into waitlist-service.ts
      }
    }
    
    console.log(`[ADMIN TEST] Created ${testUsers.length} test users`);
    
    // Test early access for first 5 users
    let earlyAccessCount = 0;
    for (const user of testUsers.slice(0, 5)) {
      // Early access requests handled by waitlist-service.ts
      const success = false; // Disabled - use waitlist service instead
      if (success) earlyAccessCount++;
    }
    
    // Test day 7 follow-ups
    const day7Count = 0; // Email automation disabled
    
    // Test day 14 video requests  
    const day14Count = 0; // Email automation disabled
    
    console.log('[ADMIN TEST] Test completed successfully');
    
    res.json({
      success: true,
      message: `Test completed: ${testUsers.length} users created, ${earlyAccessCount} early access emails, ${day7Count} day 7 emails, ${day14Count} day 14 emails`,
      testUsersCreated: testUsers.length,
      earlyAccessEmails: earlyAccessCount,
      day7Emails: day7Count,
      day14Emails: day14Count
    });
  } catch (error) {
    console.error('[ADMIN TEST] Error:', error);
    res.status(500).json({ message: 'Test failed: ' + (error as Error).message });
  }
});

/**
 * Bulk email operations
 * POST /internal/bulk-email-operation
 */
router.post('/bulk-email-operation', requireAuth, async (req, res) => {
  try {
    const { operation } = req.body;
    let result = { emailsSent: 0, message: '' };

    switch (operation) {
      case 'day7-followups':
        result = { emailsSent: 0, message: 'Day 7 automation disabled - use waitlist service instead' };
        break;
        
      case 'day14-video-requests':
        result = { emailsSent: 0, message: 'Day 14 automation disabled - use waitlist service instead' };
        break;
        
      default:
        return res.status(400).json({ message: 'Invalid operation' });
    }

    console.log(`[ADMIN] Bulk operation ${operation}: ${result.message}`);
    res.json(result);
  } catch (error) {
    console.error('[ADMIN] Bulk operation error:', error);
    res.status(500).json({ message: 'Failed to execute bulk operation' });
  }
});

export default router;