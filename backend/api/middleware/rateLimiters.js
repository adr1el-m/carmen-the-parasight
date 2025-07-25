const rateLimit = require('express-rate-limit');

const generalLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, 
    max: process.env.NODE_ENV === 'production' ? 100 : 1000, 
    message: {
        error: 'Too many requests from this IP, please try again later.',
        retryAfter: 15 * 60 * 1000 
    },
    standardHeaders: true, 
    legacyHeaders: false,  
    skip: (req) => {
        return req.path === '/api/auth/csrf-token' || req.path === '/api/health';
    },
    keyGenerator: (req) => req.ip,
});

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

const lightLimiter = rateLimit({
    windowMs: 5 * 60 * 1000, 
    max: 50, 
    message: {
        error: 'Too many requests, please try again later.',
        retryAfter: 5 * 60 * 1000
    },
    standardHeaders: true,
    legacyHeaders: false,
    keyGenerator: (req) => req.ip,
});

const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 5, 
    message: {
        error: 'Too many authentication attempts. Please try again later.',
        retryAfter: 15 * 60 * 1000
    },
    standardHeaders: true,
    legacyHeaders: false,
    skipSuccessfulRequests: true, 
    keyGenerator: (req) => req.ip,
});

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