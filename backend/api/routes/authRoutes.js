// backend/api/routes/authRoutes.js
const express = require('express');
const router = express.Router();
const { authenticateUser } = require('../middleware/auth');
const { lightLimiter } = require('../middleware/rateLimiters');
const csrfProtection = require('../utils/csrfProtection');
const errorSanitizer = require('../utils/errorSanitizer');

/**
 * @route GET /api/auth/csrf-token
 * @desc Get a CSRF token for subsequent state-changing requests.
 * @access Public (though often only needed for authenticated users in SPAs)
 * @middleware authenticateUser (optional, but good practice for SPAs to link tokens to sessions)
 * @middleware lightLimiter (applied globally, but this route is usually skipped by generalLimiter)
 */
router.get('/csrf-token',
    lightLimiter, // Apply a light limiter if not skipped by generalLimiter
    authenticateUser, // Ensure user is authenticated to associate token with session
    async (req, res) => {
        try {
            // Generate a CSRF token
            const tokenResponse = csrfProtection.generateTokenResponse(req, res);

            res.json({
                success: true,
                ...tokenResponse,
                message: 'CSRF token generated successfully.',
                instructions: {
                    header: `Include token in '${tokenResponse.headerName}' header for all state-changing requests (POST, PUT, DELETE, PATCH)`,
                    cookie: `Token also set as '${tokenResponse.cookieName}_secret' cookie (httpOnly, Secure, SameSite=Lax)`,
                    expiry: 'Token expires in 1 hour and should be refreshed as needed'
                }
            });

        } catch (error) {
            const sanitized = errorSanitizer.sanitizeError(error, { context: 'csrf-token-generation' });
            res.status(500).json({
                error: 'Failed to generate CSRF token',
                ...sanitized
            });
        }
    }
);

/**
 * @route POST /api/auth/csrf-token/refresh
 * @desc Refresh an expired or nearing-expiration CSRF token.
 * @access Private (Authenticated Users)
 * @middleware authenticateUser
 * @middleware strictLimiter (to prevent abuse of refresh endpoint)
 */
router.post('/csrf-token/refresh',
    strictLimiter, // Use strict limiter for refresh, as it's a token generation endpoint
    authenticateUser,
    async (req, res) => {
        try {
            // Check if current token should be rotated (e.g., based on expiry, or simply to always provide new)
            const currentToken = req.headers[csrfProtection.CSRF_CONFIG.HEADER_NAME.toLowerCase()] || req.body?._csrf;
            const shouldRotate = csrfProtection.shouldRotateToken(currentToken);

            if (!shouldRotate) {
                return res.json({
                    success: true,
                    message: 'Current CSRF token is still valid and does not require rotation.',
                    shouldRefresh: false
                });
            }

            // Generate new token
            const tokenResponse = csrfProtection.generateTokenResponse(req, res);

            res.json({
                success: true,
                ...tokenResponse,
                message: 'CSRF token refreshed successfully.',
                rotated: true
            });

        } catch (error) {
            const sanitized = errorSanitizer.sanitizeError(error, { context: 'csrf-token-refresh' });
            res.status(500).json({
                error: 'Failed to refresh CSRF token',
                ...sanitized
            });
        }
    }
);

module.exports = router;