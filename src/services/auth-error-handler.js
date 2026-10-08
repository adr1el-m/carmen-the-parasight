/**
 * AUTHENTICATION-SPECIFIC ERROR HANDLER
 * 
 * This module is isolated to prevent circular dependencies between the
 * auth-service and the main secure-error-handler.
 */

/**
 * Handle authentication errors with user-friendly messages
 * @param {Error} error - Authentication error object
 * @returns {Object} User-friendly error response
 */
export function handleAuthError(error) {
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
    let userMessage = authErrorMessages[errorCode];
    
    if (!userMessage) {
        // Fallback to error message if available, otherwise generic message
        userMessage = error?.message || 'Authentication failed. Please try again.';
        
        // Clean up common error prefixes if they exist
        if (userMessage.includes('Error: ')) {
            userMessage = userMessage.split('Error: ')[1];
        }
    }
    
    // Return a simple, safe error object
    return {
        message: userMessage,
        code: errorCode,
        timestamp: new Date().toISOString(),
        shouldDisplay: true
    };
} 