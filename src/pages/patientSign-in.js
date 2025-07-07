// Patient Sign In JavaScript
import authService, { USER_ROLES } from '../services/auth-service.js';
import authGuard from '../utils/auth-guard.js';
import { createPatientDocument } from '../services/firestoredb.js';

// Import validation utilities
import { 
    validateEmail,
    sanitizeInput,
    escapeHtml,
    rateLimiter 
} from '../utils/validation.js';

// Create fallback logger if import fails
let logger;
try {
    const loggerModule = await import('../utils/logger.js');
    logger = loggerModule.default;
} catch (error) {
    logger = {
        info: (...args) => console.log(...args),
        error: (...args) => console.error(...args),
        warn: (...args) => console.warn(...args),
        debug: (...args) => console.log(...args)
    };
}

// Set global logger for use in other functions
window.signInLogger = logger;

// Log initialization
logger.info('Patient Sign In initialized');

// DOM Elements
const signinForm = document.getElementById('signinForm');
const signinBtn = document.getElementById('signinBtn');
const googleSignInBtn = document.getElementById('googleSignIn');
const forgotPasswordLink = document.getElementById('forgotPasswordLink');
const errorMessage = document.getElementById('errorMessage');
const successMessage = document.getElementById('successMessage');
const loadingSpinner = document.querySelector('.loading-spinner');
const btnText = document.querySelector('.btn-text');

// Check for authentication state and redirect messages
window.addEventListener('load', async () => {
    try {
        // Check for Google sign-in redirect result first
        await checkGoogleRedirectResult();
        
        // Check for redirect message
        const redirectMessage = sessionStorage.getItem('auth_redirect_message');
        if (redirectMessage) {
            showError(redirectMessage);
            sessionStorage.removeItem('auth_redirect_message');
        }
        
        // Check if user is already authenticated
        if (authService.isAuthenticated()) {
            const user = authService.getCurrentUser();
            
            // Check if user is verified (email verification or Google user)
            const isGoogleUser = user.providerData.some(provider => provider.providerId === 'google.com');
            const isVerified = user.emailVerified || isGoogleUser;
            
            if (isVerified) {
                logger.info('User is already authenticated and verified, redirecting to portal...');
                // Redirect to appropriate dashboard
                showSuccess('Already signed in! Redirecting...');
                if (!window.isRedirecting) {
                    window.isRedirecting = true;
                    authService.redirectAfterLogin();
                }
                return;
            } else {
                logger.info('User is authenticated but not verified');
            }
        }
    } catch (error) {
        logger.error('Page load error:', error);
    }
});

// Check for Google redirect result
async function checkGoogleRedirectResult() {
    try {
        // Import Firebase auth functions for redirect result
        const { getRedirectResult } = await import('https://www.gstatic.com/firebasejs/11.9.1/firebase-auth.js');
        
        // Get auth instance from auth service (using the same instance)
        const { auth } = await import('../services/auth-service.js');
        
        const result = await getRedirectResult(auth);
        if (result) {
            logger.info('Google redirect result found:', result.user.email);
            
            // Try to ensure patient document exists, but don't block redirect if it fails
            try {
                await ensurePatientDocumentExists(result.user);
                logger.info('Patient document created/verified successfully');
            } catch (docError) {
                logger.warn('Patient document creation failed, but continuing with sign-in:', docError.message);
                // Store error for later resolution but don't block sign-in
                sessionStorage.setItem('pending_patient_doc_error', docError.message);
            }
            
            showSuccess('Google sign-in successful! Welcome!');
            
            // Always redirect, even if document creation failed
            if (!window.isRedirecting) {
                window.isRedirecting = true;
                setTimeout(() => {
                    authService.redirectAfterLogin();
                }, 1000);
            }
            
            return true;
        }
        return false;
    } catch (error) {
        logger.error('Error checking Google redirect result:', error);
        
        // Handle specific errors
        if (error.code === 'auth/unauthorized-domain') {
            showError(`Domain "${window.location.hostname}" is not authorized. Please add it to Firebase Console > Authentication > Settings > Authorized Domains.`);
        } else if (error.code === 'auth/operation-not-allowed') {
            showError('Google sign-in is not enabled in Firebase Console.');
        } else if (error.message && !error.message.includes('No redirect operation')) {
            showError(`Google sign-in error: ${error.message}`);
        }
        
        return false;
    }
}

// Form validation for sign-in
function validateSignInForm(formData) {
    // Check rate limiting first
    const userKey = formData.email || 'anonymous';
    if (!rateLimiter.isAllowed(userKey, 5, 60000)) {
        return { valid: false, errors: ['Too many sign-in attempts. Please wait 1 minute before trying again.'] };
    }

    const errors = [];
    
    // Sanitize inputs
    const email = sanitizeInput(formData.email);
    const password = formData.password; // Don't sanitize password

    // Validate email
    if (!email) {
        errors.push('Email is required');
    } else if (!validateEmail(email)) {
        errors.push('Please enter a valid email address');
    }

    // Validate password
    if (!password) {
        errors.push('Password is required');
    } else if (password.length < 6) {
        errors.push('Password must be at least 6 characters long');
    }

    if (errors.length > 0) {
        return { valid: false, errors };
    }

    return { 
        valid: true, 
        sanitizedData: { 
            email, 
            password 
        } 
    };
}

// Show/hide messages
function showError(message) {
    errorMessage.textContent = message;
    errorMessage.style.display = 'block';
    successMessage.style.display = 'none';
    
    // Auto-hide error after 10 seconds
    setTimeout(() => {
        hideMessages();
    }, 10000);
}

function showSuccess(message) {
    successMessage.textContent = message;
    successMessage.style.display = 'block';
    errorMessage.style.display = 'none';
}

function hideMessages() {
    errorMessage.style.display = 'none';
    successMessage.style.display = 'none';
}

// Loading state management
function setLoading(isLoading) {
    if (isLoading) {
        signinBtn.disabled = true;
        loadingSpinner.style.display = 'block';
        btnText.style.display = 'none';
        googleSignInBtn.disabled = true;
    } else {
        signinBtn.disabled = false;
        loadingSpinner.style.display = 'none';
        btnText.style.display = 'block';
        googleSignInBtn.disabled = false;
    }
}

// Handle email/password sign-in
async function handleEmailSignIn(formData) {
    try {
        setLoading(true);
        hideMessages();

        // Validate form data
        const validationResult = validateSignInForm(formData);
        if (!validationResult.valid) {
            showError(validationResult.errors[0]);
            return;
        }

        const { email, password } = validationResult.sanitizedData;

        // Sign in with auth service
        const user = await authService.loginWithEmail(email, password);

        if (user) {
            if (user.emailVerified) {
                // Check if patient document exists, create if needed
                await ensurePatientDocumentExists(user);
                
                showSuccess('Sign in successful! Welcome back!');
                
                // Redirect after a short delay
                setTimeout(() => {
                    authService.redirectAfterLogin();
                }, 1500);
            } else {
                showError('Please verify your email before signing in. Check your inbox for the verification link.');
                
                // Redirect to email verification page
                setTimeout(() => {
                    window.location.href = '/email-verification.html';
                }, 3000);
            }
        }

    } catch (error) {
        logger.error('Sign in error:', error);
        
        let errorMsg = 'Sign in failed. Please try again.';
        
        if (error.message.includes('Too many failed login attempts')) {
            errorMsg = error.message;
        } else {
            switch (error.code) {
                case 'auth/user-not-found':
                    errorMsg = 'No account found with this email address. Please check your email or sign up.';
                    break;
                case 'auth/wrong-password':
                    errorMsg = 'Incorrect password. Please try again or reset your password.';
                    break;
                case 'auth/invalid-email':
                    errorMsg = 'Please enter a valid email address.';
                    break;
                case 'auth/user-disabled':
                    errorMsg = 'This account has been disabled. Please contact support.';
                    break;
                case 'auth/too-many-requests':
                    errorMsg = 'Too many failed attempts. Please try again later or reset your password.';
                    break;
                case 'auth/network-request-failed':
                    errorMsg = 'Network error. Please check your internet connection and try again.';
                    break;
                case 'auth/invalid-credential':
                    errorMsg = 'Invalid email or password. Please check your credentials and try again.';
                    break;
                default:
                    errorMsg = error.message || errorMsg;
            }
        }
        
        showError(errorMsg);
    } finally {
        setLoading(false);
    }
}

// Ensure patient document exists for the user
async function ensurePatientDocumentExists(user) {
    try {
        logger.info('Checking/creating patient document for:', user.email);
        
        const { getPatientData } = await import('../services/firestoredb.js');
        let patientData;
        
        try {
            patientData = await getPatientData(user.uid);
        } catch (getError) {
            logger.warn('Could not retrieve patient data, will attempt to create:', getError.message);
            patientData = null;
        }
        
        if (!patientData) {
            logger.info('Creating new patient document...');
            
            try {
                // Determine auth provider
                const isGoogleUser = user.providerData.some(provider => provider.providerId === 'google.com');
                const authProvider = isGoogleUser ? 'google' : 'email';
                
                // Create patient document with Google user info
                await createPatientDocument(user, {
                    authProvider: authProvider,
                    firstName: user.displayName?.split(' ')[0] || '',
                    lastName: user.displayName?.split(' ').slice(1).join(' ') || '',
                    phone: '', // Will be filled later
                    emailVerified: user.emailVerified || isGoogleUser
                });
                logger.info('Patient document created successfully for:', user.email);
            } catch (createError) {
                logger.warn('Failed to create patient document:', createError.message);
                if (createError.message.includes('permission') || createError.message.includes('rules')) {
                    logger.warn('This is likely a Firestore rules issue. Please check FIRESTORE_RULES_FIX.md');
                    // Store the error for later resolution
                    sessionStorage.setItem('firestore_rules_error', 'Patient document creation failed due to Firestore rules. Please check FIRESTORE_RULES_FIX.md');
                }
                // Don't throw - allow user to proceed
                return false;
            }
        } else {
            logger.info('Patient document already exists for:', user.email);
            
            try {
                // Update last login
                const { updateLastLogin } = await import('../services/firestoredb.js');
                await updateLastLogin(user.uid);
            } catch (updateError) {
                logger.warn('Failed to update last login (non-critical):', updateError.message);
                // This is non-critical, continue
            }
        }
        
        return true;
    } catch (error) {
        logger.error('Error ensuring patient document exists:', error);
        logger.info('User can still proceed to portal, document will be created later');
        return false;
    }
}

// Handle Google sign-in
async function handleGoogleSignIn() {
    try {
        setLoading(true);
        hideMessages();

        logger.info('Starting Google sign-in...');
        
        // Use auth service for Google login
        const user = await authService.loginWithGoogle();
        
        if (user) {
            logger.info('Google sign-in successful for:', user.email);
            
            // Try to ensure patient document exists, but don't block redirect if it fails
            try {
                await ensurePatientDocumentExists(user);
                logger.info('Patient document handling completed');
            } catch (docError) {
                logger.warn('Patient document creation failed, but continuing:', docError.message);
                // Store error for later resolution
                sessionStorage.setItem('pending_patient_doc_error', docError.message);
            }
            
            showSuccess('Google sign-in successful! Welcome!');
            
            // Always redirect, even if document creation failed
            logger.info('Redirecting to patient portal...');
            
            if (!window.isRedirecting) {
                window.isRedirecting = true;
                setTimeout(() => {
                    window.location.href = '/public/patientPortal.html';
                }, 1000);
            }
        } else {
            logger.info('Google sign-in returned null, likely using redirect method');
        }

    } catch (error) {
        logger.error('Google sign-in error:', error);
        handleGoogleAuthError(error);
    } finally {
        setLoading(false);
    }
}

// Handle Google authentication errors
function handleGoogleAuthError(error) {
    logger.error('Google authentication error:', error);
    logger.log('Error code:', error.code);
    logger.log('Error message:', error.message);
    logger.log('Current domain:', window.location.hostname);
    
    let errorMsg = 'Google sign-in failed. Please try again.';
    
    switch (error.code) {
        case 'auth/unauthorized-domain':
            errorMsg = `❌ Domain Not Authorized\n\nTo fix this:\n1. Go to Firebase Console\n2. Navigate to Authentication > Settings\n3. Add "${window.location.hostname}" to Authorized Domains\n4. Save and try again\n\nCurrent domain: ${window.location.hostname}`;
            break;
        case 'auth/operation-not-allowed':
            errorMsg = '❌ Google Sign-In Not Enabled\n\nTo fix this:\n1. Go to Firebase Console\n2. Navigate to Authentication > Sign-in method\n3. Enable Google provider\n4. Configure OAuth consent screen\n5. Save and try again';
            break;
        case 'auth/account-exists-with-different-credential':
            errorMsg = 'An account already exists with this email using a different sign-in method. Please try signing in with email and password.';
            break;
        case 'auth/popup-closed-by-user':
            errorMsg = 'Sign-in was cancelled. Please try again.';
            break;
        case 'auth/popup-blocked':
            errorMsg = 'Popup was blocked by your browser. Please allow popups for this site and try again, or the page will automatically redirect.';
            break;
        case 'auth/cancelled-popup-request':
            // Don't show error for cancelled popup - user might have clicked multiple times
            return;
        case 'auth/network-request-failed':
            errorMsg = 'Network error. Please check your internet connection and try again.';
            break;
        case 'auth/internal-error':
            errorMsg = 'Internal error occurred. Please check your Firebase configuration and try again.';
            break;
        case 'auth/invalid-api-key':
            errorMsg = 'Invalid API key. Please check your Firebase configuration.';
            break;
        case 'auth/app-not-authorized':
            errorMsg = 'App not authorized. Please check your Firebase project settings.';
            break;
        default:
            // Check if it's a configuration-related error
            if (error.message.includes('not enabled')) {
                errorMsg = 'Google sign-in is not properly configured. Please check Firebase Console settings.';
            } else if (error.message.includes('Domain')) {
                errorMsg = error.message; // Use the detailed message from auth service
            } else {
                errorMsg = `Google sign-in failed: ${error.message || 'Unknown error'}`;
            }
    }
    
    showError(errorMsg);
    
    // Log helpful debugging information
    logger.log('🔧 Debugging Information:');
    logger.log('- Check Firebase Console > Authentication > Sign-in method');
    logger.log('- Ensure Google provider is enabled');
    logger.log('- Check Authorized Domains includes:', window.location.hostname);
    logger.log('- Verify OAuth consent screen is configured');
    logger.log('- Check browser console for additional errors');
}

// Handle forgot password
async function handleForgotPassword() {
    const emailInput = document.getElementById('email');
    const email = sanitizeInput(emailInput.value.trim());
    
    if (!email) {
        showError('Please enter your email address first, then click "Forgot your password?"');
        emailInput.focus();
        return;
    }
    
    if (!validateEmail(email)) {
        showError('Please enter a valid email address');
        emailInput.focus();
        return;
    }

    // Rate limiting for forgot password requests - very strict
    const userKey = `forgot_password_${email}`;
    if (!rateLimiter.isAllowed(userKey, 2, 300000)) { // 2 attempts per 5 minutes
        showError('Too many password reset requests. Please wait 5 minutes before trying again.');
        return;
    }
    
    try {
        // Import Firebase auth functions for password reset
        const { sendPasswordResetEmail } = await import('https://www.gstatic.com/firebasejs/11.9.1/firebase-auth.js');
        
        // Get auth instance from auth service
        const auth = authService.getCurrentUser()?.auth || (await import('./auth-service.js')).auth;
        
        if (!auth) {
            // If we can't get auth instance, use direct Firebase
            const { initializeApp } = await import('https://www.gstatic.com/firebasejs/11.9.1/firebase-app.js');
            const { getAuth } = await import('https://www.gstatic.com/firebasejs/11.9.1/firebase-auth.js');
            const { firebaseConfig } = await import('../services/config.js');
            
            const app = initializeApp(firebaseConfig);
            const firebaseAuth = getAuth(app);
            
            await sendPasswordResetEmail(firebaseAuth, email);
        } else {
            await sendPasswordResetEmail(auth, email);
        }
        
        showSuccess(`Password reset email sent to ${email}. Please check your inbox and follow the instructions.`);
        
    } catch (error) {
        logger.error('Password reset error:', error);
        
        let errorMsg = 'Failed to send password reset email. Please try again.';
        
        switch (error.code) {
            case 'auth/user-not-found':
                errorMsg = 'No account found with this email address. Please check your email or sign up.';
                break;
            case 'auth/invalid-email':
                errorMsg = 'Please enter a valid email address.';
                break;
            case 'auth/too-many-requests':
                errorMsg = 'Too many requests. Please wait before requesting another password reset email.';
                break;
            default:
                errorMsg = error.message || errorMsg;
        }
        
        showError(errorMsg);
    }
}

// Form submission handler
signinForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const formData = new FormData(signinForm);
    const data = {
        email: formData.get('email'),
        password: formData.get('password')
    };

    await handleEmailSignIn(data);
});

// Google sign-in button handler with debouncing
let isGoogleSignInInProgress = false;

googleSignInBtn.addEventListener('click', async () => {
    if (isGoogleSignInInProgress) {
        return; // Prevent multiple clicks
    }
    
    isGoogleSignInInProgress = true;
    
    try {
        await handleGoogleSignIn();
    } finally {
        // Reset after a delay to prevent rapid clicking
        setTimeout(() => {
            isGoogleSignInInProgress = false;
        }, 2000);
    }
});

// Forgot password link handler
forgotPasswordLink.addEventListener('click', async (e) => {
    e.preventDefault();
    await handleForgotPassword();
});

// Enhanced form field validation
document.querySelectorAll('input[required]').forEach(field => {
    field.addEventListener('blur', function() {
        if (!this.value.trim()) {
            this.style.borderColor = '#dc3545';
        } else {
            this.style.borderColor = '';
        }
    });

    field.addEventListener('input', function() {
        if (this.style.borderColor === 'rgb(220, 53, 69)') {
            this.style.borderColor = '';
        }
    });
});

// Listen for auth state changes
authService.onAuthStateChange(async (user, role) => {
    if (user && user.emailVerified) {
        logger.info('User signed in:', user.email, 'Role:', role);
        // Redirect will be handled by the sign-in functions
    }
});

// Console log for debugging
logger.info('Patient Sign In page loaded');
logger.info('Current domain:', window.location.hostname);
logger.info('Firebase Auth configured for sign-in');
