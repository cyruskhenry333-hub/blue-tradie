import { Router } from 'express';
import { developmentTriggerService } from '../services/development-trigger-service';

const router = Router();

/**
 * Get current development trigger status
 */
router.get('/status', async (req, res) => {
  try {
    const status = developmentTriggerService.getTriggerStatus();
    res.json({
      success: true,
      ...status,
      currentTime: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error getting trigger status:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to get trigger status' 
    });
  }
});

/**
 * Manually check and trigger development (for testing or adjustment)
 */
router.post('/check', async (req, res) => {
  try {
    await developmentTriggerService.checkAndTriggerDevelopment();
    const status = developmentTriggerService.getTriggerStatus();
    
    res.json({
      success: true,
      message: 'Development trigger check completed',
      ...status
    });
  } catch (error) {
    console.error('Error checking development trigger:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to check development trigger' 
    });
  }
});

/**
 * Manual trigger for development (emergency or testing)
 * Requires reason parameter
 */
router.post('/manual-trigger', async (req, res) => {
  try {
    const { reason } = req.body;
    
    if (!reason) {
      return res.status(400).json({
        success: false,
        message: 'Reason required for manual trigger'
      });
    }
    
    await developmentTriggerService.manualTrigger(reason);
    const status = developmentTriggerService.getTriggerStatus();
    
    res.json({
      success: true,
      message: 'Manual development trigger activated',
      reason,
      ...status
    });
  } catch (error) {
    console.error('Error with manual trigger:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to trigger development manually' 
    });
  }
});

/**
 * Update trigger count threshold (if needed)
 */
router.post('/update-threshold', async (req, res) => {
  try {
    const { triggerCount } = req.body;
    
    if (!triggerCount || triggerCount < 1) {
      return res.status(400).json({
        success: false,
        message: 'Valid trigger count required'
      });
    }
    
    developmentTriggerService.updateTriggerCount(triggerCount);
    const status = developmentTriggerService.getTriggerStatus();
    
    res.json({
      success: true,
      message: `Trigger count updated to ${triggerCount}`,
      ...status
    });
  } catch (error) {
    console.error('Error updating trigger count:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to update trigger count' 
    });
  }
});

export default router;