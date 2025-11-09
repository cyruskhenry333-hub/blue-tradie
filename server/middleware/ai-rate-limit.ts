/**
 * Rate limiting middleware for AI endpoints
 * Prevents abuse of expensive AI API calls
 */

import rateLimit from 'express-rate-limit';
import { Request, Response } from 'express';

// Get user ID for rate limiting
const getUserKey = (req: Request): string => {
  const user = (req as any).user;
  return user?.claims?.sub || req.ip || 'anonymous';
};

/**
 * Rate limiter for AI chat endpoints
 * Limit: 50 requests per hour per user
 */
export const aiChatRateLimit = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: parseInt(process.env.AI_RATE_LIMIT_HOURLY || '50'),
  message: {
    error: 'Too many AI requests. Please try again later.',
    retryAfter: '1 hour',
  },
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: getUserKey,
  handler: (req: Request, res: Response) => {
    res.status(429).json({
      error: 'Rate limit exceeded',
      message: 'You have made too many AI requests. Please try again in an hour.',
      retryAfter: res.getHeader('Retry-After'),
    });
  },
});

/**
 * Rate limiter for AI suggestion generation
 * Limit: 20 requests per hour per user (more expensive operations)
 */
export const aiSuggestionRateLimit = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 20,
  message: {
    error: 'Too many AI suggestion requests. Please try again later.',
    retryAfter: '1 hour',
  },
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: getUserKey,
  handler: (req: Request, res: Response) => {
    res.status(429).json({
      error: 'Rate limit exceeded',
      message: 'AI suggestion generation is rate-limited. Please try again in an hour.',
      retryAfter: res.getHeader('Retry-After'),
    });
  },
});

/**
 * Rate limiter for automation rule execution
 * Limit: 100 executions per day per user
 */
export const automationRateLimit = rateLimit({
  windowMs: 24 * 60 * 60 * 1000, // 24 hours
  max: parseInt(process.env.AUTOMATION_RATE_LIMIT_DAILY || '100'),
  message: {
    error: 'Daily automation limit reached. Please try again tomorrow.',
    retryAfter: '24 hours',
  },
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: getUserKey,
  handler: (req: Request, res: Response) => {
    res.status(429).json({
      error: 'Rate limit exceeded',
      message: 'You have reached your daily automation limit. Please try again tomorrow.',
      retryAfter: res.getHeader('Retry-After'),
    });
  },
});

/**
 * General API rate limiter
 * Limit: 1000 requests per 15 minutes per user
 */
export const apiRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 1000,
  message: {
    error: 'Too many requests. Please slow down.',
    retryAfter: '15 minutes',
  },
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: getUserKey,
  skip: (req) => {
    // Skip rate limiting for health checks and static assets
    return req.path === '/health' || req.path.startsWith('/assets');
  },
});
