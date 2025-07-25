const sanitizeError = (error, context = {}) => {
    console.error(`[Sanitized Error] Context: ${context.context || 'unknown'}, Message: ${error.message}, Stack: ${error.stack}`);

    const isDev = process.env.NODE_ENV === 'development';
    const errorMessage = isDev ? error.message : 'An internal server error occurred. Please try again later.';
    const errorDetails = isDev ? { stack: error.stack, code: error.code } : undefined;

    return {
        error: 'An error occurred',
        message: errorMessage,
        details: errorDetails,
        timestamp: new Date().toISOString()
    };
};

const sanitizeValidationErrors = (errors) => {
    // Customize how validation errors are presented to avoid leaking sensitive info
    const formattedErrors = errors.map(err => ({
        param: err.param,
        message: err.msg,
        // value: err.value, // Do NOT expose raw input values in production!
        location: err.location
    }));
    return {
        error: 'Invalid input data',
        details: formattedErrors,
        timestamp: new Date().toISOString()
    };
};

const secureErrorHandler = (err, req, res, next) => {
    if (res.headersSent) {
        return next(err); // Delegate to default error handler if headers already sent
    }

    // Log the full error internally
    console.error('🚨 Global Error Handler Triggered:');
    console.error(`Path: ${req.path}, Method: ${req.method}, IP: ${req.ip}`);
    console.error(err);

    // Determine status code
    const statusCode = err.status || err.statusCode || 500;

    // Sanitize error for public consumption
    const sanitizedResponse = sanitizeError(err, { context: 'global-error' });

    res.status(statusCode).json(sanitizedResponse);
};

module.exports = {
    sanitizeError,
    sanitizeValidationErrors,
    secureErrorHandler
};