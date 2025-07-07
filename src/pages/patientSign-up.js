// Patient Registration JavaScript - Updated for New Design
import authService, { USER_ROLES } from '../services/auth-service.js';
import authGuard from '../utils/auth-guard.js';
import { createPatientDocument } from '../services/firestoredb.js';

// Import validation utilities
import { 
    validatePatientRegistrationForm,
    validateSimplifiedSignUpForm,
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

// Import comprehensive validation schemas
import { 
    userRegistrationSchema, 
    validateData 
} from '../utils/validation-schemas.js';

// State management class for better organization
class SignUpState {
    constructor() {
        this.isProcessing = false;
        this.isRedirecting = false;
        this.redirectAttempts = 0;
        this.lastRedirectTime = 0;
        this.activeTimeouts = new Set();
        this.isInitialized = false;
    }

    setProcessing(value) {
        this.isProcessing = value;
    }

    canAttemptRedirect() {
        const now = Date.now();
        const timeSinceLastRedirect = now - this.lastRedirectTime;
        
        // Prevent rapid redirects (less than 2 seconds apart)
        if (timeSinceLastRedirect < 2000 && this.redirectAttempts > 0) {
            console.warn('🚨 Preventing rapid redirect attempt');
            return false;
        }
        
        // Prevent too many redirect attempts
        if (this.redirectAttempts >= 3) {
            console.warn('🚨 Too many redirect attempts, blocking');
            return false;
        }
        
        return !this.isRedirecting;
    }

    setRedirecting(value) {
        if (value) {
            this.redirectAttempts++;
            this.lastRedirectTime = Date.now();
        }
        this.isRedirecting = value;
    }

    addTimeout(timeoutId) {
        this.activeTimeouts.add(timeoutId);
    }

    clearAllTimeouts() {
        this.activeTimeouts.forEach(timeoutId => clearTimeout(timeoutId));
        this.activeTimeouts.clear();
    }

    reset() {
        this.isProcessing = false;
        this.isRedirecting = false;
        this.redirectAttempts = 0;
        this.lastRedirectTime = 0;
        this.clearAllTimeouts();
    }
}

// Initialize state manager
const signUpState = new SignUpState();

// DOM Elements
let domElements = {};

// Initialize DOM elements when DOM is ready
function initializeDOMElements() {
    domElements = {
        registrationForm: document.getElementById('registrationForm'),
        registerBtn: document.getElementById('registerBtn'),
        googleSignUpBtn: document.getElementById('googleSignUp'),
        errorMessage: document.getElementById('errorMessage'),
        successMessage: document.getElementById('successMessage'),
        loadingSpinner: document.querySelector('.loading-spinner'),
        btnText: document.querySelector('.btn-text'),
        password: document.getElementById('password'),
        email: document.getElementById('email'),
        phone: document.getElementById('phone'),
        birthDate: document.getElementById('birthDate'),
        countryCode: document.getElementById('countryCode'),
        // Hidden fields
        firstName: document.getElementById('firstName'),
        lastName: document.getElementById('lastName'),
        confirmPassword: document.getElementById('confirmPassword'),
        address: document.getElementById('address'),
        terms: document.getElementById('terms')
    };
    
    // Validate required elements
    const requiredElements = ['registrationForm', 'registerBtn', 'googleSignUpBtn'];
    const missingElements = requiredElements.filter(name => !domElements[name]);
    
    if (missingElements.length > 0) {
        console.error('Missing required DOM elements:', missingElements);
        showError('Page initialization failed. Please refresh the page.');
        return false;
    }
    
    console.log('✅ DOM elements initialized successfully');
    return true;
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    console.log('🚀 DOM Content Loaded');
    
    if (!initializeDOMElements()) {
        return;
    }
    
    setupEventListeners();
    signUpState.isInitialized = true;
});

// Set up all event listeners
function setupEventListeners() {
    // Form submission handler
    domElements.registrationForm.addEventListener('submit', handleFormSubmission);
    
    // Google sign-up button handler with proper debouncing
    domElements.googleSignUpBtn.addEventListener('click', debounce(handleGoogleSignUpClick, 1000));
    
    // Enhanced form field validation
    document.querySelectorAll('input[required]').forEach(field => {
        field.addEventListener('blur', handleFieldBlur);
        field.addEventListener('input', handleFieldInput);
    });
    
    // Real-time password strength indicator (optional)
    if (domElements.password) {
        domElements.password.addEventListener('input', handlePasswordInput);
    }
}

// Debounce utility function
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

// Enhanced redirect handling
function performRedirect(reason, user = null) {
    if (!signUpState.canAttemptRedirect()) {
        console.log('🚫 Redirect blocked:', reason);
        return false;
    }
    
    console.log(`🔄 Performing redirect: ${reason}`, user?.email || 'no user');
    signUpState.setRedirecting(true);
    
    // Clear any existing timeouts
    signUpState.clearAllTimeouts();
    
    // Set a timeout to reset redirect flag in case something goes wrong
    const resetTimeout = setTimeout(() => {
        signUpState.setRedirecting(false);
    }, 5000);
    signUpState.addTimeout(resetTimeout);
    
    // Use auth service redirect function for proper role-based routing
    const redirectTimeout = setTimeout(() => {
        try {
            // Double-check that we have a user and role
            const currentUser = authService.getCurrentUser();
            const userRole = authService.getUserRole();
            
            console.log('🔍 Pre-redirect check:', {
                hasCurrentUser: !!currentUser,
                userEmail: currentUser?.email,
                userRole: userRole,
                isAuthenticated: authService.isAuthenticated()
            });
            
            if (!currentUser && user) {
                console.log('🔧 Setting current user for redirect');
                authService.currentUser = user;
                authService.userRole = USER_ROLES.PATIENT;
            }
            
            if (!userRole) {
                console.log('🔧 Setting default role for redirect');
                authService.userRole = USER_ROLES.PATIENT;
            }
            
            // Use auth service redirect
            authService.redirectAfterLogin();
        } catch (redirectError) {
            console.error('❌ Redirect error:', redirectError);
            // Fallback direct redirect
            window.location.href = '/public/patientPortal.html';
        }
    }, 800);
    signUpState.addTimeout(redirectTimeout);
    
    return true;
}

// Check for authentication state and handle redirects
window.addEventListener('load', async () => {
    if (!signUpState.isInitialized) {
        console.log('Waiting for initialization...');
        return;
    }
    
    console.log('🔍 Checking authentication state on page load');
    
    try {
        // Clear any stale state
        signUpState.reset();
        
        // Check for redirect messages first
        const redirectMessage = localStorage.getItem('auth_redirect_message');
        if (redirectMessage) {
            showError(redirectMessage);
            localStorage.removeItem('auth_redirect_message');
        }
        
        // Check for Google redirect result immediately
        const hasRedirectResult = await checkGoogleRedirectResult();
        if (hasRedirectResult) {
            console.log('✅ Google redirect result processed, ending page load check');
            return;
        }
        
        // Wait for auth guard to handle initial authentication checks
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // Check authentication state
        const isAuthenticated = authService.isAuthenticated();
        const user = authService.getCurrentUser();
        
        console.log('📊 Page load auth status:', {
            isAuthenticated,
            hasUser: !!user,
            userEmail: user?.email,
            userRole: authService.getUserRole()
        });
        
        if (isAuthenticated && user && user.uid) {
            try {
                // Check if user is verified
                const isGoogleUser = user.providerData.some(provider => provider.providerId === 'google.com');
                const isVerified = user.emailVerified || isGoogleUser;
                
                if (isVerified) {
                    console.log('✅ User is authenticated and verified, redirecting');
                    
                    // Ensure role is set
                    if (!authService.getUserRole()) {
                        authService.userRole = USER_ROLES.PATIENT;
                    }
                    
                    showSuccess('Welcome back! Redirecting to your dashboard...');
                    performRedirect('user already authenticated', user);
                } else {
                    console.log('ℹ️ User is authenticated but not verified, staying on sign-up page');
                }
            } catch (error) {
                console.log('❌ Error checking user verification:', error);
                // Don't clear auth state, just log the error
            }
        }
    } catch (error) {
        console.error('❌ Error during page load auth check:', error);
        showError('An error occurred while checking your authentication status.');
    }
});

// Check for Google redirect result
async function checkGoogleRedirectResult() {
    try {
        console.log('🔍 Checking for Google redirect result...');
        
        const { getRedirectResult } = await import('https://www.gstatic.com/firebasejs/11.9.1/firebase-auth.js');
        const authServiceModule = await import('../services/auth-service.js');
        const auth = authServiceModule.auth;
        
        const result = await getRedirectResult(auth);
        if (result) {
            console.log('✅ Google redirect result found:', result.user.email);
            
            // Set user role immediately
            authService.currentUser = result.user;
            authService.userRole = USER_ROLES.PATIENT;
            
            await handleGoogleAuthResult(result.user);
            return true;
        }
        
        // Check if user is already authenticated from redirect
        const user = auth.currentUser;
        if (user) {
            console.log('✅ User already authenticated from redirect:', user.email);
            
            // Ensure role is set
            if (!authService.getUserRole()) {
                authService.userRole = USER_ROLES.PATIENT;
            }
            
            showSuccess('Welcome back! Redirecting to your dashboard...');
            performRedirect('google redirect completed', user);
            return true;
        }
        
        console.log('ℹ️ No Google redirect result found');
        return false;
    } catch (error) {
        console.error('❌ Error checking Google redirect result:', error);
        handleGoogleAuthError(error);
        return false;
    }
}

// Secure storage utility
class SecureStorage {
    static setItem(key, value, encrypt = true) {
        try {
            const data = encrypt ? btoa(JSON.stringify(value)) : JSON.stringify(value);
            localStorage.setItem(key, data);
        } catch (error) {
            console.error('Error storing data:', error);
        }
    }
    
    static getItem(key, decrypt = true) {
        try {
            const data = localStorage.getItem(key);
            if (!data) return null;
            
            return decrypt ? JSON.parse(atob(data)) : JSON.parse(data);
        } catch (error) {
            console.error('Error retrieving data:', error);
            return null;
        }
    }
    
    static removeItem(key) {
        localStorage.removeItem(key);
    }
}

// Auto-generate names from email
function generateNamesFromEmail(email) {
    const username = email.split('@')[0];
    const nameParts = username.split(/[._-]/);
    
    // Capitalize first letter of each part
    const capitalize = (str) => str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
    
    const firstName = nameParts[0] ? capitalize(nameParts[0]) : '';
    const lastName = nameParts[1] ? capitalize(nameParts[1]) : '';
    
    return { firstName, lastName };
}

// Enhanced form validation
function validateForm(formData) {
    // Rate limiting check
    const userKey = formData.email || 'anonymous';
    if (!rateLimiter.isAllowed(userKey, 3, 60000)) {
        return { 
            valid: false, 
            errors: ['Too many registration attempts. Please wait 1 minute before trying again.'] 
        };
    }

    // Prepare form data for comprehensive validation
    const formDataForValidation = {
        firstName: formData.firstName || '',
        lastName: formData.lastName || '',
        email: formData.email || '',
        password: formData.password || '',
        phone: formData.phone ? `${formData.countryCode || '+1'} ${formData.phone}` : '',
        dateOfBirth: formData.birthDate || ''
    };

    // Use comprehensive validation schema
    const validationResult = validateData(formDataForValidation, userRegistrationSchema);
    
    if (!validationResult.valid) {
        return { 
            valid: false, 
            errors: validationResult.errors
        };
    }

    // Additional security validations
    const errors = [];

    // Check for suspicious patterns in input
    const suspiciousPatterns = [
        /(<script|javascript:|vbscript:|on\w+\s*=)/i,
        /(union\s+select|drop\s+table|delete\s+from)/i,
        /(\${|\{\{|\[\[)/,
        /(eval\(|exec\(|system\()/i
    ];

    for (const [field, value] of Object.entries(validationResult.data)) {
        if (typeof value === 'string') {
            for (const pattern of suspiciousPatterns) {
                if (pattern.test(value)) {
                    errors.push(`Invalid characters detected in ${field}`);
                    break;
                }
            }
        }
    }

    // Additional age validation
    if (validationResult.data.dateOfBirth) {
        const birthDate = new Date(validationResult.data.dateOfBirth);
        const today = new Date();
        let age = today.getFullYear() - birthDate.getFullYear();
        const monthDiff = today.getMonth() - birthDate.getMonth();
        
        if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
            age--;
        }
        
        if (age < 13) {
            errors.push('You must be at least 13 years old to register');
        }
        
        if (age > 120) {
            errors.push('Please enter a valid date of birth');
        }
    }

    // Password security check
    if (validationResult.data.password) {
        const password = validationResult.data.password;
        
        // Check for common weak passwords
        const commonPasswords = [
            'password', '123456', '123456789', 'qwerty', 'abc123', 
            'password123', 'admin', 'root', 'user', 'guest', 'test'
        ];
        
        if (commonPasswords.includes(password.toLowerCase())) {
            errors.push('Password is too common. Please choose a more secure password.');
        }

        // Check for personal information in password
        if (validationResult.data.firstName && 
            password.toLowerCase().includes(validationResult.data.firstName.toLowerCase())) {
            errors.push('Password should not contain your name');
        }
        
        if (validationResult.data.email && 
            password.toLowerCase().includes(validationResult.data.email.split('@')[0].toLowerCase())) {
            errors.push('Password should not contain your email');
        }
    }

    if (errors.length > 0) {
        return { valid: false, errors };
    }

    return { valid: true, sanitizedData: validationResult.data };
}

// Message display utilities
function showError(message) {
    if (!domElements.errorMessage) return;
    
    domElements.errorMessage.textContent = message;
    domElements.errorMessage.style.display = 'block';
    if (domElements.successMessage) {
        domElements.successMessage.style.display = 'none';
    }
    
    // Auto-hide after 10 seconds
    const hideTimeout = setTimeout(hideMessages, 10000);
    signUpState.addTimeout(hideTimeout);
}

function showSuccess(message) {
    if (!domElements.successMessage) return;
    
    domElements.successMessage.textContent = message;
    domElements.successMessage.style.display = 'block';
    if (domElements.errorMessage) {
        domElements.errorMessage.style.display = 'none';
    }
}

function hideMessages() {
    if (domElements.errorMessage) domElements.errorMessage.style.display = 'none';
    if (domElements.successMessage) domElements.successMessage.style.display = 'none';
}

// Loading state management
function setLoading(isLoading) {
    signUpState.setProcessing(isLoading);
    
    if (domElements.registerBtn) {
        domElements.registerBtn.disabled = isLoading;
    }
    
    if (domElements.loadingSpinner) {
        domElements.loadingSpinner.style.display = isLoading ? 'block' : 'none';
    }
    
    if (domElements.btnText) {
        domElements.btnText.style.display = isLoading ? 'none' : 'block';
    }
    
    if (domElements.googleSignUpBtn) {
        domElements.googleSignUpBtn.disabled = isLoading;
    }
}

// Handle email/password registration
async function handleEmailRegistration(formData) {
    if (signUpState.isProcessing) {
        console.log('Registration already in progress');
        return;
    }
    
    try {
        setLoading(true);
        hideMessages();

        const validationResult = validateForm(formData);
        if (!validationResult.valid) {
            showError(validationResult.errors[0]);
            return;
        }

        const sanitizedData = validationResult.sanitizedData;

        // Register with auth service
        const user = await authService.registerWithEmail(
            sanitizedData.email, 
            sanitizedData.password,
            { displayName: `${sanitizedData.firstName} ${sanitizedData.lastName}` }
        );

        // Store patient data securely for later use
        SecureStorage.setItem('pending_patient_data', {
            firstName: sanitizedData.firstName,
            lastName: sanitizedData.lastName,
            birthDate: sanitizedData.dateOfBirth,
            phone: sanitizedData.phone,
            address: sanitizedData.address,
            bio: sanitizedData.bio,
            authProvider: 'email'
        });

        showSuccess('Registration successful! Please check your email to verify your account.');
        
        // Clear form
        domElements.registrationForm.reset();

    } catch (error) {
        console.error('Registration error:', error);
        showError(getErrorMessage(error));
    } finally {
        setLoading(false);
    }
}

// Get user-friendly error message
function getErrorMessage(error) {
    if (error.message.includes('Too many failed login attempts')) {
        return error.message;
    }
    
    const errorMessages = {
        'auth/email-already-in-use': 'This email is already registered. Please use a different email or sign in.',
        'auth/weak-password': 'Password is too weak. Please choose a stronger password.',
        'auth/invalid-email': 'Please enter a valid email address.',
        'auth/operation-not-allowed': 'Email registration is currently disabled. Please contact support.',
        'default': 'Registration failed. Please try again.'
    };
    
    return errorMessages[error.code] || errorMessages.default;
}

// Handle Google authentication result
async function handleGoogleAuthResult(user) {
    if (signUpState.isProcessing || signUpState.isRedirecting) {
        console.log('Already processing Google auth result');
        return;
    }
    
    try {
        signUpState.setProcessing(true);
        console.log('🔄 Processing Google authentication result for:', user.email);
        
        // Clear any error messages
        hideMessages();
        
        // Show success message
        showSuccess('Welcome to LingapLink! Setting up your account...');
        
        // Try to create or update patient document
        try {
            const userExists = await checkIfUserExists(user.uid);
            
            if (!userExists) {
                console.log('📝 Creating new patient document for Google user');
                await createPatientDocument(user, { 
                    authProvider: 'google',
                    firstName: user.displayName?.split(' ')[0] || '',
                    lastName: user.displayName?.split(' ').slice(1).join(' ') || '',
                    emailVerified: true
                });
                showSuccess('Welcome to LingapLink! Your account has been created successfully.');
            } else {
                console.log('👋 Existing user found, welcoming back');
                showSuccess('Welcome back! Signing you in...');
            }
        } catch (error) {
            console.warn('⚠️ Could not create/update patient document:', error);
            showSuccess('Welcome to LingapLink! Your account setup will be completed shortly.');
        }

        // Wait a moment for user to see the success message
        await new Promise(resolve => setTimeout(resolve, 1500));
        
        // Ensure auth service has the correct role set
        if (authService.getUserRole() !== USER_ROLES.PATIENT) {
            console.log('🔧 Setting user role to patient');
            authService.userRole = USER_ROLES.PATIENT;
        }
        
        // Redirect to patient portal
        console.log('🎯 Initiating redirect to patient portal');
        performRedirect('successful Google authentication', user);

    } catch (error) {
        console.error('❌ Google auth result error:', error);
        
        // If user is authenticated, still try to redirect
        if (user && user.uid) {
            console.log('🔧 User authenticated despite errors, attempting redirect');
            showSuccess('Welcome! Some features may be limited until setup is complete.');
            
            // Set role if not set
            if (!authService.getUserRole()) {
                authService.userRole = USER_ROLES.PATIENT;
            }
            
            const redirectTimeout = setTimeout(() => {
                performRedirect('Google auth with errors', user);
            }, 1500);
            signUpState.addTimeout(redirectTimeout);
        } else {
            showError('Failed to complete Google registration. Please try again.');
        }
    } finally {
        signUpState.setProcessing(false);
    }
}

// Check if user exists
async function checkIfUserExists(uid) {
    try {
        const { getPatientData } = await import('../services/firestoredb.js');
        const patientData = await getPatientData(uid);
        return patientData !== null;
    } catch (error) {
        console.error('Error checking user existence:', error);
        return false;
    }
}

// Enhanced Google auth error handling
function handleGoogleAuthError(error) {
    console.error('Google authentication error:', error);
    
    const errorMessages = {
        'auth/unauthorized-domain': `Domain "${window.location.hostname}" is not authorized. Please contact support.`,
        'auth/operation-not-allowed': 'Google sign-in is not enabled. Please contact support.',
        'auth/account-exists-with-different-credential': 'An account already exists with this email using a different sign-in method.',
        'auth/popup-closed-by-user': 'Sign-in was cancelled. Please try again.',
        'auth/popup-blocked': 'Popup was blocked. Please allow popups for this site.',
        'auth/network-request-failed': 'Network error. Please check your internet connection.',
        'auth/cancelled-popup-request': null, // Don't show error for cancelled popup
        'default': 'Google sign-in failed. Please try again.'
    };
    
    const message = errorMessages[error.code] || errorMessages.default;
    if (message) {
        showError(message);
    }
}

// Handle Google sign-up button click with improved error handling
async function handleGoogleSignUpClick(event) {
    event.preventDefault();
    event.stopPropagation();
    
    if (signUpState.isProcessing) {
        console.log('Google sign-in already in progress');
        return;
    }
    
    console.log('🚀 Starting Google registration process...');
    
    try {
        setLoading(true);
        hideMessages();

        // Show loading message
        showSuccess('Connecting to Google...');

        const user = await authService.loginWithGoogle();
        
        if (user) {
            console.log('✅ Google authentication successful:', user.email);
            await handleGoogleAuthResult(user);
        } else {
            console.log('ℹ️ Google authentication returned null (likely redirect)');
            // If null, it means a redirect was initiated, so don't show error
        }

    } catch (error) {
        console.error('❌ Google registration error:', error);
        handleGoogleAuthError(error);
    } finally {
        setLoading(false);
    }
}

// Handle form submission
async function handleFormSubmission(e) {
    e.preventDefault();
    
    if (signUpState.isProcessing) {
        console.log('Form submission already in progress');
        return;
    }
    
    const formData = new FormData(domElements.registrationForm);
    const data = {
        email: formData.get('email'),
        password: formData.get('password'),
        birthDate: formData.get('birthDate'),
        phone: formData.get('phone'),
        countryCode: formData.get('countryCode') || '+1'
    };

    await handleEmailRegistration(data);
}

// Form field event handlers
function handlePasswordInput() {
    // Optional: Add password strength indicator
    const password = this.value;
    const strength = getPasswordStrength(password);
    
    // You can add visual feedback here
    // console.log('Password strength:', strength);
}

function handleFieldBlur(event) {
    const field = event.target;
    const fieldName = field.name || field.id;
    const value = field.value;
    
    // Clear previous error for this field
    clearFieldError(field);
    
    // Validate specific field based on its type
    let validationResult = null;
    
    switch (fieldName) {
        case 'email':
            validationResult = validateEmail(value);
            break;
        case 'firstName':
        case 'lastName':
            validationResult = validateName(value, fieldName);
            break;
        case 'phone':
            const fullPhone = `${domElements.countryCode?.value || '+1'} ${value}`;
            validationResult = validatePhone(fullPhone);
            break;
        case 'password':
            validationResult = validatePassword(value);
            break;
        case 'birthDate':
            validationResult = validateDateOfBirth(value);
            break;
        default:
            // Generic validation for other fields
            if (field.required && !value.trim()) {
                validationResult = { valid: false, error: `${fieldName} is required` };
            }
    }
    
    // Show validation result
    if (validationResult && !validationResult.valid) {
        showFieldError(field, validationResult.error);
    } else if (validationResult && validationResult.valid) {
        showFieldSuccess(field);
    }
}

function handleFieldInput(event) {
    const field = event.target;
    const fieldName = field.name || field.id;
    const value = field.value;
    
    // Real-time validation for specific fields
    if (fieldName === 'password') {
        updatePasswordStrength(value);
    }
    
    // Clear error state when user starts typing
    if (field.classList.contains('error')) {
        clearFieldError(field);
    }
    
    // Basic security check - prevent obvious injection attempts
    const suspiciousPatterns = [
        /<script/i,
        /javascript:/i,
        /on\w+\s*=/i,
        /\${/,
        /\{\{/
    ];
    
    for (const pattern of suspiciousPatterns) {
        if (pattern.test(value)) {
            showFieldError(field, 'Invalid characters detected');
            return;
        }
    }
}

function showFieldError(field, message) {
    // Add error class
    field.classList.add('error');
    field.classList.remove('success');
    
    // Create or update error message
    let errorElement = field.parentElement.querySelector('.field-error');
    if (!errorElement) {
        errorElement = document.createElement('div');
        errorElement.className = 'field-error';
        errorElement.style.color = '#dc3545';
        errorElement.style.fontSize = '0.875rem';
        errorElement.style.marginTop = '0.25rem';
        field.parentElement.appendChild(errorElement);
    }
    errorElement.textContent = message;
    errorElement.style.display = 'block';
}

function showFieldSuccess(field) {
    // Add success class
    field.classList.add('success');
    field.classList.remove('error');
    
    // Hide error message
    const errorElement = field.parentElement.querySelector('.field-error');
    if (errorElement) {
        errorElement.style.display = 'none';
    }
}

function clearFieldError(field) {
    // Remove error/success classes
    field.classList.remove('error', 'success');
    
    // Hide error message
    const errorElement = field.parentElement.querySelector('.field-error');
    if (errorElement) {
        errorElement.style.display = 'none';
    }
}

function updatePasswordStrength(password) {
    const strength = getPasswordStrength(password);
    let level = 'weak';
    let score = 0;
    
    if (strength >= 4) {
        level = 'strong';
        score = 100;
    } else if (strength >= 3) {
        level = 'medium';
        score = 75;
    } else if (strength >= 2) {
        level = 'fair';
        score = 50;
    } else if (strength >= 1) {
        level = 'weak';
        score = 25;
    }
    
    // Create or update password strength indicator
    let strengthElement = domElements.password?.parentElement.querySelector('.password-strength');
    if (!strengthElement && domElements.password) {
        strengthElement = document.createElement('div');
        strengthElement.className = 'password-strength';
        strengthElement.style.marginTop = '0.5rem';
        domElements.password.parentElement.appendChild(strengthElement);
    }
    
    if (strengthElement && password.length > 0) {
        strengthElement.innerHTML = `
            <div class="strength-bar" style="width: 100%; height: 4px; background-color: #e9ecef; border-radius: 2px; overflow: hidden;">
                <div class="strength-fill" style="height: 100%; background-color: ${getStrengthColor(level)}; width: ${score}%; transition: width 0.3s ease;"></div>
            </div>
            <div class="strength-text" style="font-size: 0.75rem; margin-top: 0.25rem; color: ${getStrengthColor(level)};">
                Password strength: ${level}
            </div>
        `;
        strengthElement.style.display = 'block';
    } else if (strengthElement) {
        strengthElement.style.display = 'none';
    }
}

function getStrengthColor(level) {
    const colors = {
        weak: '#dc3545',
        fair: '#fd7e14',
        medium: '#ffc107',
        strong: '#198754'
    };
    return colors[level] || colors.weak;
}

// Password strength utility
function getPasswordStrength(password) {
    let strength = 0;
    if (password.length >= 8) strength++;
    if (/[A-Z]/.test(password)) strength++;
    if (/[a-z]/.test(password)) strength++;
    if (/\d/.test(password)) strength++;
    if (/[^A-Za-z\d]/.test(password)) strength++;
    
    return strength;
}

// Listen for auth state changes
authService.onAuthStateChange(async (user, role) => {
    if (user && user.emailVerified) {
        const pendingData = SecureStorage.getItem('pending_patient_data');
        if (pendingData) {
            try {
                await createPatientDocument(user, pendingData);
                SecureStorage.removeItem('pending_patient_data');
                console.log('Patient document created after email verification');
            } catch (error) {
                console.error('Error creating patient document:', error);
            }
        }
    }
});

// Cleanup on page unload
window.addEventListener('beforeunload', () => {
    signUpState.clearAllTimeouts();
    signUpState.reset();
});

// Initialize
console.log('✅ Patient Registration page loaded');
console.log('Current domain:', window.location.hostname);
