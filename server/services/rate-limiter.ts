// Simple in-memory rate limiter for magic link requests
// In production, you'd want to use Redis or similar

interface RateLimitEntry {
  count: number;
  resetTime: number;
}

export class RateLimiter {
  private store = new Map<string, RateLimitEntry>();
  private maxRequests: number;
  private windowMs: number;
  
  constructor(maxRequests = 3, windowMinutes = 15) {
    this.maxRequests = maxRequests;
    this.windowMs = windowMinutes * 60 * 1000;
    
    // Cleanup expired entries every 5 minutes
    setInterval(() => this.cleanup(), 5 * 60 * 1000);
  }
  
  isAllowed(key: string): boolean {
    const now = Date.now();
    const entry = this.store.get(key);
    
    if (!entry || now > entry.resetTime) {
      // First request or window expired
      this.store.set(key, {
        count: 1,
        resetTime: now + this.windowMs
      });
      return true;
    }
    
    if (entry.count >= this.maxRequests) {
      return false;
    }
    
    entry.count++;
    return true;
  }
  
  getRemainingTime(key: string): number {
    const entry = this.store.get(key);
    if (!entry) return 0;
    
    const remaining = entry.resetTime - Date.now();
    return Math.max(0, remaining);
  }
  
  private cleanup(): void {
    const now = Date.now();
    const keysToDelete: string[] = [];
    
    this.store.forEach((entry, key) => {
      if (now > entry.resetTime) {
        keysToDelete.push(key);
      }
    });
    
    keysToDelete.forEach(key => this.store.delete(key));
  }
}

// Export a singleton instance for magic link requests
export const magicLinkRateLimiter = new RateLimiter(3, 15); // 3 requests per 15 minutes