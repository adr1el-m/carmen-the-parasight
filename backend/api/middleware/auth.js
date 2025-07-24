// backend/api/middleware/auth.js
const jwt = require('jsonwebtoken'); // Only if you need a non-Firebase JWT fallback
const { getFirebaseAuth } = require('../config/firebase'); // Import the getter

const authenticateUser = async (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;

        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({
                error: 'Unauthorized',
                message: 'No valid authorization token provided'
            });
        }

        const token = authHeader.split(' ')[1];
        const adminAuth = getFirebaseAuth(); // Get the initialized Firebase Auth instance

        if (adminAuth) {
            const decodedToken = await adminAuth.verifyIdToken(token);
            req.user = decodedToken; // Firebase token payload
            // For custom claims (roles), they are often in decodedToken.custom_claims
            if (decodedToken.custom_claims) {
                req.user.role = decodedToken.custom_claims.role;
            }
        } else {
            // Fallback JWT verification for development/testing if Firebase Admin is not set up
            // WARNING: process.env.JWT_SECRET must be a strong, unique secret in production!
            const decoded = jwt.verify(token, process.env.JWT_SECRET || 'super-insecure-fallback-jwt-secret');
            req.user = decoded; // Mocked or fallback JWT payload
            console.warn('⚠️ Using fallback JWT verification. Ensure Firebase Admin SDK is configured in production.');
        }

        next();
    } catch (error) {
        console.error('Authentication error:', error.message); // Log specific error message
        res.status(401).json({
            error: 'Unauthorized',
            message: 'Invalid or expired token',
            details: process.env.NODE_ENV === 'development' ? error.message : undefined // Show details in dev
        });
    }
};

const optionalAuth = async (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;
        const adminAuth = getFirebaseAuth();

        if (authHeader && authHeader.startsWith('Bearer ')) {
            const token = authHeader.split(' ')[1];

            if (adminAuth) {
                const decodedToken = await adminAuth.verifyIdToken(token);
                req.user = decodedToken;
                if (decodedToken.custom_claims) {
                    req.user.role = decodedToken.custom_claims.role;
                }
            } else {
                const decoded = jwt.verify(token, process.env.JWT_SECRET || 'super-insecure-fallback-jwt-secret');
                req.user = decoded;
            }
        }
        next(); // Always call next, even if authentication fails
    } catch (error) {
        // If optional auth fails, just continue without req.user
        console.warn('Optional authentication failed, proceeding without user context:', error.message);
        next();
    }
};

const requireRole = (roles) => {
    return (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({
                error: 'Unauthorized',
                message: 'Authentication required for this resource'
            });
        }

        // Check req.user.role (standard or custom claim)
        const userRole = req.user.role || req.user.custom_claims?.role;
        if (!roles.includes(userRole)) {
            return res.status(403).json({
                error: 'Forbidden',
                message: `Insufficient permissions. Required roles: ${roles.join(', ')}`
            });
        }
        next();
    };
};

module.exports = {
    authenticateUser,
    optionalAuth,
    requireRole
};