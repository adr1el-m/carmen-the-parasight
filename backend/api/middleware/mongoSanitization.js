const mongoSanitize = require('express-mongo-sanitize');

const applyMongoSanitization = (app) => {
    app.use(mongoSanitize({
        onSanitize: ({ req, key }) => {
            console.warn(`🚨 MongoSanitize: Removed '${key}' from request to prevent injection.`);
        }
    }));
};

module.exports = { applyMongoSanitization };