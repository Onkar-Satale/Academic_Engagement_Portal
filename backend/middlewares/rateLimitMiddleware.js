import rateLimit from "express-rate-limit";

// Rate limiter for sensitive auth endpoints (login, register)
export const authRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 30, // 30 requests per IP per window
  standardHeaders: true, 
  legacyHeaders: false, 
  message: {
    success: false,
    message: "Too many authentication attempts from this IP, please try again after 15 minutes",
  },
});

// General rate limiter for all API endpoints
export const apiRateLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 200, // 200 requests per IP per minute
  standardHeaders: true, 
  legacyHeaders: false, 
  message: {
    success: false,
    message: "Too many requests from this IP, please try again after a minute",
  },
});

export const rateLimitMiddleware = apiRateLimiter;
export default apiRateLimiter;
