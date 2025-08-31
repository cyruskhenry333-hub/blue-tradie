// SendGrid Debug Route for checking delivery status
import { Router } from 'express';
import { MailService } from '@sendgrid/mail';

const router = Router();

// Initialize SendGrid for activity lookup
const mailService = new MailService();
const apiKey = process.env.SENDGRID_API_KEY;
if (apiKey) {
  mailService.setApiKey(apiKey);
}

router.get('/delivery-status/:email', async (req, res) => {
  try {
    const { email } = req.params;
    
    if (!apiKey) {
      return res.json({ error: 'SendGrid API key not configured' });
    }

    // Get activity for the last 24 hours
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    
    const response = await fetch(`https://api.sendgrid.com/v3/messages?to_email=${encodeURIComponent(email)}&limit=50`, {
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      const errorData = await response.text();
      console.log('SendGrid API Error:', response.status, errorData);
      return res.json({ 
        error: `SendGrid API error: ${response.status}`,
        details: errorData
      });
    }

    const data = await response.json();
    
    res.json({
      email,
      messages: data.messages || [],
      total_count: data.messages?.length || 0,
      api_response: data
    });

  } catch (error) {
    console.error('SendGrid debug error:', error);
    res.status(500).json({ 
      error: 'Failed to fetch delivery status',
      details: error.message 
    });
  }
});

export default router;