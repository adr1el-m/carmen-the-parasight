// Custom Authentication Service using Secure Tokens and Postgres Backend
import logger from '../utils/logger.js';
import * as secureErrorHandler from './secure-error-handler.js';
import { handleAuthError } from './auth-error-handler.js';

const USER_ROLES = {
    ADMIN: 'admin',
    DOCTOR: 'doctor',
    NURSE: 'nurse', 
    PATIENT: 'patient',
    CLINIC_STAFF: 'clinic_staff',
    ORGANIZATION_ADMIN: 'organization_admin',
    ORGANIZATION_MEMBER: 'organization_member',
    SYSTEM_ADMIN: 'system_admin'
};

const SECURE_SESSION_KEYS = {
    SESSION_START: 'auth_session_start',
    LAST_ACTIVITY: 'auth_last_activity',
    LOGIN_ATTEMPTS: 'auth_login_attempts',
    LOCKOUT_UNTIL: 'auth_lockout_until',
    TOKEN: 'auth_session_token',
    USER_DATA: 'auth_user_data'
};

class AuthService {
    constructor() {
        this.currentUser = null;
        this.userRole = null;
        this.authListeners = [];
        this.isInitialized = false;
        
        // Restore session from localStorage if exists
        const token = localStorage.getItem(SECURE_SESSION_KEYS.TOKEN);
        const userDataStr = localStorage.getItem(SECURE_SESSION_KEYS.USER_DATA);
        
        if (token && userDataStr) {
            try {
                this.currentUser = JSON.parse(userDataStr);
                this.userRole = this.currentUser.role || USER_ROLES.PATIENT;
            } catch(e) {
                this.clearSession();
            }
        }
        
        this.isInitialized = true;
        logger.info('Authentication Service initialized (Secure Session Tokens)');
    }

    async waitForInitialization() {
        return Promise.resolve();
    }

    onAuthStateChanged(callback) {
        this.authListeners.push(callback);
        callback(this.currentUser, this.userRole);
        return () => {
            this.authListeners = this.authListeners.filter(cb => cb !== callback);
        };
    }

    notifyAuthListeners() {
        this.authListeners.forEach(callback => {
            try {
                callback(this.currentUser, this.userRole);
            } catch (e) {
                console.error('Error in auth listener:', e);
            }
        });
    }

    clearSession() {
        this.currentUser = null;
        this.userRole = null;
        localStorage.removeItem(SECURE_SESSION_KEYS.TOKEN);
        localStorage.removeItem(SECURE_SESSION_KEYS.USER_DATA);
    }

    async loginWithEmail(email, password) {
        try {
            const res = await fetch('/api/auth/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password })
            });
            const data = await res.json();
            
            if (!res.ok) {
                throw new Error(data.error || 'Login failed');
            }
            
            this.currentUser = data.user;
            this.userRole = data.user.role || USER_ROLES.PATIENT;
            
            localStorage.setItem(SECURE_SESSION_KEYS.TOKEN, data.token);
            localStorage.setItem(SECURE_SESSION_KEYS.USER_DATA, JSON.stringify(data.user));
            
            this.notifyAuthListeners();
            return data.user;
        } catch (error) {
            throw handleAuthError(error);
        }
    }

    async loginWithGooglePopup() {
        throw new Error("Google login is no longer supported in the new Haliya platform. Please use email and password.");
    }

    async registerWithEmail(email, password, userData = {}) {
        try {
            const res = await fetch('/api/auth/register', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                    email, 
                    password, 
                    firstName: userData.firstName || 'New',
                    lastName: userData.lastName || 'Patient'
                })
            });
            const data = await res.json();
            
            if (!res.ok) {
                throw new Error(data.error || 'Registration failed');
            }
            
            return data.user;
        } catch (error) {
            throw handleAuthError(error);
        }
    }

    async logout() {
        this.clearSession();
        this.notifyAuthListeners();
    }
    
    getToken() {
        return localStorage.getItem(SECURE_SESSION_KEYS.TOKEN);
    }
    
    getCurrentUser() {
        return this.currentUser;
    }
}

const authService = new AuthService();
const auth = null; // Removed Firebase auth reference

export { authService as default, AuthService, USER_ROLES, SECURE_SESSION_KEYS, auth };