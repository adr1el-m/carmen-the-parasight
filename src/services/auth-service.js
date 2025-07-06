// Comprehensive Authentication Service
// Handles session management, email verification, and role-based access control

import { initializeApp, getApps, getApp } from 'firebase/app';
import { 
    getAuth, 
    createUserWithEmailAndPassword, 
    signInWithEmailAndPassword,
    signInWithPopup, 
    signInWithRedirect,
    getRedirectResult,
    GoogleAuthProvider,
    updateProfile,
    sendEmailVerification,
    signOut,
    onAuthStateChanged,
    updatePassword,
    reauthenticateWithCredential,
    EmailAuthProvider,
    deleteUser,
    reload
} from 'firebase/auth';
import { 
    getFirestore, 
    doc, 
    setDoc,
    getDoc,
    updateDoc,
    deleteDoc,
    serverTimestamp,
    query,
    where,
    getDocs,
    collection
} from 'firebase/firestore';

// Import Firebase configuration
import { firebaseConfig } from './config.js';

// Initialize Firebase (avoid duplicate initialization)
let app;
let auth;
let db;

try {
    // Check if Firebase is already initialized
    if (getApps().length === 0) {
        app = initializeApp(firebaseConfig);
        console.log('Firebase initialized by Auth Service');
    } else {
        app = getApp();
        console.log('Using existing Firebase instance');
    }
    
    auth = getAuth(app);
    db = getFirestore(app);
    
} catch (error) {
    console.error('Firebase initialization error:', error);
    throw error;
}

// Configure Google Provider
const googleProvider = new GoogleAuthProvider();
googleProvider.addScope('email');
googleProvider.addScope('profile');
googleProvider.setCustomParameters({
    prompt: 'select_account'
});

// Session management constants
const SESSION_TIMEOUT = 30 * 60 * 1000; // 30 minutes
const SESSION_WARNING_TIME = 5 * 60 * 1000; // 5 minutes before timeout
const MAX_LOGIN_ATTEMPTS = 5;
const LOCKOUT_DURATION = 15 * 60 * 1000; // 15 minutes

// User roles
const USER_ROLES = {
    ADMIN: 'admin',
    DOCTOR: 'doctor',
    NURSE: 'nurse', 
    PATIENT: 'patient',
    CLINIC_STAFF: 'clinic_staff'
};

// Session storage keys
const SESSION_KEYS = {
    USER_DATA: 'auth_user_data',
    SESSION_START: 'auth_session_start',
    LAST_ACTIVITY: 'auth_last_activity',
    LOGIN_ATTEMPTS: 'auth_login_attempts',
    LOCKOUT_UNTIL: 'auth_lockout_until'
};

/**
 * Authentication Service Class
 */
class AuthService {
    constructor() {
        this.currentUser = null;
        this.userRole = null;
        this.sessionTimer = null;
        this.warningTimer = null;
        this.authListeners = [];
        this.sessionListeners = [];
        
        // Initialize session management
        this.initializeSessionManagement();
        
        // Set up auth state listener
        this.setupAuthStateListener();
        
        console.log('Authentication Service initialized');
    }

    /**
     * Initialize session management
     */
    initializeSessionManagement() {
        // Check for existing session
        const sessionStart = localStorage.getItem(SESSION_KEYS.SESSION_START);
        const lastActivity = localStorage.getItem(SESSION_KEYS.LAST_ACTIVITY);
        
        if (sessionStart && lastActivity) {
            const now = Date.now();
            const sessionAge = now - parseInt(sessionStart);
            const timeSinceActivity = now - parseInt(lastActivity);
            
            // Check if session has expired
            if (sessionAge > SESSION_TIMEOUT || timeSinceActivity > SESSION_TIMEOUT) {
                this.clearSession();
                this.redirectToLogin('Session expired. Please login again.');
                return;
            }
            
            // Update last activity
            this.updateLastActivity();
        }
        
        // Set up activity tracking
        this.setupActivityTracking();
    }

    /**
     * Set up activity tracking
     */
    setupActivityTracking() {
        const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart', 'click'];
        
        events.forEach(event => {
            document.addEventListener(event, () => {
                this.updateLastActivity();
            }, { passive: true });
        });
    }

    /**
     * Update last activity timestamp
     */
    updateLastActivity() {
        localStorage.setItem(SESSION_KEYS.LAST_ACTIVITY, Date.now().toString());
        
        // Reset session timer
        if (this.sessionTimer) {
            clearTimeout(this.sessionTimer);
        }
        
        if (this.warningTimer) {
            clearTimeout(this.warningTimer);
        }
        
        // Set up session warning
        this.warningTimer = setTimeout(() => {
            this.showSessionWarning();
        }, SESSION_TIMEOUT - SESSION_WARNING_TIME);
        
        // Set up session timeout
        this.sessionTimer = setTimeout(() => {
            this.handleSessionTimeout();
        }, SESSION_TIMEOUT);
    }

    /**
     * Show session warning
     */
    showSessionWarning() {
        const proceed = confirm('Your session will expire in 5 minutes. Click OK to continue your session.');
        
        if (proceed) {
            this.updateLastActivity();
        } else {
            this.logout();
        }
    }

    /**
     * Handle session timeout
     */
    handleSessionTimeout() {
        this.clearSession();
        this.logout();
        this.redirectToLogin('Your session has expired. Please login again.');
    }

    /**
     * Set up auth state listener
     */
    setupAuthStateListener() {
        onAuthStateChanged(auth, async (user) => {
            if (user) {
                console.log('User authenticated:', user.uid);
                
                // Check email verification
                if (!user.emailVerified && this.requireEmailVerification()) {
                    console.log('Email not verified, requesting verification');
                    await this.handleUnverifiedEmail(user);
                    return;
                }
                
                // Load user data and role
                await this.loadUserData(user);
                
                // Start session
                this.startSession(user);
                
                // Update last login in patient document if user is a patient
                if (this.userRole === USER_ROLES.PATIENT) {
                    this.updatePatientLastLogin(user.uid);
                }
                
                // Notify listeners
                this.notifyAuthListeners(user, this.userRole);
            } else {
                console.log('User not authenticated');
                this.currentUser = null;
                this.userRole = null;
                this.clearSession();
                this.notifyAuthListeners(null, null);
            }
        });
    }

    /**
     * Check if email verification is required
     */
    requireEmailVerification() {
        // Always require email verification for new users
        return true;
    }

    /**
     * Handle unverified email
     */
    async handleUnverifiedEmail(user) {
        try {
            // Send verification email
            await sendEmailVerification(user);
            
            // Show verification message
            this.showEmailVerificationMessage(user.email);
            
            // Sign out user until email is verified
            await signOut(auth);
            
        } catch (error) {
            console.error('Error sending verification email:', error);
            throw new Error('Failed to send verification email');
        }
    }

    /**
     * Show email verification message
     */
    showEmailVerificationMessage(email) {
        const message = `
            <div style="position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.8); z-index: 10000; display: flex; align-items: center; justify-content: center;">
                <div style="background: white; padding: 30px; border-radius: 10px; max-width: 500px; text-align: center;">
                    <h3>Email Verification Required</h3>
                    <p>We've sent a verification email to <strong>${email}</strong></p>
                    <p>Please check your email and click the verification link before proceeding.</p>
                    <button onclick="window.location.reload()" style="background: #007bff; color: white; border: none; padding: 10px 20px; border-radius: 5px; cursor: pointer; margin-top: 20px;">
                        I've Verified My Email
                    </button>
                </div>
            </div>
        `;
        
        document.body.insertAdjacentHTML('beforeend', message);
    }

    /**
     * Load user data and role
     */
    async loadUserData(user) {
        try {
            // Get user document from Firestore
            const userDoc = await getDoc(doc(db, 'users', user.uid));
            
            if (userDoc.exists()) {
                const userData = userDoc.data();
                this.userRole = userData.role || USER_ROLES.PATIENT;
                
                // Update last login
                await updateDoc(doc(db, 'users', user.uid), {
                    lastLogin: serverTimestamp(),
                    lastActivity: serverTimestamp()
                });
            } else {
                // Create user document if it doesn't exist
                await this.createUserDocument(user);
            }
            
            this.currentUser = user;
            
        } catch (error) {
            console.error('Error loading user data:', error);
            throw new Error('Failed to load user data');
        }
    }

    /**
     * Create user document
     */
    async createUserDocument(user) {
        try {
            const userData = {
                uid: user.uid,
                email: user.email,
                displayName: user.displayName,
                photoURL: user.photoURL,
                role: USER_ROLES.PATIENT, // Default role
                emailVerified: user.emailVerified,
                createdAt: serverTimestamp(),
                lastLogin: serverTimestamp(),
                isActive: true
            };
            
            await setDoc(doc(db, 'users', user.uid), userData);
            this.userRole = USER_ROLES.PATIENT;
            
        } catch (error) {
            console.error('Error creating user document:', error);
            throw new Error('Failed to create user document');
        }
    }

    /**
     * Update patient last login (using dynamic import to avoid circular dependencies)
     */
    async updatePatientLastLogin(userId) {
        try {
            const { updateLastLogin } = await import('./firestoredb.js');
            await updateLastLogin(userId);
        } catch (error) {
            console.error('Error updating patient last login:', error);
        }
    }

    /**
     * Start session
     */
    startSession(user) {
        const now = Date.now();
        
        // Store session data
        localStorage.setItem(SESSION_KEYS.SESSION_START, now.toString());
        localStorage.setItem(SESSION_KEYS.LAST_ACTIVITY, now.toString());
        localStorage.setItem(SESSION_KEYS.USER_DATA, JSON.stringify({
            uid: user.uid,
            email: user.email,
            displayName: user.displayName,
            role: this.userRole,
            emailVerified: user.emailVerified
        }));
        
        // Set up session management
        this.updateLastActivity();
        
        console.log('Session started for user:', user.uid);
    }

    /**
     * Clear session
     */
    clearSession() {
        // Clear session timers
        if (this.sessionTimer) {
            clearTimeout(this.sessionTimer);
            this.sessionTimer = null;
        }
        
        if (this.warningTimer) {
            clearTimeout(this.warningTimer);
            this.warningTimer = null;
        }
        
        // Clear session data
        Object.values(SESSION_KEYS).forEach(key => {
            localStorage.removeItem(key);
        });
        
        console.log('Session cleared');
    }

    /**
     * Check if user is locked out
     */
    isLockedOut() {
        const lockoutUntil = localStorage.getItem(SESSION_KEYS.LOCKOUT_UNTIL);
        if (lockoutUntil) {
            const now = Date.now();
            const lockoutTime = parseInt(lockoutUntil);
            
            if (now < lockoutTime) {
                return true;
            } else {
                // Lockout expired, clear it
                localStorage.removeItem(SESSION_KEYS.LOCKOUT_UNTIL);
                localStorage.removeItem(SESSION_KEYS.LOGIN_ATTEMPTS);
                return false;
            }
        }
        return false;
    }

    /**
     * Track login attempts
     */
    trackLoginAttempt(success = false) {
        if (success) {
            // Clear login attempts on success
            localStorage.removeItem(SESSION_KEYS.LOGIN_ATTEMPTS);
            localStorage.removeItem(SESSION_KEYS.LOCKOUT_UNTIL);
            return;
        }
        
        // Increment failed attempts
        const attempts = parseInt(localStorage.getItem(SESSION_KEYS.LOGIN_ATTEMPTS) || '0') + 1;
        localStorage.setItem(SESSION_KEYS.LOGIN_ATTEMPTS, attempts.toString());
        
        // Check if max attempts reached
        if (attempts >= MAX_LOGIN_ATTEMPTS) {
            const lockoutUntil = Date.now() + LOCKOUT_DURATION;
            localStorage.setItem(SESSION_KEYS.LOCKOUT_UNTIL, lockoutUntil.toString());
            
            throw new Error(`Too many failed login attempts. Account locked for ${LOCKOUT_DURATION / 60000} minutes.`);
        }
        
        const remainingAttempts = MAX_LOGIN_ATTEMPTS - attempts;
        throw new Error(`Invalid credentials. ${remainingAttempts} attempts remaining.`);
    }

    /**
     * Login with email and password
     */
    async loginWithEmail(email, password) {
        try {
            // Check if locked out
            if (this.isLockedOut()) {
                const lockoutUntil = localStorage.getItem(SESSION_KEYS.LOCKOUT_UNTIL);
                const timeRemaining = Math.ceil((parseInt(lockoutUntil) - Date.now()) / 60000);
                throw new Error(`Account locked. Try again in ${timeRemaining} minutes.`);
            }
            
            // Attempt login
            const userCredential = await signInWithEmailAndPassword(auth, email, password);
            
            // Track successful login
            this.trackLoginAttempt(true);
            
            console.log('Login successful');
            return userCredential.user;
            
        } catch (error) {
            console.error('Login error:', error);
            
            // Track failed login attempt
            if (error.code === 'auth/invalid-credential' || 
                error.code === 'auth/user-not-found' ||
                error.code === 'auth/wrong-password') {
                this.trackLoginAttempt(false);
            }
            
            throw error;
        }
    }

    /**
     * Register with email and password
     */
    async registerWithEmail(email, password, userData = {}) {
        try {
            // Create user account
            const userCredential = await createUserWithEmailAndPassword(auth, email, password);
            const user = userCredential.user;
            
            // Update profile if display name provided
            if (userData.displayName) {
                await updateProfile(user, {
                    displayName: userData.displayName
                });
            }
            
            // Send email verification
            await sendEmailVerification(user);
            
            // Create user document
            await this.createUserDocument(user);
            
            // Sign out until email is verified
            await signOut(auth);
            
            console.log('Registration successful, verification email sent');
            return user;
            
        } catch (error) {
            console.error('Registration error:', error);
            throw error;
        }
    }

    /**
     * Login with Google
     */
    async loginWithGoogle() {
        try {
            console.log('Starting Google authentication...');
            console.log('Current domain:', window.location.hostname);
            console.log('Firebase config domain:', firebaseConfig.authDomain);
            
            let result;
            
            // Check for redirect result first (in case popup was blocked and redirect was used)
            try {
                const redirectResult = await getRedirectResult(auth);
                if (redirectResult) {
                    console.log('Google login via redirect successful');
                    return redirectResult.user;
                }
            } catch (redirectError) {
                console.log('No redirect result or redirect error:', redirectError);
            }
            
            // Try popup first
            try {
                console.log('Attempting Google sign-in with popup...');
                result = await signInWithPopup(auth, googleProvider);
                console.log('Google popup login successful');
                return result.user;
                
            } catch (popupError) {
                console.log('Popup error:', popupError);
                
                // Handle specific popup errors
                if (popupError.code === 'auth/popup-blocked') {
                    console.log('Popup blocked, trying redirect...');
                    await signInWithRedirect(auth, googleProvider);
                    return null; // Redirect will reload the page
                } else if (popupError.code === 'auth/popup-closed-by-user') {
                    throw new Error('Sign-in was cancelled. Please try again.');
                } else if (popupError.code === 'auth/unauthorized-domain') {
                    throw new Error(`Domain "${window.location.hostname}" is not authorized. Please add it to Firebase Console > Authentication > Settings > Authorized Domains.`);
                } else if (popupError.code === 'auth/operation-not-allowed') {
                    throw new Error('Google sign-in is not enabled. Please enable it in Firebase Console > Authentication > Sign-in method.');
                } else if (popupError.code === 'auth/cancelled-popup-request') {
                    // Multiple popup requests, ignore
                    return null;
                } else {
                    // For other errors, try redirect as fallback
                    console.log('Popup failed, trying redirect as fallback...');
                    try {
                        await signInWithRedirect(auth, googleProvider);
                        return null; // Redirect will reload the page
                    } catch (redirectError) {
                        console.error('Redirect also failed:', redirectError);
                        throw popupError; // Throw original popup error
                    }
                }
            }
            
        } catch (error) {
            console.error('Google login error:', error);
            
            // Provide user-friendly error messages
            if (error.message.includes('Domain')) {
                throw error; // Already user-friendly
            } else if (error.message.includes('not enabled')) {
                throw error; // Already user-friendly
            } else if (error.code === 'auth/network-request-failed') {
                throw new Error('Network error. Please check your internet connection and try again.');
            } else if (error.code === 'auth/too-many-requests') {
                throw new Error('Too many attempts. Please wait a moment and try again.');
            } else if (error.code === 'auth/user-disabled') {
                throw new Error('This Google account has been disabled. Please contact support.');
            } else {
                throw new Error(`Google sign-in failed: ${error.message || 'Unknown error'}`);
            }
        }
    }

    /**
     * Logout user
     */
    async logout() {
        try {
            await signOut(auth);
            this.clearSession();
            console.log('Logout successful');
            
        } catch (error) {
            console.error('Logout error:', error);
            throw error;
        }
    }

    /**
     * Update user password
     */
    async updateUserPassword(currentPassword, newPassword) {
        try {
            if (!this.currentUser) {
                throw new Error('No authenticated user');
            }
            
            // Re-authenticate user
            const credential = EmailAuthProvider.credential(this.currentUser.email, currentPassword);
            await reauthenticateWithCredential(this.currentUser, credential);
            
            // Update password
            await updatePassword(this.currentUser, newPassword);
            
            console.log('Password updated successfully');
            
        } catch (error) {
            console.error('Password update error:', error);
            throw error;
        }
    }

    /**
     * Delete user account
     */
    async deleteAccount(password) {
        try {
            if (!this.currentUser) {
                throw new Error('No authenticated user');
            }
            
            // Re-authenticate user
            const credential = EmailAuthProvider.credential(this.currentUser.email, password);
            await reauthenticateWithCredential(this.currentUser, credential);
            
            // Delete user document
            await deleteDoc(doc(db, 'users', this.currentUser.uid));
            
            // Delete patient document if exists
            try {
                await deleteDoc(doc(db, 'patients', this.currentUser.uid));
            } catch (error) {
                console.log('No patient document to delete');
            }
            
            // Delete user account
            await deleteUser(this.currentUser);
            
            this.clearSession();
            console.log('Account deleted successfully');
            
        } catch (error) {
            console.error('Account deletion error:', error);
            throw error;
        }
    }

    /**
     * Update user role (admin only)
     */
    async updateUserRole(userId, newRole) {
        try {
            // Check if current user is admin
            if (this.userRole !== USER_ROLES.ADMIN) {
                throw new Error('Insufficient permissions');
            }
            
            // Validate role
            if (!Object.values(USER_ROLES).includes(newRole)) {
                throw new Error('Invalid role');
            }
            
            // Update user document
            await updateDoc(doc(db, 'users', userId), {
                role: newRole,
                roleUpdatedAt: serverTimestamp(),
                roleUpdatedBy: this.currentUser.uid
            });
            
            console.log(`User ${userId} role updated to ${newRole}`);
            
        } catch (error) {
            console.error('Role update error:', error);
            throw error;
        }
    }

    /**
     * Check if user has required role
     */
    hasRole(requiredRole) {
        if (Array.isArray(requiredRole)) {
            return requiredRole.includes(this.userRole);
        }
        return this.userRole === requiredRole;
    }

    /**
     * Check if user has permission
     */
    hasPermission(permission) {
        const rolePermissions = {
            [USER_ROLES.ADMIN]: ['all'],
            [USER_ROLES.DOCTOR]: ['read_patients', 'write_patients', 'read_appointments', 'write_appointments'],
            [USER_ROLES.NURSE]: ['read_patients', 'read_appointments', 'write_appointments'],
            [USER_ROLES.CLINIC_STAFF]: ['read_appointments', 'write_appointments'],
            [USER_ROLES.PATIENT]: ['read_own_data', 'write_own_data']
        };
        
        const userPermissions = rolePermissions[this.userRole] || [];
        return userPermissions.includes('all') || userPermissions.includes(permission);
    }

    /**
     * Get current user
     */
    getCurrentUser() {
        return this.currentUser;
    }

    /**
     * Get user role
     */
    getUserRole() {
        return this.userRole;
    }

    /**
     * Check if user is authenticated
     */
    isAuthenticated() {
        return this.currentUser !== null;
    }

    /**
     * Add auth state listener
     */
    onAuthStateChange(callback) {
        this.authListeners.push(callback);
        
        // Return unsubscribe function
        return () => {
            const index = this.authListeners.indexOf(callback);
            if (index > -1) {
                this.authListeners.splice(index, 1);
            }
        };
    }

    /**
     * Notify auth listeners
     */
    notifyAuthListeners(user, role) {
        this.authListeners.forEach(callback => {
            try {
                callback(user, role);
            } catch (error) {
                console.error('Auth listener error:', error);
            }
        });
    }

    /**
     * Redirect to login
     */
    redirectToLogin(message = '') {
        if (message) {
            localStorage.setItem('auth_message', message);
        }
        
        // Determine redirect URL based on current location
        const currentPath = window.location.pathname;
        
        if (currentPath.includes('admin')) {
            window.location.href = '/admin/login.html';
        } else if (currentPath.includes('doctor')) {
            window.location.href = '/doctor/login.html';
        } else {
            window.location.href = '/pages/patientSign-in.html';
        }
    }

    /**
     * Redirect after login based on role
     */
    redirectAfterLogin() {
        switch (this.userRole) {
            case USER_ROLES.ADMIN:
                window.location.href = '/admin/dashboard.html';
                break;
            case USER_ROLES.DOCTOR:
                window.location.href = '/doctor/dashboard.html';
                break;
            case USER_ROLES.NURSE:
                window.location.href = '/nurse/dashboard.html';
                break;
            case USER_ROLES.CLINIC_STAFF:
                window.location.href = '/staff/dashboard.html';
                break;
            case USER_ROLES.PATIENT:
                window.location.href = '/pages/patientPortal.html';
                break;
            default:
                window.location.href = '/pages/patientPortal.html';
        }
    }

    /**
     * Get session info
     */
    getSessionInfo() {
        const sessionStart = localStorage.getItem(SESSION_KEYS.SESSION_START);
        const lastActivity = localStorage.getItem(SESSION_KEYS.LAST_ACTIVITY);
        
        if (!sessionStart || !lastActivity) {
            return null;
        }
        
        const now = Date.now();
        const sessionAge = now - parseInt(sessionStart);
        const timeSinceActivity = now - parseInt(lastActivity);
        
        return {
            sessionStart: parseInt(sessionStart),
            lastActivity: parseInt(lastActivity),
            sessionAge,
            timeSinceActivity,
            timeRemaining: SESSION_TIMEOUT - timeSinceActivity
        };
    }
}

// Create singleton instance
const authService = new AuthService();

// Export service and constants
export { authService as default, AuthService, USER_ROLES, SESSION_KEYS };

console.log('Authentication Service module loaded'); 