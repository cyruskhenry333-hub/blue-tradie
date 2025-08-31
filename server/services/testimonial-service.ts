// Testimonial collection service for beta users

export interface TestimonialRequest {
  userId: string;
  email: string;
  firstName: string;
  tier: string;
  daysActive: number;
}

export interface TestimonialSubmission {
  userId: string;
  rating: number; // 1-5 stars
  testimonialText: string;
  permissions: {
    canPublish: boolean;
    canUseNameAndBusiness: boolean;
    canUseInMarketing: boolean;
  };
  submittedAt: Date;
}

export class TestimonialService {
  
  // Check if user is ready for testimonial request (after 7 days)
  shouldRequestTestimonial(user: any): boolean {
    if (!user.createdAt || !user.isOnboarded) return false;
    
    const daysSinceOnboarding = Math.floor(
      (Date.now() - new Date(user.createdAt).getTime()) / (1000 * 60 * 60 * 24)
    );
    
    // Request after 7 days, but only if they haven't already submitted
    return daysSinceOnboarding >= 7 && !user.hasSubmittedTestimonial;
  }

  // Generate testimonial request email
  generateTestimonialRequestEmail(userData: TestimonialRequest): string {
    const { firstName, tier, daysActive } = userData;
    
    return `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>How's your Blue Tradie experience going?</title>
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: #1e40af; color: white; padding: 20px; text-align: center; border-radius: 8px; }
        .content { padding: 20px; background: #f9f9f9; margin-top: 20px; border-radius: 8px; }
        .rating-section { background: white; padding: 20px; margin: 20px 0; border-radius: 8px; text-align: center; }
        .star-rating { font-size: 24px; margin: 10px 0; }
        .button { display: inline-block; background: #ea580c; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; margin: 10px 5px; }
        .footer { text-align: center; padding: 20px; font-size: 12px; color: #666; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>📝 Quick Question, ${firstName}!</h1>
            <p>You've been using Blue Tradie for ${daysActive} days</p>
        </div>
        
        <div class="content">
            <p>Hey ${firstName},</p>
            
            <p>Hope Blue Tradie is making your business life easier! As one of our ${tier} beta users, your feedback is incredibly valuable.</p>
            
            <div class="rating-section">
                <h3>How would you rate your experience so far?</h3>
                <div class="star-rating">⭐ ⭐ ⭐ ⭐ ⭐</div>
                <p>
                    <a href="${process.env.NODE_ENV === 'production' ? 'https://bluetradie.com' : 'http://localhost:5000'}/testimonial?rating=5" class="button">5 Stars</a>
                    <a href="${process.env.NODE_ENV === 'production' ? 'https://bluetradie.com' : 'http://localhost:5000'}/testimonial?rating=4" class="button">4 Stars</a>
                    <a href="${process.env.NODE_ENV === 'production' ? 'https://bluetradie.com' : 'http://localhost:5000'}/testimonial?rating=3" class="button">3 Stars</a>
                </p>
            </div>
            
            <p><strong>What we're looking for:</strong></p>
            <ul>
                <li>How has Blue Tradie helped your business?</li>
                <li>Which features do you find most valuable?</li>
                <li>What would you tell other tradies about Blue Tradie?</li>
            </ul>
            
            <p><strong>The best part?</strong> If you give us a great review, we'd love to feature your success story (with your permission) to help other tradies discover Blue Tradie.</p>
            
            <p>
                <a href="${process.env.NODE_ENV === 'production' ? 'https://bluetradie.com' : 'http://localhost:5000'}/testimonial" class="button" style="background: #dc2626;">
                    Share Your Experience
                </a>
            </p>
            
            <p style="font-size: 14px; color: #666; margin-top: 30px;">
                <em>This takes less than 2 minutes, and helps us show other tradies how Blue Tradie can transform their business.</em>
            </p>
            
            <p>Cheers,<br>
            The Blue Tradie Team</p>
        </div>
        
        <div class="footer">
            <p>Blue Tradie Beta - Built by tradies, for tradies</p>
        </div>
    </div>
</body>
</html>
    `.trim();
  }

  // Auto-trigger testimonial request emails
  async sendTestimonialRequests(): Promise<{ sent: number; failed: number }> {
    try {
      // This would run as a scheduled job (daily)
      // Query users who should receive testimonial requests
      
      // TODO: Implement actual database query and email sending
      console.log("Checking for users ready for testimonial requests...");
      
      return { sent: 0, failed: 0 };
    } catch (error) {
      console.error("Error sending testimonial requests:", error);
      return { sent: 0, failed: 1 };
    }
  }
}

export const testimonialService = new TestimonialService();