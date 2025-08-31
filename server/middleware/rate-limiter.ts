import { Request, Response, NextFunction } from 'express';

interface RateLimitStore {
  [key: string]: {
    count: number;
    resetTime: number;
  };
}

class RateLimiter {
  private store: RateLimitStore = {};
  
  // Create rate limiter middleware
  create(options: {
    windowMs: number;  // Time window in milliseconds
    max: number;       // Max requests per window
    message?: string;  // Custom error message
    keyGenerator?: (req: Request) => string; // Custom key function
  }) {
    return (req: Request, res: Response, next: NextFunction) => {
      const key = options.keyGenerator ? options.keyGenerator(req) : req.ip || 'unknown';
      const now = Date.now();
      
      // Clean up expired entries
      if (this.store[key] && now > this.store[key].resetTime) {
        delete this.store[key];
      }
      
      // Initialize or increment counter
      if (!this.store[key]) {
        this.store[key] = {
          count: 1,
          resetTime: now + options.windowMs
        };
      } else {
        this.store[key].count++;
      }
      
      // Check if limit exceeded
      if (this.store[key].count > options.max) {
        const timeUntilReset = Math.ceil((this.store[key].resetTime - now) / 1000);
        
        res.status(429).json({
          error: options.message || 'Too many requests',
          retryAfter: timeUntilReset,
          limit: options.max,
          current: this.store[key].count
        });
        return;
      }
      
      // Add rate limit headers
      res.setHeader('X-RateLimit-Limit', options.max.toString());
      res.setHeader('X-RateLimit-Remaining', (options.max - this.store[key].count).toString());
      res.setHeader('X-RateLimit-Reset', Math.ceil(this.store[key].resetTime / 1000).toString());
      
      next();
    };
  }
  
  // Specific rate limiters for different operations
  static apiGeneral = new RateLimiter().create({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // 100 requests per 15 minutes per IP
    message: 'Too many API requests. Please try again later.'
  });
  
  static aiChat = new RateLimiter().create({
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 50, // 50 AI chat requests per hour per user
    message: 'AI chat limit reached. Please wait before sending more messages.',
    keyGenerator: (req: any) => req.user?.claims?.sub || req.ip
  });
  
  static emailSend = new RateLimiter().create({
    windowMs: 24 * 60 * 60 * 1000, // 24 hours
    max: 5, // 5 emails per day per user
    message: 'Daily email limit reached. Please try again tomorrow.',
    keyGenerator: (req: any) => req.user?.claims?.sub || req.ip
  });
  
  static betaSignup = new RateLimiter().create({
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 3, // 3 beta signup attempts per hour per IP
    message: 'Too many beta signup attempts. Please try again later.'
  });
  
  static fileUpload = new RateLimiter().create({
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 10, // 10 file uploads per hour per user
    message: 'File upload limit reached. Please try again later.',
    keyGenerator: (req: any) => req.user?.claims?.sub || req.ip
  });
}

export default RateLimiter;