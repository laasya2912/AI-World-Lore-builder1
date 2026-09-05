import type { NextFunction, Request, Response } from 'express';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';

/**
 * Standard secure-headers middleware (X-Content-Type-Options, HSTS,
 * X-Frame-Options, etc). CSP is left to the hosting layer / reverse proxy
 * since the Vite dev middleware injects its own inline dev scripts.
 */
export const securityHeaders = helmet({
  contentSecurityPolicy: false,
});

/** General API rate limit: generous enough for normal UI polling/editing. */
export const apiRateLimiter = rateLimit({
  windowMs: 60 * 1000,
  limit: 120,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many requests. Please slow down and try again shortly.' },
});

/**
 * Stricter limit for routes that call out to the Gemini API. These are far
 * more expensive (latency + quota + cost) than plain CRUD, so they get their
 * own tighter budget to protect against runaway loops or abuse.
 */
export const aiRateLimiter = rateLimit({
  windowMs: 60 * 1000,
  limit: 15,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many AI-backed requests. Please wait a moment before generating more content.' },
});

/**
 * Optional bearer-token gate for mutating routes.
 *
 * Disabled unless APP_API_KEY is set (see .env.example), so the app keeps
 * working out-of-the-box for local development and grading/demo use. Setting
 * APP_API_KEY in production locks down every write route (POST/PUT/DELETE)
 * behind `Authorization: Bearer <key>` with no code changes required.
 */
export function requireApiKey(req: Request, res: Response, next: NextFunction) {
  const configuredKey = process.env.APP_API_KEY;
  if (!configuredKey) return next();

  const header = req.headers['authorization'];
  const token = typeof header === 'string' && header.startsWith('Bearer ') ? header.slice(7) : undefined;

  if (!token || token !== configuredKey) {
    return res.status(401).json({ error: 'Unauthorized: missing or invalid API key' });
  }
  next();
}
