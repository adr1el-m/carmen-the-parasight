// backend/api/middleware/validation.js
const { validationResult } = require('express-validator');
const errorSanitizer = require('../utils/errorSanitizer');

const validateInput = (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        const sanitizedResponse = errorSanitizer.sanitizeValidationErrors(errors.array());
        return res.status(400).json(sanitizedResponse);
    }
    next();
};

module.exports = { validateInput };