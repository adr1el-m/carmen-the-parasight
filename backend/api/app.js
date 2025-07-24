// backend/api/app.js
const express = require('express');
const corsMiddleware = require('./middleware/cors');
const { applyHelmetMiddleware, applyCustomSecurityHeaders, applyRequestValidation } = require('./middleware/security');
const { applyRequestLogging, applySuspiciousActivityLogging } = require('./middleware/logging');
const { generalLimiter, lightLimiter } = require('./middleware/rateLimiters');
const { applyBodyParser } = require('./middleware/bodyParser');
const { applyMongoSanitization } = require('./middleware/mongoSanitization');
const { applyHttpsRedirect } = require('./middleware/httpsRedirect');
const cookieParser = require('cookie-parser');
const csrfProtection = require('./utils/csrfProtection'); // Your CSRF utility
const errorSanitizer = require('./utils/errorSanitizer'); // Your error sanitizer utility

// Ensure environment variables are loaded for configuration files
require('dotenv').config({ path: './.env' }); // Adjusted path to backend/.env

// Import Route Modules
const authRoutes = require('./routes/authRoutes');
const dashboardRoutes = require('./routes/dashboardRoutes');
const orOptimizationRoutes = require('./routes/orOptimizationRoutes');
const telemedicineRoutes = require('./routes/telemedicineRoutes');
const aiConsultationRoutes = require('./routes/aiConsultationRoutes');
const patientRoutes = require('./routes/patientRoutes');
const analyticsRoutes = require('./routes/analyticsRoutes');

const app = express();

// === Core Middleware Application Order (Crucial for Security and Functionality) ===

// 1. Request Logging & Suspicious Activity Logging (should be very early to capture all requests)
applyRequestLogging(app);
applySuspiciousActivityLogging(app);

// 2. Security Headers (Helmet, custom headers)
applyHelmetMiddleware(app);
applyCustomSecurityHeaders(app);

// 3. CORS (needs to be early to handle preflight OPTIONS requests)
app.use(corsMiddleware);

// 4. HTTPS Redirect (if in production)
applyHttpsRedirect(app);

// 5. Request Validation (initial checks like size, content-type, user-agent)
applyRequestValidation(app);

// 6. Rate Limiting (General API limiter - more specific limiters apply on individual routes)
// Apply general limiter to all /api/ routes by default. Individual routes can have stricter ones.
app.use('/api/', generalLimiter);

// 7. Cookie Parser (required for CSRF token handling and other cookie-based features)
app.use(cookieParser());

// 8. Body Parsers (for JSON and URL-encoded data)
applyBodyParser(app);

// 9. MongoDB Sanitization (very important to apply BEFORE any route logic that interacts with a MongoDB)
applyMongoSanitization(app);

// 10. CSRF Protection (applied to state-changing methods unless explicitly skipped)
// Configure CSRF protection with custom settings for the application
const csrfOptions = {
    errorHandler: csrfProtection.csrfErrorHandler, // Use the error handler defined in csrfProtection
    // Routes where CSRF check should be explicitly skipped (e.g., GET endpoints that fetch tokens)
    skipRoutes: [
        '/api/auth/csrf-token', // This is a GET endpoint to retrieve the token
        '/api/health',          // Health check, public and stateless
        // Add other GET routes here that don't need CSRF protection
    ],
    // Methods to skip the CSRF check (default GET, HEAD, OPTIONS are usually safe)
    skipMethods: ['GET', 'HEAD', 'OPTIONS'],
    sessionIdExtractor: (req) => req.user?.uid || req.sessionID || `anonymous_${req.ip}`
};
csrfProtection.configureCSRFProtection(csrfOptions); // Apply options to the CSRF utility
app.use(csrfProtection.csrfMiddleware(csrfOptions)); // Apply the CSRF middleware
console.log('✅ CSRF protection enabled for state-changing operations.');


// === API Routes ===
// Mount route modules under their respective base paths.
// The order here matters for route matching (more specific routes before more general ones if paths overlap)
app.use('/api/auth', authRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/or', orOptimizationRoutes); // Handles /or/status, /or/optimize, /surgery/queue etc.
app.use('/api/telemedicine', telemedicineRoutes);
app.use('/api/ai', aiConsultationRoutes);
app.use('/api/patient', patientRoutes); // Handles /patient/:id and /patient (POST)
app.use('/api/analytics', analyticsRoutes);

// === Public/Health Check Routes (often have lighter rate limits or no auth) ===

// Health check endpoint (no auth required) - Uses light limiter
app.get('/api/health', lightLimiter, (req, res) => {
    res.json({
        status: 'OK',
        message: 'LingapLink PH API is running successfully',
        timestamp: new Date().toISOString(),
        version: process.env.npm_package_version || '1.0.0', // Get version from package.json
        environment: process.env.NODE_ENV || 'development'
    });
});

// Root endpoint (optional, just for basic access check) - Uses light limiter
app.get('/', lightLimiter, (req, res) => {
    res.status(200).json({
        message: 'Welcome to LingapLink PH Backend API!',
        apiVersion: process.env.npm_package_version || '1.0.0',
        docs: '/api/docs' // Placeholder for future API documentation endpoint
    });
});


// === Error Handling Middleware (MUST BE LAST) ===

// 404 Not Found Handler for unmatched routes
app.use('*', (req, res) => {
    res.status(404).json({
        error: 'API endpoint not found',
        message: `The requested endpoint '${req.originalUrl}' with method '${req.method}' does not exist or is not supported.`,
        path: req.originalUrl,
        method: req.method,
        timestamp: new Date().toISOString()
    });
});

// Comprehensive Global Error Handling Middleware (captures all errors passed via next(err))
// This must be the absolute last middleware in the chain.
app.use(errorSanitizer.secureErrorHandler);

module.exports = app;