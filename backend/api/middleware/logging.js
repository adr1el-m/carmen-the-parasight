// backend/api/middleware/logging.js
const morgan = require('morgan');

const applyRequestLogging = (app) => {
    // 'combined' for standard Apache combined log output (common in production)
    // 'dev' for concise, color-coded output (good for development)
    app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev'));
};

const applySuspiciousActivityLogging = (app) => {
    app.use((req, res, next) => {
        // Regex patterns for common attack types
        const suspiciousPatterns = [
            /(union|select|insert|delete|drop|update|exec|script|xp_cmdshell)/i, // SQL injection
            /(<script|javascript:|on\w+\s*=|vbscript:|eval\()/i, // XSS (basic)
            /(\.\.\/|\.\.\\|%2e%2e%2f|%2e%2e\\)/i, // Path traversal
            /(;|&&|\|\||\`)/, // Command injection
            /(\${|\{\{)/ // Template injection
        ];

        // Helper function to recursively check objects/strings for patterns
        const checkForSuspiciousContent = (obj, path = '') => {
            if (typeof obj === 'string') {
                for (const pattern of suspiciousPatterns) {
                    if (pattern.test(obj)) {
                        console.warn(`🚨 Suspicious content detected at ${path}: "${obj.substring(0, 100)}..." from IP: ${req.ip}, URL: ${req.originalUrl}`);
                        return true;
                    }
                }
            } else if (typeof obj === 'object' && obj !== null) {
                // Prevent deep recursion on very large/circular objects
                if (path.split('.').length > 10) return false; // Max depth to check

                for (const [key, value] of Object.entries(obj)) {
                    if (checkForSuspiciousContent(value, `${path}.${key}`)) {
                        return true;
                    }
                }
            }
            return false;
        };

        // Check query parameters
        if (Object.keys(req.query).length > 0 && checkForSuspiciousContent(req.query, 'query')) {
            // Logged inside checkForSuspiciousContent
        }
        // Check request body (if parsed)
        if (req.body && Object.keys(req.body).length > 0 && checkForSuspiciousContent(req.body, 'body')) {
            // Logged inside checkForSuspiciousContent
        }
        // Check headers
        const suspiciousHeaderValue = Object.entries(req.headers).find(([key, value]) => {
            return typeof value === 'string' && suspiciousPatterns.some(pattern => pattern.test(value));
        });
        if (suspiciousHeaderValue) {
            console.warn(`🚨 Suspicious header detected: ${suspiciousHeaderValue[0]}="${suspiciousHeaderValue[1].substring(0, 100)}..." from IP: ${req.ip}`);
        }
        next();
    });
};

module.exports = {
    applyRequestLogging,
    applySuspiciousActivityLogging
};