import rateLimit from 'express-rate-limit';
import type { Request, Response } from 'express';

// Helper to generate key based on authenticated user (if present) or IP address
const keyGenerator = (req: Request): string => {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    return `user-${authHeader.slice(7, 25)}-${req.ip || 'unknown'}`;
  }
  return req.ip || 'unknown-ip';
};

// Standardized 429 handler returning proper JSON and headers
const handler = (req: Request, res: Response) => {
  res.status(429).json({
    error: 'Too Many Requests',
    message: 'Rate limit exceeded. Please try again later.',
    retryAfter: res.getHeader('Retry-After') || 60
  });
};

// Auth limiter (stricter limit for login/signup/onboarding)
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator,
  handler,
  skip: (req) => req.path === '/api/health' || req.path === '/api/ready'
});

// Search & Third-party Proxy limiter
export const searchLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 40,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator,
  handler,
  skip: (req) => req.path === '/api/health'
});

// Messaging & Room chat limiter
export const chatLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator,
  handler,
  skip: (req) => req.path === '/api/health'
});

// General API limiter
export const generalLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 200,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator,
  handler,
  skip: (req) => req.path === '/api/health' || req.path === '/api/metrics' || req.path === '/api/ready'
});
