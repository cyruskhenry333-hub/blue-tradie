// Simple event tracking system for Blue Tradie beta analytics
interface AnalyticsEvent {
  event: string;
  timestamp: string;
  data?: Record<string, any>;
  userId?: string;
  sessionId: string;
}

class Analytics {
  private sessionId: string;
  private userId?: string;

  constructor() {
    this.sessionId = this.generateSessionId();
  }

  private generateSessionId(): string {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  setUserId(userId: string) {
    this.userId = userId;
  }

  track(event: string, data?: Record<string, any>) {
    const analyticsEvent: AnalyticsEvent = {
      event,
      timestamp: new Date().toISOString(),
      data,
      userId: this.userId,
      sessionId: this.sessionId
    };

    // Log to console for immediate visibility
    console.log(`[ANALYTICS] ${event}`, analyticsEvent);

    // Send to backend for storage/processing
    this.sendToBackend(analyticsEvent);
  }

  private async sendToBackend(event: AnalyticsEvent) {
    try {
      await fetch('/api/analytics/track', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(event)
      });
    } catch (error) {
      console.error('[ANALYTICS] Failed to send event:', error);
    }
  }

  // Convenience methods for key tracking events
  trackTierSelection(tier: 'founding' | 'earlySupporter' | 'betaTester') {
    this.track('tier_selected', { tier });
  }

  trackOnboardingStart() {
    this.track('onboarding_started');
  }

  trackOnboardingComplete() {
    this.track('onboarding_completed');
  }

  trackTourStart() {
    this.track('tour_started');
  }

  trackTourStep(step: number, stepName: string) {
    this.track('tour_step_viewed', { step, stepName });
  }

  trackTourComplete() {
    this.track('tour_completed');
  }

  trackCTAClick(ctaText: string, location: string) {
    this.track('cta_clicked', { ctaText, location });
  }

  trackWaitlistSubmission(email: string) {
    this.track('waitlist_submitted', { email: email.substring(0, 3) + '***' }); // Privacy-safe partial email
  }

  trackSignupAttempt() {
    this.track('signup_attempted');
  }

  trackSignupSuccess(tier: string) {
    this.track('signup_completed', { tier });
  }
}

// Global analytics instance
export const analytics = new Analytics();

// Helper hook for React components
export function useAnalytics() {
  return analytics;
}