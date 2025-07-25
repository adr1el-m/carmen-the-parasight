const cors = require('cors');
require('dotenv').config({ path: '../.env' }); 
const corsMiddleware = cors({
    origin: function (origin, callback) {
        if (!origin) return callback(null, true);

        const allowedOrigins = process.env.NODE_ENV === 'production'
            ? [
                process.env.CORS_ORIGIN || 'https://your-vercel-domain.vercel.app', 
                'https://lingaplink.vercel.app',
                'https://carmen-para-sight.vercel.app',
            ]
            : [
                'http://localhost:5173', // Frontend dev server (Vite/React default)
                'http://localhost:3000', // Common frontend dev server (Create-React-App, Next.js)
                'http://localhost:3001', // Backend dev server (if running on a different port than frontend)
                'http://localhost:8080', // Another common dev port
                'http://127.0.0.1:5173',
                'http://127.0.0.1:3000',
                // Add any other local dev origins here
            ];

        if (allowedOrigins.includes(origin) || process.env.NODE_ENV !== 'production') {
            // In development, also allow for flexibility (e.g., during testing with IP addresses)
            if (process.env.NODE_ENV !== 'production' && !allowedOrigins.includes(origin)) {
                console.warn(`⚠️ Development CORS bypass for origin: ${origin}. Not allowed in production.`);
            }
            callback(null, true);
        } else {
            console.warn(`❌ CORS: Origin '${origin}' not allowed.`);
            callback(new Error(`Not allowed by CORS for origin: ${origin}`));
        }
    },
    credentials: true, // Allow cookies to be sent with cross-origin requests
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'], // Allowed HTTP methods
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept', 'Origin', 'X-CSRF-Token'], // Allowed request headers
    exposedHeaders: ['X-Total-Count', 'X-Page-Count', 'X-RateLimit-Limit', 'X-RateLimit-Remaining', 'X-RateLimit-Reset', 'Retry-After'], // Headers accessible to the client
    maxAge: 86400 // Cache preflight requests for 24 hours
});

module.exports = corsMiddleware;