// backend/api/middleware/rateLimiters.js
const rateLimit = require('express-rate-limit');

// General limiter for most API routes
const generalLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: process.env.NODE_ENV === 'production' ? 100 : 1000, // 100 requests per 15 mins in prod, more in dev
    message: {
        error: 'Too many requests from this IP, please try again later.',
        retryAfter: 15 * 60 * 1000 // In milliseconds
    },
    standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
    legacyHeaders: false,  // Disable the `X-RateLimit-*` headers
    skip: (req) => {
        // Explicitly skip endpoints that have their own specific limiters or are publicly accessible
        return req.path === '/api/auth/csrf-token' || req.path === '/api/health';
    },
    keyGenerator: (req) => req.ip, // Use IP address for rate limiting
});

// Strict limiter for sensitive operations (AI, optimization, authentication attempts)
const strictLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 10, // 10 requests per 15 minutes
    message: {
        error: 'Too many requests to this endpoint, please try again later.',
        retryAfter: 15 * 60 * 1000
    },
    standardHeaders: true,
    legacyHeaders: false,
    keyGenerator: (req) => req.ip,
});

// Medium security limiter for dashboard and analytics
const mediumLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 30, // 30 requests per 15 minutes
    message: {
        error: 'Rate limit exceeded for this endpoint. Please try again later.',
        retryAfter: 15 * 60 * 1000
    },
    standardHeaders: true,
    legacyHeaders: false,
    keyGenerator: (req) => req.ip,
});

// Light limiter for health checks and public endpoints
const lightLimiter = rateLimit({
    windowMs: 5 * 60 * 1000, // 5 minutes
    max: 50, // 50 requests per 5 minutes
    message: {
        error: 'Too many requests, please try again later.',
        retryAfter: 5 * 60 * 1000
    },
    standardHeaders: true,
    legacyHeaders: false,
    keyGenerator: (req) => req.ip,
});

// Authentication limiter for login/register endpoints to prevent brute-force
const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 5, // 5 attempts per 15 minutes
    message: {
        error: 'Too many authentication attempts. Please try again later.',
        retryAfter: 15 * 60 * 1000
    },
    standardHeaders: true,
    legacyHeaders: false,
    skipSuccessfulRequests: true, // Do not count successful login attempts against the limit
    keyGenerator: (req) => req.ip,
});

// Data modification limiter for POST/PUT/DELETE operations
const modificationLimiter = rateLimit({
    windowMs: 10 * 60 * 1000, // 10 minutes
    max: 20, // 20 requests per 10 minutes
    message: {
        error: 'Too many data modification requests. Please try again later.',
        retryAfter: 10 * 60 * 1000
    },
    standardHeaders: true,
    legacyHeaders: false,
    keyGenerator: (req) => req.ip,
});

module.exports = {
    generalLimiter,
    strictLimiter,
    mediumLimiter,
    lightLimiter,
    authLimiter,
    modificationLimiter
};