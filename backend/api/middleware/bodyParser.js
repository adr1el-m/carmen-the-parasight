// backend/api/middleware/bodyParser.js
const express = require('express');

const applyBodyParser = (app) => {
    // Parses incoming JSON requests.
    app.use(express.json({
        limit: '10mb', // Limit JSON body size
        strict: true // Only allow arrays and objects
    }));
    // Parses incoming URL-encoded requests (for form data).
    app.use(express.urlencoded({
        extended: true, // Use qs library for rich objects and arrays
        limit: '10mb' // Limit URL-encoded body size
    }));
};

module.exports = { applyBodyParser };