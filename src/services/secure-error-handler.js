/**
 * FRONTEND SECURE ERROR HANDLER
 * 
 * Provides secure error handling for frontend components to prevent
 * information leakage in client-side error messages.
 */

import errorSanitizer from '../utils/error-sanitizer.js';

/**
 * Secure error handler for frontend operations
 * @param {Error|Object|string} error - The error to handle
 * @param {Object} options - Configuration options
 * @returns {Object} Safe error response for frontend display
 */
export function handleSecureError(error, options = {}) {
    const {
        showToUser = true,
        context = 'frontend',
        fallbackMessage = 'An error occurred. Please try again.',
        logError = true
    } = options;
    
    // Log error for debugging if enabled
    if (logError) {
        errorSanitizer.secureErrorLog(context, error);
    }
    
    // Sanitize error for client display
    const sanitized = errorSanitizer.sanitizeError(error, {
        context,
        includeCode: false, // Never include error codes in frontend
        includeDetails: false, // Never include technical details
        logOriginal: logError
    });
    
    return {
        message: sanitized.error || fallbackMessage,
        timestamp: sanitized.timestamp,
        shouldDisplay: showToUser
    };
}

/**
 * Handle Firebase/Auth specific errors with user-friendly messages
 * @param {Error} error - Firebase error object
 * @param {Object} options - Configuration options
 * @returns {Object} User-friendly error response
 */
export function handleAuthError(error, options = {}) {
    const {
        context = 'authentication',
        showDetails = false
    } = options;
    
    // Map of Firebase error codes to user-friendly messages
    const authErrorMessages = {
        'auth/user-not-found': 'Invalid login credentials',
        'auth/wrong-password': 'Invalid login credentials',
        'auth/invalid-email': 'Please enter a valid email address',
        'auth/user-disabled': 'Account access has been restricted',
        'auth/too-many-requests': 'Too many attempts. Please try again later',
        'auth/network-request-failed': 'Network error. Please check your connection',
        'auth/email-already-in-use': 'Email address is already registered',
        'auth/weak-password': 'Password does not meet security requirements',
        'auth/operation-not-allowed': 'This operation is not available',
        'auth/popup-closed-by-user': 'Sign-in was cancelled',
        'auth/popup-blocked': 'Please allow popups and try again',
        'auth/unauthorized-domain': 'This domain is not authorized for sign-in',
        'auth/invalid-api-key': 'Configuration error. Please contact support',
        'auth/app-not-authorized': 'Application not authorized. Please contact support'
    };
    
    const errorCode = error?.code || 'unknown';
    const userMessage = authErrorMessages[errorCode] || 'Authentication failed. Please try again.';
    
    // Log the error for debugging
    errorSanitizer.secureErrorLog(context, error, { 
        userMessage,
        errorCode 
    });
    
    return {
        message: userMessage,
        code: showDetails ? errorCode : undefined,
        timestamp: new Date().toISOString(),
        shouldDisplay: true
    };
}

/**
 * Handle form validation errors securely
 * @param {Array} validationErrors - Array of validation errors
 * @param {Object} options - Configuration options
 * @returns {Object} Sanitized validation error response
 */
export function handleValidationErrors(validationErrors, options = {}) {
    const {
        context = 'form-validation',
        showFieldNames = false
    } = options;
    
    if (!Array.isArray(validationErrors) || validationErrors.length === 0) {
        return {
            message: 'Please check your input and try again',
            errors: [],
            timestamp: new Date().toISOString()
        };
    }
    
    // In production, return generic validation message
    if (errorSanitizer.isProduction() && !showFieldNames) {
        return {
            message: 'Please check your input and try again',
            errors: [],
            timestamp: new Date().toISOString()
        };
    }
    
    // In development or when showing field names is allowed, return safe field-level errors
    const safeErrors = validationErrors.map(err => ({
        field: showFieldNames ? (err.field || err.param || 'unknown') : undefined,
        message: 'Invalid value provided',
        // Never include the actual invalid value
        value: undefined
    }));
    
    return {
        message: 'Please correct the highlighted fields',
        errors: safeErrors,
        timestamp: new Date().toISOString()
    };
}

/**
 * Handle network/API errors securely
 * @param {Error|Response} error - Network error or failed response
 * @param {Object} options - Configuration options
 * @returns {Object} Safe network error response
 */
export function handleNetworkError(error, options = {}) {
    const {
        context = 'network-request',
        endpoint = 'unknown'
    } = options;
    
    let userMessage = 'Network error. Please check your connection and try again.';
    
    // Handle different types of network errors
    if (error instanceof Response) {
        if (error.status >= 500) {
            userMessage = 'Server error. Please try again later.';
        } else if (error.status === 401) {
            userMessage = 'Authentication required. Please sign in again.';
        } else if (error.status === 403) {
            userMessage = 'Access denied. You do not have permission for this action.';
        } else if (error.status === 404) {
            userMessage = 'Requested resource not found.';
        } else if (error.status === 429) {
            userMessage = 'Too many requests. Please wait and try again.';
        } else if (error.status >= 400) {
            userMessage = 'Invalid request. Please check your input.';
        }
    } else if (error.name === 'NetworkError' || error.message.includes('network')) {
        userMessage = 'Network connection error. Please check your internet connection.';
    } else if (error.name === 'TimeoutError' || error.message.includes('timeout')) {
        userMessage = 'Request timeout. Please try again.';
    }
    
    // Log error for debugging
    errorSanitizer.secureErrorLog(context, error, { 
        endpoint,
        userMessage,
        status: error instanceof Response ? error.status : undefined
    });
    
    return {
        message: userMessage,
        timestamp: new Date().toISOString(),
        shouldDisplay: true
    };
}

/**
 * Display error message safely to user
 * @param {string|Object} errorResponse - Error response from secure handlers
 * @param {Element} targetElement - DOM element to display error in
 * @param {Object} options - Display options
 */
export function displaySecureError(errorResponse, targetElement, options = {}) {
    const {
        className = 'error-message',
        timeout = 5000,
        clearExisting = true
    } = options;
    
    if (!targetElement) {
        console.warn('No target element provided for error display');
        return;
    }
    
    // Clear existing error messages if requested
    if (clearExisting) {
        const existingErrors = targetElement.querySelectorAll(`.${className}`);
        existingErrors.forEach(el => el.remove());
    }
    
    // Extract message from error response
    const message = typeof errorResponse === 'string' 
        ? errorResponse 
        : errorResponse?.message || 'An error occurred';
    
    // Create error message element
    const errorElement = document.createElement('div');
    errorElement.className = className;
    errorElement.textContent = message;
    errorElement.setAttribute('role', 'alert');
    errorElement.setAttribute('aria-live', 'polite');
    
    // Add to target element
    targetElement.appendChild(errorElement);
    
    // Auto-remove after timeout
    if (timeout > 0) {
        setTimeout(() => {
            if (errorElement.parentNode) {
                errorElement.remove();
            }
        }, timeout);
    }
}

/**
 * Global error handler for unhandled promise rejections and errors
 */
export function setupGlobalErrorHandling() {
    // Handle unhandled promise rejections
    window.addEventListener('unhandledrejection', (event) => {
        const error = event.reason;
        const secureError = handleSecureError(error, {
            context: 'unhandled-rejection',
            showToUser: false // Don't automatically show to user
        });
        
        // Prevent the default error logging
        event.preventDefault();
        
        console.warn('Unhandled promise rejection:', secureError.message);
    });
    
    // Handle general JavaScript errors
    window.addEventListener('error', (event) => {
        const error = event.error || event.message;
        const secureError = handleSecureError(error, {
            context: 'javascript-error',
            showToUser: false // Don't automatically show to user
        });
        
        console.warn('JavaScript error:', secureError.message);
    });
}

// Export all functions
export default {
    handleSecureError,
    handleAuthError,
    handleValidationErrors,
    handleNetworkError,
    displaySecureError,
    setupGlobalErrorHandling
}; 