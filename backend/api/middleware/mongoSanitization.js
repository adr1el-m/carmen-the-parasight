// backend/api/middleware/mongoSanitization.js
const mongoSanitize = require('express-mongo-sanitize');

const applyMongoSanitization = (app) => {
    // This middleware removes any keys from req.body, req.params, and req.query that start with '$' or contain '.'
    // (which could be used for MongoDB operator injection).
    app.use(mongoSanitize({
        onSanitize: ({ req, key }) => {
            console.warn(`🚨 MongoSanitize: Removed '${key}' from request to prevent injection.`);
        }
    }));
};

module.exports = { applyMongoSanitization };