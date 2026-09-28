import rateLimit from 'express-rate-limit';
import { ENV } from '../config/env';

/**
 * Global rate limiter across general API endpoints to prevent DoS attacks.
 */
export const globalRateLimiter = rateLimit({
  windowMs: ENV.RATE_LIMIT_WINDOW_MS,
  max: ENV.RATE_LIMIT_MAX,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    error: {
      message: 'Too many requests from this IP. Please try again later.',
      statusCode: 429,
    },
  },
});

/**
 * Strict rate limiter for sensitive authentication endpoints (login, register)
 * to prevent automated credential stuffing and brute-force attacks.
 */
export const authRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: ENV.AUTH_RATE_LIMIT_MAX,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    error: {
      message: 'Too many authentication attempts. Please try again after 15 minutes.',
      statusCode: 429,
    },
  },
});
