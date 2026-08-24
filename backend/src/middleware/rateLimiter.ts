import rateLimit from "express-rate-limit";

const isDev = process.env.NODE_ENV === "development";

/**
 * General API rate limiter: 100 requests per 15 minutes per IP.
 */
export const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: isDev ? 10000 : 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Too many requests, please try again later" },
});

/**
 * Strict limiter for auth endpoints: 10 requests per 15 minutes per IP.
 * Protects login, registration, verification from brute-force.
 */
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: isDev ? 1000 : 50,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Too many authentication attempts, please try again later" },
});

/**
 * Public endpoints (QR scan, registration): 20 requests per 15 minutes.
 */
export const publicLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: isDev ? 1000 : 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Rate limit exceeded, please try again later" },
});
