import { rateLimit } from "express-rate-limit";
import status from "http-status";

// Global limiter: general traffic limiter
const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  limit: 100, // Limit each IP to 100 requests per window
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    res.status(status.TOO_MANY_REQUESTS).json({
      success: false,
      message:
        "Too many requests from this IP, please try again after 15 minutes",
      data: null,
    });
  },
});

// Auth limiter: strict limiter for login/register/reset password
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  limit: 15, // Limit each IP to 15 attempts per window
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    res.status(status.TOO_MANY_REQUESTS).json({
      success: false,
      message:
        "Too many authentication attempts, please try again after 15 minutes",
      data: null,
    });
  },
});

// AI Generation limiter: prevent overloading the AI service APIs
const generationLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  limit: 5, // Limit each IP to 5 generation requests per minute
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    res.status(status.TOO_MANY_REQUESTS).json({
      success: false,
      message:
        "Too many generation requests. Please wait a moment before trying again.",
      data: null,
    });
  },
});

export const rateLimiters = {
  globalLimiter,
  authLimiter,
  generationLimiter,
};
