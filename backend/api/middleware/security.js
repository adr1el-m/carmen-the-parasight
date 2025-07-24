// backend/api/middleware/security.js
const helmet = require('helmet');

const applyHelmetMiddleware = (app) => {
    app.use(helmet({
        // Content Security Policy (CSP) configuration
        contentSecurityPolicy: {
            directives: {
                defaultSrc: ["'self'"], // Only allow resources from the same origin
                // Specific sources for styles, fonts, scripts, images, etc.
                styleSrc: ["'self'", "https://fonts.googleapis.com", "https://cdnjs.cloudflare.com", "'unsafe-inline'"], // Add 'unsafe-inline' if you have inline styles, consider moving to external files
                fontSrc: ["'self'", "https://fonts.gstatic.com", "https://cdnjs.cloudflare.com"],
                scriptSrc: ["'self'", "https://cdn.jsdelivr.net", "'unsafe-eval'", "'unsafe-inline'"], // Add 'unsafe-eval' for some frontend frameworks, 'unsafe-inline' for inline scripts (move to external files)
                imgSrc: ["'self'", "data:", "https:", "blob:"], // Allow data URIs and external images
                connectSrc: ["'self'", "https://lingaplink-ph.firebaseapp.com", "https://api.gemini.google.com", "https://firebasestorage.googleapis.com"], // Allow connections to Firebase/Gemini
                objectSrc: ["'none'"], // Prevent loading Flash, Java applets, etc.
                frameAncestors: ["'none'"], // Prevent clickjacking by disallowing embedding in iframes
                baseUri: ["'self'"], // Restrict the base URL for relative URLs
                formAction: ["'self'"], // Restrict URLs that can be used as the target of form submissions
                workerSrc: ["'self'", "blob:"], // Allow web workers from same origin and blobs
                mediaSrc: ["'self'"], // Allow media from same origin
                manifestSrc: ["'self'"] // Allow manifest from same origin
            },
            reportOnly: false, // Set to true to only report violations, not block
        },
        crossOriginEmbedderPolicy: { policy: "require-corp" }, // Opt-in to Cross-Origin Isolation
        crossOriginOpenerPolicy: { policy: "same-origin" }, // Helps isolate your document from less-secure ones
        crossOriginResourcePolicy: { policy: "same-origin" }, // Controls how resources are loaded from other origins
        hsts: {
            maxAge: 31536000, // 1 year in seconds
            includeSubDomains: true,
            preload: true
        },
        noSniff: true, // Prevents browsers from MIME-sniffing a response away from the declared content-type
        xssFilter: true, // Deprecated, but still provided for older browsers
        referrerPolicy: { policy: 'strict-origin-when-cross-origin' }, // Controls the referrer information sent with requests
        permittedCrossDomainPolicies: { policy: 'none' }, // Prevents Adobe Flash and Adobe Acrobat from loading content from your domain
        dnsPrefetchControl: { allow: false }, // Disables DNS prefetching for security
        frameguard: { action: 'deny' }, // Prevents content from being put in an iframe
        hidePoweredBy: true // Removes the X-Powered-By header
    }));
};

const applyCustomSecurityHeaders = (app) => {
    app.use((req, res, next) => {
        // Prevent browsers from opening downloaded content automatically
        res.setHeader('X-Download-Options', 'noopen');
        // Prevent cross-domain policies for old clients (e.g., Flash, Acrobat)
        res.setHeader('X-Permitted-Cross-Domain-Policies', 'none');
        // Modern Permissions Policy header for browser features
        res.setHeader('Permissions-Policy', 'geolocation=(), microphone=(), camera=(), payment=(), usb=()');

        // Cache control for API responses to ensure fresh data and prevent caching sensitive info
        if (req.path.includes('/api/')) {
            res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
            res.setHeader('Pragma', 'no-cache');
            res.setHeader('Expires', '0');
            res.setHeader('Surrogate-Control', 'no-store');
        }
        next();
    });
};

const applyRequestValidation = (app) => {
    app.use((req, res, next) => {
        const contentLength = req.headers['content-length'];
        // Limit request body size to 10MB
        if (contentLength && parseInt(contentLength) > 10485760) { // 10MB
            console.warn(`🚨 Request Entity Too Large: IP=${req.ip}, Size=${contentLength}`);
            return res.status(413).json({
                error: 'Request Entity Too Large',
                message: 'Request size exceeds maximum allowed limit'
            });
        }

        // Validate content-type for POST/PUT/PATCH requests
        if (['POST', 'PUT', 'PATCH'].includes(req.method)) {
            const contentType = req.headers['content-type'];
            if (contentType && !contentType.includes('application/json') &&
                !contentType.includes('application/x-www-form-urlencoded') &&
                !contentType.includes('multipart/form-data')) { // Allow multipart for file uploads
                console.warn(`🚨 Unsupported Media Type: IP=${req.ip}, Content-Type=${contentType}`);
                return res.status(415).json({
                    error: 'Unsupported Media Type',
                    message: 'Content type not supported'
                });
            }
        }

        // Block suspicious user agents (basic check)
        const userAgent = req.headers['user-agent'];
        const suspiciousAgents = [
            /sqlmap/i, /nikto/i, /nessus/i, /masscan/i, /nmap/i,
            /scanner/i, /burpsuite/i, /zap/i, /acunetix/i, /w3af/i // Added more common scanners
        ];
        if (userAgent && suspiciousAgents.some(pattern => pattern.test(userAgent))) {
            console.warn(`🚨 Blocked suspicious user agent: ${userAgent} from IP: ${req.ip}`);
            return res.status(403).json({
                error: 'Forbidden',
                message: 'Access denied due to suspicious activity'
            });
        }

        // Check for suspicious header discrepancies (e.g., host header manipulation)
        const suspiciousHeaders = ['x-forwarded-host', 'x-real-ip'];
        for (const header of suspiciousHeaders) {
            // Check if the header exists and if its value is different from the standard 'Host' header
            if (req.headers[header] && req.headers[header] !== req.headers.host) {
                console.warn(`🚨 Blocked request with suspicious header: ${header}=${req.headers[header]} from IP: ${req.ip}`);
                return res.status(403).json({
                    error: 'Forbidden',
                    message: 'Invalid request headers detected'
                });
            }
        }
        next();
    });
};

module.exports = {
    applyHelmetMiddleware,
    applyCustomSecurityHeaders,
    applyRequestValidation
};