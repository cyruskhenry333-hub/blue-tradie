import { Router } from 'express';
import UsageMonitor from '../middleware/usage-monitor';

const router = Router();

// Get current usage stats (admin only)
router.get('/api/admin/usage-stats', async (req: any, res) => {
  try {
    // Simple admin check (in production, use proper admin middleware)
    const userId = req.user?.claims?.sub;
    if (!userId) {
      return res.status(401).json({ error: 'Authentication required' });
    }
    
    const monitor = UsageMonitor.getInstance();
    const stats = monitor.getStats();
    
    res.json({
      ...stats,
      reportGenerated: new Date().toISOString(),
      status: monitor.isOverLimit() ? 'OVER_LIMIT' : stats.percentages.apiCalls > 80 ? 'APPROACHING_LIMIT' : 'NORMAL'
    });
  } catch (error) {
    console.error('Usage stats error:', error);
    res.status(500).json({ error: 'Failed to get usage stats' });
  }
});

// Generate usage report (admin only)
router.get('/api/admin/usage-report', async (req: any, res) => {
  try {
    const userId = req.user?.claims?.sub;
    if (!userId) {
      return res.status(401).json({ error: 'Authentication required' });
    }
    
    const monitor = UsageMonitor.getInstance();
    const report = monitor.generateReport();
    
    res.json({
      report,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Usage report error:', error);
    res.status(500).json({ error: 'Failed to generate usage report' });
  }
});

// Reset usage stats (admin only - for testing)
router.post('/api/admin/usage-reset', async (req: any, res) => {
  try {
    const userId = req.user?.claims?.sub;
    if (!userId) {
      return res.status(401).json({ error: 'Authentication required' });
    }
    
    const monitor = UsageMonitor.getInstance();
    monitor.resetDailyStats();
    
    res.json({
      success: true,
      message: 'Usage stats reset successfully',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Usage reset error:', error);
    res.status(500).json({ error: 'Failed to reset usage stats' });
  }
});

export default router;