// backend/api/utils/csrfProtection.js
const csrf = require('csrf');
const Tokens = new csrf();
const errorSanitizer = require('./errorSanitizer'); // Import your error sanitizer

// Default CSRF configuration
let CSRF_CONFIG = {
    HEADER_NAME: 'X-CSRF-Token',
    COOKIE_NAME: '_csrf',
    skipMethods: ['GET', 'HEAD', 'OPTIONS'], // Methods to skip CSRF check
    skipRoutes: [], // Routes to skip CSRF check
    errorHandler: null, // Placeholder for the actual error handler
    sessionIdExtractor: (req) => req.user?.uid || req.sessionID || `anonymous_${req.ip}`
};

const configureCSRFProtection = (options = {}) => {
    CSRF_CONFIG = { ...CSRF_CONFIG, ...options };
    if (!CSRF_CONFIG.errorHandler) {
        CSRF_CONFIG.errorHandler = csrfErrorHandler; // Set default if not provided
    }
};

const csrfMiddleware = (options = {}) => {
    configureCSRFProtection(options); // Apply passed options

    return async (req, res, next) => {
        // Skip check for configured methods and routes
        if (CSRF_CONFIG.skipMethods.includes(req.method) ||
            CSRF_CONFIG.skipRoutes.some(route => req.path.startsWith(route))) {
            return next();
        }

        const secretCookieName = CSRF_CONFIG.COOKIE_NAME + '_secret';
        const secret = req.cookies[secretCookieName];
        const token = req.headers[CSRF_CONFIG.HEADER_NAME.toLowerCase()] || req.body?._csrf;

        if (!secret || !token || !Tokens.verify(secret, token)) {
            const csrfError = new Error('Invalid CSRF token');
            csrfError.code = 'CSRF_INVALID_TOKEN';
            csrfError.status = 403;
            return CSRF_CONFIG.errorHandler(csrfError, req, res, next);
        }

        // If valid, ensure the secret cookie is re-sent or refreshed
        res.cookie(secretCookieName, secret, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'Lax', // Adjust as per your security needs ('Strict' for stronger protection)
            maxAge: 3600000 // 1 hour
        });
        next();
    };
};

const generateTokenResponse = (req, res) => {
    const secret = Tokens.secretSync();
    const token = Tokens.create(secret);

    const secretCookieName = CSRF_CONFIG.COOKIE_NAME + '_secret';
    res.cookie(secretCookieName, secret, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'Lax',
        maxAge: 3600000 // 1 hour
    });

    return {
        csrfToken: token,
        headerName: CSRF_CONFIG.HEADER_NAME,
        cookieName: CSRF_CONFIG.COOKIE_NAME,
        message: 'CSRF token generated. Use it in ' + CSRF_CONFIG.HEADER_NAME + ' header.'
    };
};

const cleanupSession = (req, res) => {
    // On user logout or session termination, clear the CSRF secret cookie
    if (res && CSRF_CONFIG.COOKIE_NAME + '_secret' in res._headers) {
        res.clearCookie(CSRF_CONFIG.COOKIE_NAME + '_secret');
    }
};

const shouldRotateToken = (currentToken) => {
    // This can be extended based on token age, usage, etc.
    // For simplicity, always rotate if a token is present, forcing a new one on refresh.
    return !!currentToken;
};

// Define the CSRF error handler
const csrfErrorHandler = (err, req, res, next) => {
    if (err.code && err.code.startsWith('CSRF_')) {
        const sanitized = errorSanitizer.sanitizeError(err, {
            context: 'csrf-protection-error',
            code: err.code
        });
        return res.status(err.status || 403).json({
            error: 'CSRF protection error',
            message: sanitized.message, // Use sanitized message
            code: err.code,
            timestamp: sanitized.timestamp
        });
    }
    next(err);
};

console.log('✅ CSRF protection module initialized.');

module.exports = {
    csrfMiddleware,
    generateTokenResponse,
    cleanupSession,
    shouldRotateToken,
    configureCSRFProtection,
    CSRF_CONFIG // Export for external access to config details
};