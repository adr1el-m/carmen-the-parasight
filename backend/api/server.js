const app = require('./app'); 
require('dotenv').config({ path: './.env' }); 

const port = process.env.PORT || 3001; 

const shutdown = () => {
    console.log('\nShutting down server gracefully...');
    process.exit(0);
};

process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);  
process.on('unhandledRejection', (reason, promise) => {
    console.error('🚨 Unhandled Rejection at:', promise, 'reason:', reason);
    if (process.env.NODE_ENV === 'production') {
        setTimeout(() => {
            process.exit(1);
        }, 1000); 
    }
});
process.on('uncaughtException', (error) => {
    console.error('🚨 Uncaught Exception:', error);
    if (process.env.NODE_ENV === 'production') {
        setTimeout(() => {
            process.exit(1);
        }, 1000);
    }
});

const server = app.listen(port, () => {
    console.log(`🚀 LingapLink PH API server running on http://localhost:${port}`);
    console.log(`🔒 Security features enabled`);
    console.log(`📊 Environment: ${process.env.NODE_ENV || 'development'}`);
});

server.on('close', () => {
    console.log('Server closed.');
});

module.exports = server;