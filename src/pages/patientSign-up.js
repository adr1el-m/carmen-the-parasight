// Patient Registration JavaScript
import authService, { USER_ROLES } from '../services/auth-service.js';
import authGuard from '../utils/auth-guard.js';
import { createPatientDocument } from '../services/firestoredb.js';

// Import validation utilities
import { 
    validatePatientRegistrationForm, 
    validateEmail, 
    validateName, 
    validatePhone, 
    validateAddress, 
    validateBio,
    validateDateOfBirth,
    sanitizeInput,
    escapeHtml,
    rateLimiter 
} from '../utils/validation.js';

// Log initialization
console.log('Patient Registration initialized');

// DOM Elements - declare variables first
let registrationForm;
let registerBtn;
let googleSignUpBtn;
let errorMessage;
let successMessage;
let loadingSpinner;
let btnText;

// Initialize DOM elements when DOM is ready
function initializeDOMElements() {
    registrationForm = document.getElementById('registrationForm');
    registerBtn = document.getElementById('registerBtn');
    googleSignUpBtn = document.getElementById('googleSignUp');
    errorMessage = document.getElementById('errorMessage');
    successMessage = document.getElementById('successMessage');
    loadingSpinner = document.querySelector('.loading-spinner');
    btnText = document.querySelector('.btn-text');
    
    // Debug logging
    console.log('DOM elements initialized:');
    console.log('- Registration Form:', registrationForm);
    console.log('- Register Button:', registerBtn);
    console.log('- Google Sign-Up Button:', googleSignUpBtn);
    console.log('- Error Message:', errorMessage);
    console.log('- Success Message:', successMessage);
    
    // Check if Google button exists
    if (!googleSignUpBtn) {
        console.error('Google sign-up button not found! Make sure element with ID "googleSignUp" exists.');
        return false;
    }
    
    return true;
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    console.log('DOM Content Loaded');
    
    if (!initializeDOMElements()) {
        console.error('Failed to initialize DOM elements');
        return;
    }
    
    // Set up event listeners
    setupEventListeners();
});

// Set up all event listeners
function setupEventListeners() {
    // Form submission handler
    if (registrationForm) {
        registrationForm.addEventListener('submit', handleFormSubmission);
    }
    
    // Google sign-up button handler with debouncing
    if (googleSignUpBtn) {
        console.log('Setting up Google sign-up button event listener');
        googleSignUpBtn.addEventListener('click', handleGoogleSignUpClick);
    } else {
        console.error('Cannot set up Google sign-up button - element not found');
    }
    
    // Real-time password confirmation validation
    const confirmPasswordField = document.getElementById('confirmPassword');
    if (confirmPasswordField) {
        confirmPasswordField.addEventListener('input', handlePasswordConfirmation);
    }
    
    // Enhanced form field validation
    document.querySelectorAll('input[required], textarea[required]').forEach(field => {
        field.addEventListener('blur', handleFieldBlur);
        field.addEventListener('input', handleFieldInput);
    });
}

// Check for authentication state and redirect messages
window.addEventListener('load', async () => {
    console.log('Window loaded, checking authentication state');
    
    try {
        // Check for Google sign-in redirect result first
        await checkGoogleRedirectResult();
        
        // Check for redirect message
        const redirectMessage = localStorage.getItem('auth_redirect_message');
        if (redirectMessage) {
            showError(redirectMessage);
            localStorage.removeItem('auth_redirect_message');
        }
        
        // Check if user is already authenticated
        if (authService.isAuthenticated()) {
            const user = authService.getCurrentUser();
            if (user.emailVerified) {
                // Redirect to appropriate dashboard
                authService.redirectAfterLogin();
            }
        }
    } catch (error) {
        console.error('Page load error:', error);
    }
});

// Check for Google redirect result
async function checkGoogleRedirectResult() {
    try {
        console.log('Checking for Google redirect result...');
        
        // Import Firebase auth functions for redirect result
        const { getRedirectResult } = await import('firebase/auth');
        
        // Get auth instance from auth service (using the same instance)
        const { auth } = await import('./auth-service.js');
        
        const result = await getRedirectResult(auth);
        if (result) {
            console.log('Google redirect result found:', result.user.email);
            
            // Handle the successful Google sign-up
            await handleGoogleAuthResult(result.user);
            
            return true;
        }
        return false;
    } catch (error) {
        console.error('Error checking Google redirect result:', error);
        
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

// Form validation using the comprehensive validation system
function validateForm(formData) {
    // Check rate limiting first
    const userKey = formData.email || 'anonymous';
    if (!rateLimiter.isAllowed(userKey, 3, 60000)) {
        return { valid: false, errors: ['Too many attempts. Please wait 1 minute before trying again.'] };
    }

    // Sanitize all inputs before validation
    const sanitizedFormData = {
        firstName: sanitizeInput(formData.firstName),
        lastName: sanitizeInput(formData.lastName),
        email: sanitizeInput(formData.email),
        password: formData.password, // Don't sanitize password - keep as is for validation
        confirmPassword: formData.confirmPassword,
        dateOfBirth: formData.birthDate,
        phone: sanitizeInput(formData.phone),
        address: sanitizeInput(formData.address),
        bio: sanitizeInput(formData.bio || ''),
        terms: formData.terms
    };

    // Use the comprehensive validation system
    const validationResult = validatePatientRegistrationForm(sanitizedFormData);
    
    if (!validationResult.valid) {
        return { valid: false, errors: validationResult.errors };
    }

    // Additional business logic validation
    const errors = [];
    
    // Validate age (must be 18+)
    const birthDate = new Date(sanitizedFormData.dateOfBirth);
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
        age--;
    }
    
    if (age < 18) {
        errors.push('You must be at least 18 years old to register');
    }

    if (errors.length > 0) {
        return { valid: false, errors };
    }

    return { valid: true, sanitizedData: validationResult.sanitizedData };
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
        registerBtn.disabled = true;
        loadingSpinner.style.display = 'block';
        btnText.style.display = 'none';
        googleSignUpBtn.disabled = true;
    } else {
        registerBtn.disabled = false;
        loadingSpinner.style.display = 'none';
        btnText.style.display = 'block';
        googleSignUpBtn.disabled = false;
    }
}

// Handle email/password registration
async function handleEmailRegistration(formData) {
    try {
        setLoading(true);
        hideMessages();

        // Validate form data with comprehensive validation
        const validationResult = validateForm(formData);
        if (!validationResult.valid) {
            showError(validationResult.errors[0]);
            return;
        }

        // Use sanitized data for registration
        const sanitizedData = validationResult.sanitizedData;

        // Register with auth service
        const user = await authService.registerWithEmail(
            sanitizedData.email, 
            sanitizedData.password,
            {
                displayName: `${sanitizedData.firstName} ${sanitizedData.lastName}`
            }
        );

        // Store additional patient data for later use when email is verified
        localStorage.setItem('pending_patient_data', JSON.stringify({
            firstName: sanitizedData.firstName,
            lastName: sanitizedData.lastName,
            birthDate: sanitizedData.dateOfBirth,
            phone: sanitizedData.phone,
            address: sanitizedData.address,
            bio: sanitizedData.bio,
            authProvider: 'email'
        }));

        showSuccess('Registration successful! Please check your email to verify your account before signing in.');
        
        // Clear form
        registrationForm.reset();

    } catch (error) {
        console.error('Registration error:', error);
        
        let errorMsg = 'Registration failed. Please try again.';
        
        if (error.message.includes('Too many failed login attempts')) {
            errorMsg = error.message;
        } else {
            switch (error.code) {
                case 'auth/email-already-in-use':
                    errorMsg = 'This email is already registered. Please use a different email or sign in.';
                    break;
                case 'auth/weak-password':
                    errorMsg = 'Password is too weak. Please choose a stronger password.';
                    break;
                case 'auth/invalid-email':
                    errorMsg = 'Please enter a valid email address.';
                    break;
                case 'auth/operation-not-allowed':
                    errorMsg = 'Email registration is currently disabled. Please contact support.';
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

// Handle Google authentication result
async function handleGoogleAuthResult(user) {
    try {
        console.log('Google authentication result:', user);
        
        // For Google users, we can proceed even if there are some Firestore permission issues initially
        // The user is already authenticated, so we should redirect them to the portal
        
        let userExists = false;
        let patientDocumentCreated = false;
        
        // Try to check if user exists (handle permission errors gracefully)
        try {
            userExists = await checkIfUserExists(user.uid);
            console.log('User exists check result:', userExists);
        } catch (error) {
            console.warn('Could not check user existence (permission issue):', error);
            // Assume new user if we can't check due to permissions
            userExists = false;
        }
        
        // Try to create patient document if needed (handle permission errors gracefully)
        if (!userExists) {
            try {
                await createPatientDocument(user, { 
                    authProvider: 'google',
                    firstName: user.displayName?.split(' ')[0] || '',
                    lastName: user.displayName?.split(' ').slice(1).join(' ') || '',
                    emailVerified: true // Google users are auto-verified
                });
                patientDocumentCreated = true;
                console.log('Patient document created successfully');
            } catch (error) {
                console.warn('Could not create patient document (permission issue):', error);
                // Store the data for later creation when permissions are fixed
                localStorage.setItem('pending_patient_data', JSON.stringify({
                    firstName: user.displayName?.split(' ')[0] || '',
                    lastName: user.displayName?.split(' ').slice(1).join(' ') || '',
                    authProvider: 'google',
                    emailVerified: true,
                    needsCreation: true
                }));
            }
        }
        
        // Show success message
        if (patientDocumentCreated) {
            showSuccess('Welcome to LingapLink! Your account has been created successfully.');
        } else if (userExists) {
            showSuccess('Welcome back! Signing you in...');
        } else {
            showSuccess('Welcome to LingapLink! Your account setup will be completed shortly.');
        }

        // Always redirect to patient portal after successful Google authentication
        // The auth guard will handle any additional setup needed
        console.log('Redirecting to patient portal...');
        
        setTimeout(() => {
            window.location.href = '/pages/patientPortal.html';
        }, 2000);

    } catch (error) {
        console.error('Google auth result error:', error);
        
        // Even if there are some errors, if the user is authenticated, we should redirect
        if (user && user.uid) {
            console.log('User is authenticated despite errors, redirecting to portal...');
            showSuccess('Welcome to LingapLink! Some features may be limited until setup is complete.');
            
            setTimeout(() => {
                window.location.href = '/pages/patientPortal.html';
            }, 2000);
        } else {
            showError('Failed to complete Google registration. Please try again.');
        }
    }
}

// Check if user exists in Firestore
async function checkIfUserExists(uid) {
    try {
        const { getPatientData } = await import('./firestoredb.js');
        const patientData = await getPatientData(uid);
        return patientData !== null;
    } catch (error) {
        console.error('Error checking user existence:', error);
        return false;
    }
}

// Handle Google authentication errors
function handleGoogleAuthError(error) {
    console.error('Google authentication error:', error);
    console.log('Error code:', error.code);
    console.log('Error message:', error.message);
    console.log('Current domain:', window.location.hostname);
    
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
    console.log('🔧 Debugging Information:');
    console.log('- Check Firebase Console > Authentication > Sign-in method');
    console.log('- Ensure Google provider is enabled');
    console.log('- Check Authorized Domains includes:', window.location.hostname);
    console.log('- Verify OAuth consent screen is configured');
    console.log('- Check browser console for additional errors');
}

// Handle Google sign-up button click
let isGoogleSignInInProgress = false;

async function handleGoogleSignUpClick() {
    console.log('Google sign-up button clicked');
    
    if (isGoogleSignInInProgress) {
        console.log('Google sign-in already in progress, ignoring click');
        return;
    }
    
    isGoogleSignInInProgress = true;
    
    try {
        await handleGoogleRegistration();
    } finally {
        // Reset after a delay to prevent rapid clicking
        setTimeout(() => {
            isGoogleSignInInProgress = false;
        }, 2000);
    }
}

// Handle Google registration 
async function handleGoogleRegistration() {
    console.log('Starting Google registration process...');
    
    try {
        setLoading(true);
        hideMessages();

        console.log('Calling authService.loginWithGoogle()...');
        
        // Use auth service for Google login
        const user = await authService.loginWithGoogle();
        
        console.log('Google authentication result:', user);
        
        if (user) {
            // Handle the authentication result
            await handleGoogleAuthResult(user);
        } else {
            console.log('Google authentication returned null (likely redirect in progress)');
        }

    } catch (error) {
        console.error('Google registration error:', error);
        handleGoogleAuthError(error);
    } finally {
        setLoading(false);
    }
}

// Handle form submission
async function handleFormSubmission(e) {
    e.preventDefault();
    
    const formData = new FormData(registrationForm);
    const data = {
        firstName: formData.get('firstName'),
        lastName: formData.get('lastName'),
        email: formData.get('email'),
        password: formData.get('password'),
        confirmPassword: formData.get('confirmPassword'),
        birthDate: formData.get('birthDate'),
        phone: formData.get('phone'),
        address: formData.get('address'),
        bio: formData.get('bio') || '',
        terms: formData.get('terms') === 'on'
    };

    // Validate form using the comprehensive validation system
    const validationResult = validateForm(data);
    if (!validationResult.valid) {
        showError(validationResult.errors[0]); // Show first error
        return;
    }

    // Handle registration (validation will be done again inside handleEmailRegistration)
    await handleEmailRegistration(data);
}

// Handle password confirmation
function handlePasswordConfirmation() {
    const password = document.getElementById('password').value;
    const confirmPassword = this.value;
    
    if (confirmPassword && password !== confirmPassword) {
        this.setCustomValidity('Passwords do not match');
        this.style.borderColor = '#dc3545';
    } else {
        this.setCustomValidity('');
        this.style.borderColor = '';
    }
}

// Handle field blur
function handleFieldBlur() {
    if (!this.value.trim()) {
        this.style.borderColor = '#dc3545';
    } else {
        this.style.borderColor = '';
    }
}

// Handle field input
function handleFieldInput() {
    if (this.style.borderColor === 'rgb(220, 53, 69)') {
        this.style.borderColor = '';
    }
}

// Listen for auth state changes to handle email verification completion
authService.onAuthStateChange(async (user, role) => {
    if (user && user.emailVerified) {
        // User has verified their email, create patient document if needed
        const pendingData = localStorage.getItem('pending_patient_data');
        if (pendingData) {
            try {
                const patientData = JSON.parse(pendingData);
                await createPatientDocument(user, patientData);
                localStorage.removeItem('pending_patient_data');
                console.log('Patient document created after email verification');
            } catch (error) {
                console.error('Error creating patient document:', error);
            }
        }
    }
});

// Console log for debugging
console.log('Patient Registration page loaded');
console.log('Current domain:', window.location.hostname);
console.log('Google Provider configured for authentication');
