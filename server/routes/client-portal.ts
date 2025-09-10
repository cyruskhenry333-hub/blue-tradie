import type { Express } from "express";

export function registerClientPortalRoutes(app: Express) {
  // Get job information for client portal
  app.get('/api/client/portal/:jobId', async (req, res) => {
    try {
      const { jobId } = req.params;
      const { token } = req.query;
      
      if (!token) {
        return res.status(400).json({ 
          success: false, 
          message: "Access token required" 
        });
      }
      
      // TODO: In real implementation, validate token and fetch from database
      // For now, return sample data
      const sampleJob = {
        id: jobId,
        title: "Kitchen Electrical Upgrade",
        description: "Complete rewiring of kitchen including new power outlets, lighting circuits, and safety switches. All work complies with Australian electrical standards.",
        status: "completed",
        amount: 1250.00,
        photos: [
          "https://images.unsplash.com/photo-1621905251189-08b45d6a269e?w=400&h=300&fit=crop",
          "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400&h=300&fit=crop",
          "https://images.unsplash.com/photo-1621905252507-b35492cc74b4?w=400&h=300&fit=crop"
        ],
        signedOff: false,
        depositPaid: false
      };
      
      res.json({
        success: true,
        job: sampleJob
      });
    } catch (error) {
      console.error('Client portal error:', error);
      res.status(500).json({
        success: false,
        message: "Failed to load job information"
      });
    }
  });

  // Handle client sign-off
  app.post('/api/client/portal/:jobId/signoff', async (req, res) => {
    try {
      const { jobId } = req.params;
      const { token } = req.body;
      
      if (!token) {
        return res.status(400).json({ 
          success: false, 
          message: "Access token required" 
        });
      }
      
      // TODO: In real implementation, validate token and update database
      console.log(`[CLIENT PORTAL] Job ${jobId} signed off by client`);
      
      res.json({
        success: true,
        message: "Job successfully signed off. Thank you!"
      });
    } catch (error) {
      console.error('Sign-off error:', error);
      res.status(500).json({
        success: false,
        message: "Failed to process sign-off"
      });
    }
  });

  // Handle deposit payment
  app.post('/api/client/portal/:jobId/deposit', async (req, res) => {
    try {
      const { jobId } = req.params;
      const { token } = req.body;
      
      if (!token) {
        return res.status(400).json({ 
          success: false, 
          message: "Access token required" 
        });
      }
      
      // Check if Stripe is configured
      if (!process.env.STRIPE_SECRET_KEY) {
        return res.json({
          success: true,
          message: "Payments disabled in this environment. In production, this would redirect to secure Stripe checkout."
        });
      }
      
      // TODO: In real implementation, create Stripe checkout session
      console.log(`[CLIENT PORTAL] Deposit payment requested for job ${jobId}`);
      
      res.json({
        success: true,
        message: "Payment processing would redirect to secure Stripe checkout in production environment."
      });
    } catch (error) {
      console.error('Payment error:', error);
      res.status(500).json({
        success: false,
        message: "Payment processing failed"
      });
    }
  });
}