import { Request, Response, NextFunction } from 'express';

/**
 * Middleware to handle domain redirects and ensure canonical domain usage
 */
export function domainRedirectMiddleware(req: Request, res: Response, next: NextFunction) {
  // In production, redirect all non-canonical domains to bluetradie.com
  if (process.env.NODE_ENV === 'production') {
    const host = req.get('host');
    const protocol = req.get('x-forwarded-proto') || req.protocol;
    
    // Define canonical domain
    const canonicalDomain = 'bluetradie.com';
    
    // Redirect if not using canonical domain
    if (host && host !== canonicalDomain && host !== `www.${canonicalDomain}`) {
      const redirectUrl = `https://${canonicalDomain}${req.originalUrl}`;
      return res.redirect(301, redirectUrl);
    }
    
    // Redirect www to non-www
    if (host === `www.${canonicalDomain}`) {
      const redirectUrl = `https://${canonicalDomain}${req.originalUrl}`;
      return res.redirect(301, redirectUrl);
    }
    
    // Force HTTPS in production
    if (protocol !== 'https') {
      const redirectUrl = `https://${host}${req.originalUrl}`;
      return res.redirect(301, redirectUrl);
    }
  }
  
  next();
}

/**
 * Get the base URL for the current environment
 */
export function getBaseUrl(req?: Request): string {
  if (process.env.NODE_ENV === 'production') {
    return 'https://bluetradie.com';
  }
  
  if (req) {
    const protocol = req.get('x-forwarded-proto') || req.protocol;
    const host = req.get('host');
    return `${protocol}://${host}`;
  }
  
  return 'http://localhost:5000';
}