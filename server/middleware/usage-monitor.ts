import { Request, Response, NextFunction } from 'express';

interface UsageStats {
  apiCalls: number;
  dbQueries: number;
  emailsSent: number;
  aiRequests: number;
  timestamp: Date;
}

class UsageMonitor {
  private static instance: UsageMonitor;
  private stats: UsageStats;
  private dailyLimits = {
    apiCalls: 10000,
    dbQueries: 50000,
    emailsSent: 500,
    aiRequests: 1000
  };

  constructor() {
    this.stats = {
      apiCalls: 0,
      dbQueries: 0,
      emailsSent: 0,
      aiRequests: 0,
      timestamp: new Date()
    };
  }

  static getInstance(): UsageMonitor {
    if (!UsageMonitor.instance) {
      UsageMonitor.instance = new UsageMonitor();
    }
    return UsageMonitor.instance;
  }

  // Middleware to track API calls
  trackApiCall = (req: Request, res: Response, next: NextFunction) => {
    this.stats.apiCalls++;
    
    // Check if approaching limits
    if (this.stats.apiCalls > this.dailyLimits.apiCalls * 0.8) {
      console.warn(`⚠️ API calls approaching limit: ${this.stats.apiCalls}/${this.dailyLimits.apiCalls}`);
    }
    
    // Add usage info to response headers for debugging
    res.setHeader('X-Usage-API-Calls', this.stats.apiCalls.toString());
    res.setHeader('X-Usage-Limit-API', this.dailyLimits.apiCalls.toString());
    
    next();
  };

  // Track database queries
  trackDbQuery() {
    this.stats.dbQueries++;
    
    if (this.stats.dbQueries > this.dailyLimits.dbQueries * 0.8) {
      console.warn(`⚠️ DB queries approaching limit: ${this.stats.dbQueries}/${this.dailyLimits.dbQueries}`);
    }
  }

  // Track email sends
  trackEmail() {
    this.stats.emailsSent++;
    
    if (this.stats.emailsSent > this.dailyLimits.emailsSent * 0.8) {
      console.warn(`⚠️ Emails approaching limit: ${this.stats.emailsSent}/${this.dailyLimits.emailsSent}`);
    }
  }

  // Track AI requests
  trackAiRequest() {
    this.stats.aiRequests++;
    
    if (this.stats.aiRequests > this.dailyLimits.aiRequests * 0.8) {
      console.warn(`⚠️ AI requests approaching limit: ${this.stats.aiRequests}/${this.dailyLimits.aiRequests}`);
    }
  }

  // Check if any limits are exceeded  
  isOverLimit(): boolean {
    return (
      this.stats.apiCalls >= this.dailyLimits.apiCalls ||
      this.stats.dbQueries >= this.dailyLimits.dbQueries ||
      this.stats.emailsSent >= this.dailyLimits.emailsSent ||
      this.stats.aiRequests >= this.dailyLimits.aiRequests
    );
  }

  // Get current usage stats
  getStats() {
    return {
      ...this.stats,
      limits: this.dailyLimits,
      percentages: {
        apiCalls: (this.stats.apiCalls / this.dailyLimits.apiCalls) * 100,
        dbQueries: (this.stats.dbQueries / this.dailyLimits.dbQueries) * 100,
        emailsSent: (this.stats.emailsSent / this.dailyLimits.emailsSent) * 100,
        aiRequests: (this.stats.aiRequests / this.dailyLimits.aiRequests) * 100
      }
    };
  }

  // Reset daily stats (call this daily)
  resetDailyStats(): void {
    console.log('📊 Daily usage stats before reset:', this.stats);
    this.stats = {
      apiCalls: 0,
      dbQueries: 0,
      emailsSent: 0,
      aiRequests: 0,
      timestamp: new Date()
    };
    console.log('🔄 Usage stats reset for new day');
  }

  // Generate usage report
  generateReport(): string {
    const stats = this.getStats();
    return `
📊 Blue Tradie Usage Report - ${new Date().toISOString()}

API Calls: ${stats.apiCalls}/${stats.limits.apiCalls} (${stats.percentages.apiCalls.toFixed(1)}%)
DB Queries: ${stats.dbQueries}/${stats.limits.dbQueries} (${stats.percentages.dbQueries.toFixed(1)}%)
Emails Sent: ${stats.emailsSent}/${stats.limits.emailsSent} (${stats.percentages.emailsSent.toFixed(1)}%)
AI Requests: ${stats.aiRequests}/${stats.limits.aiRequests} (${stats.percentages.aiRequests.toFixed(1)}%)

Status: ${this.isOverLimit() ? '🚨 OVER LIMIT' : stats.percentages.apiCalls > 80 ? '⚠️ APPROACHING LIMIT' : '✅ NORMAL'}
    `.trim();
  }
}

export default UsageMonitor;