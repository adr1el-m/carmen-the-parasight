// backend/api/server.js
const app = require('./app'); // Import the configured Express app
require('dotenv').config({ path: './.env' }); // Load environment variables for the server port

const port = process.env.PORT || 3001; // Default to 3001 if PORT is not set

// Graceful shutdown procedures
const shutdown = () => {
    console.log('\nShutting down server gracefully...');
    // Add any cleanup logic here, e.g., close database connections
    // db.close() if not using serverless functions where connections are managed per invocation.
    process.exit(0);
};

// Listen for termination signals
process.on('SIGTERM', shutdown); // kill (terminate)
process.on('SIGINT', shutdown);  // Ctrl+C in terminal
process.on('unhandledRejection', (reason, promise) => {
    console.error('🚨 Unhandled Rejection at:', promise, 'reason:', reason);
    // Application specific error handling can go here.
    // In production, consider crashing process to let process manager restart it.
    if (process.env.NODE_ENV === 'production') {
        setTimeout(() => {
            process.exit(1);
        }, 1000); // Give time for logs to write
    }
});
process.on('uncaughtException', (error) => {
    console.error('🚨 Uncaught Exception:', error);
    // Log the error, then exit process
    if (process.env.NODE_ENV === 'production') {
        setTimeout(() => {
            process.exit(1);
        }, 1000);
    }
});


// Start the server
// In production environments like Vercel, this app.listen() is often not needed
// as the serverless function handler directly invokes the exported 'app'.
// We keep it for local development and traditional server deployments.
const server = app.listen(port, () => {
    console.log(`🚀 LingapLink PH API server running on http://localhost:${port}`);
    console.log(`🔒 Security features enabled`);
    console.log(`📊 Environment: ${process.env.NODE_ENV || 'development'}`);
});

// Optional: Handle server close events
server.on('close', () => {
    console.log('Server closed.');
});

// Export the server for potential external use (e.g., testing frameworks)
module.exports = server;