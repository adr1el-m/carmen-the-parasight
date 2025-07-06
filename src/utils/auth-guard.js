// Authentication Guard
// Provides route protection and role-based access control

import authService, { USER_ROLES } from '../services/auth-service.js';

/**
 * Authentication Guard Class
 */
class AuthGuard {
    constructor() {
        this.protectedRoutes = new Map();
        this.currentRoute = window.location.pathname;
        this.initialized = false;
        
        console.log('Authentication Guard initialized');
    }

    /**
     * Initialize the auth guard
     */
    async initialize() {
        if (this.initialized) return;
        
        try {
            // Set up route protection rules
            this.setupRouteProtection();
            
            // Set up auth state listener
            authService.onAuthStateChange((user, role) => {
                this.handleAuthStateChange(user, role);
            });
            
            // Check current route protection
            await this.checkCurrentRoute();
            
            this.initialized = true;
            console.log('Auth Guard initialized successfully');
            
        } catch (error) {
            console.error('Error initializing Auth Guard:', error);
        }
    }

    /**
     * Set up route protection rules
     */
    setupRouteProtection() {
        // Define protected routes and their required roles
        const routes = [
            // Patient routes
            {
                path: '/pages/patientPortal.html',
                roles: [USER_ROLES.PATIENT],
                requireAuth: true,
                requireEmailVerification: true
            },
            {
                path: '/pages/patientDashboard.html',
                roles: [USER_ROLES.PATIENT],
                requireAuth: true,
                requireEmailVerification: true
            },
            
            // Admin routes
            {
                path: '/admin',
                roles: [USER_ROLES.ADMIN],
                requireAuth: true,
                requireEmailVerification: true
            },
            {
                path: '/admin/dashboard.html',
                roles: [USER_ROLES.ADMIN],
                requireAuth: true,
                requireEmailVerification: true
            },
            {
                path: '/admin/users.html',
                roles: [USER_ROLES.ADMIN],
                requireAuth: true,
                requireEmailVerification: true
            },
            
            // Doctor routes
            {
                path: '/doctor',
                roles: [USER_ROLES.DOCTOR, USER_ROLES.ADMIN],
                requireAuth: true,
                requireEmailVerification: true
            },
            {
                path: '/doctor/dashboard.html',
                roles: [USER_ROLES.DOCTOR, USER_ROLES.ADMIN],
                requireAuth: true,
                requireEmailVerification: true
            },
            {
                path: '/doctor/patients.html',
                roles: [USER_ROLES.DOCTOR, USER_ROLES.ADMIN],
                requireAuth: true,
                requireEmailVerification: true
            },
            
            // Nurse routes
            {
                path: '/nurse',
                roles: [USER_ROLES.NURSE, USER_ROLES.DOCTOR, USER_ROLES.ADMIN],
                requireAuth: true,
                requireEmailVerification: true
            },
            {
                path: '/nurse/dashboard.html',
                roles: [USER_ROLES.NURSE, USER_ROLES.DOCTOR, USER_ROLES.ADMIN],
                requireAuth: true,
                requireEmailVerification: true
            },
            
            // Staff routes
            {
                path: '/staff',
                roles: [USER_ROLES.CLINIC_STAFF, USER_ROLES.NURSE, USER_ROLES.DOCTOR, USER_ROLES.ADMIN],
                requireAuth: true,
                requireEmailVerification: true
            },
            
            // API routes (for fetch requests)
            {
                path: '/api',
                roles: [USER_ROLES.PATIENT, USER_ROLES.CLINIC_STAFF, USER_ROLES.NURSE, USER_ROLES.DOCTOR, USER_ROLES.ADMIN],
                requireAuth: true,
                requireEmailVerification: false
            }
        ];
        
        // Store route protection rules
        routes.forEach(route => {
            this.protectedRoutes.set(route.path, route);
        });
    }

    /**
     * Handle auth state changes
     */
    handleAuthStateChange(user, role) {
        console.log('Auth Guard: Auth state changed', { user: user?.uid, role });
        
        // Check if current route is still accessible
        this.checkCurrentRoute();
    }

    /**
     * Check if current route is protected and accessible
     */
    async checkCurrentRoute() {
        const currentPath = window.location.pathname;
        const protection = this.getRouteProtection(currentPath);
        
        if (!protection) {
            // Route is not protected
            return true;
        }
        
        console.log('Checking route protection for:', currentPath, protection);
        
        try {
            // Check authentication requirement
            if (protection.requireAuth && !authService.isAuthenticated()) {
                console.log('Route requires authentication but user is not authenticated');
                this.redirectToLogin('This page requires authentication');
                return false;
            }
            
            // Check email verification requirement
            if (protection.requireEmailVerification && authService.isAuthenticated()) {
                const user = authService.getCurrentUser();
                if (!user.emailVerified) {
                    console.log('Route requires email verification but email is not verified');
                    this.redirectToEmailVerification();
                    return false;
                }
            }
            
            // Check role requirement
            if (protection.roles && protection.roles.length > 0) {
                const userRole = authService.getUserRole();
                
                if (!userRole || !protection.roles.includes(userRole)) {
                    console.log('User role not authorized for this route', { userRole, requiredRoles: protection.roles });
                    this.redirectToUnauthorized();
                    return false;
                }
            }
            
            console.log('Route access granted');
            return true;
            
        } catch (error) {
            console.error('Error checking route protection:', error);
            this.redirectToLogin('An error occurred. Please login again.');
            return false;
        }
    }

    /**
     * Get route protection settings for a path
     */
    getRouteProtection(path) {
        // Check for exact match first
        if (this.protectedRoutes.has(path)) {
            return this.protectedRoutes.get(path);
        }
        
        // Check for partial matches (for directories)
        for (const [routePath, protection] of this.protectedRoutes) {
            if (path.startsWith(routePath)) {
                return protection;
            }
        }
        
        return null;
    }

    /**
     * Redirect to login page
     */
    redirectToLogin(message = '') {
        console.log('Redirecting to login:', message);
        
        if (message) {
            localStorage.setItem('auth_redirect_message', message);
        }
        
        // Store return URL
        localStorage.setItem('auth_return_url', window.location.href);
        
        // Redirect based on current path
        const currentPath = window.location.pathname;
        
        if (currentPath.includes('/admin')) {
            window.location.href = '/admin/login.html';
        } else if (currentPath.includes('/doctor')) {
            window.location.href = '/doctor/login.html';
        } else if (currentPath.includes('/nurse')) {
            window.location.href = '/nurse/login.html';
        } else if (currentPath.includes('/staff')) {
            window.location.href = '/staff/login.html';
        } else {
            window.location.href = '/pages/patientSign-in.html';
        }
    }

    /**
     * Redirect to email verification page
     */
    redirectToEmailVerification() {
        console.log('Redirecting to email verification');
        
        // Store return URL
        localStorage.setItem('auth_return_url', window.location.href);
        
        // Create email verification page if it doesn't exist
        window.location.href = '/email-verification.html';
    }

    /**
     * Redirect to unauthorized page
     */
    redirectToUnauthorized() {
        console.log('Redirecting to unauthorized page');
        
        // Show unauthorized message
        this.showUnauthorizedMessage();
    }

    /**
     * Show unauthorized access message
     */
    showUnauthorizedMessage() {
        const userRole = authService.getUserRole();
        const message = `
            <div style="position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.8); z-index: 10000; display: flex; align-items: center; justify-content: center;">
                <div style="background: white; padding: 30px; border-radius: 10px; max-width: 500px; text-align: center;">
                    <h3 style="color: #dc3545;">Access Denied</h3>
                    <p>You don't have permission to access this page.</p>
                    <p>Your role: <strong>${userRole || 'None'}</strong></p>
                    <div style="margin-top: 20px;">
                        <button onclick="window.history.back()" style="background: #6c757d; color: white; border: none; padding: 10px 20px; border-radius: 5px; cursor: pointer; margin-right: 10px;">
                            Go Back
                        </button>
                        <button onclick="window.location.href='/pages/patientPortal.html'" style="background: #007bff; color: white; border: none; padding: 10px 20px; border-radius: 5px; cursor: pointer;">
                            Go to Dashboard
                        </button>
                    </div>
                </div>
            </div>
        `;
        
        document.body.insertAdjacentHTML('beforeend', message);
    }

    /**
     * Protect a specific element based on role
     */
    protectElement(element, requiredRoles, hideIfUnauthorized = true) {
        if (!element) return;
        
        const userRole = authService.getUserRole();
        const hasAccess = Array.isArray(requiredRoles) 
            ? requiredRoles.includes(userRole)
            : userRole === requiredRoles;
        
        if (!hasAccess) {
            if (hideIfUnauthorized) {
                element.style.display = 'none';
            } else {
                element.style.opacity = '0.5';
                element.style.pointerEvents = 'none';
                element.title = 'You do not have permission to access this feature';
            }
        }
    }

    /**
     * Protect multiple elements based on role
     */
    protectElements(selector, requiredRoles, hideIfUnauthorized = true) {
        const elements = document.querySelectorAll(selector);
        elements.forEach(element => {
            this.protectElement(element, requiredRoles, hideIfUnauthorized);
        });
    }

    /**
     * Check if user has permission for an action
     */
    hasPermission(permission) {
        return authService.hasPermission(permission);
    }

    /**
     * Check if user has role
     */
    hasRole(role) {
        return authService.hasRole(role);
    }

    /**
     * Secure fetch wrapper that adds authentication headers
     */
    async secureFetch(url, options = {}) {
        const user = authService.getCurrentUser();
        
        if (!user) {
            throw new Error('Authentication required');
        }
        
        try {
            // Get ID token
            const idToken = await user.getIdToken();
            
            // Add authorization header
            const headers = {
                'Authorization': `Bearer ${idToken}`,
                'Content-Type': 'application/json',
                ...options.headers
            };
            
            // Make request
            const response = await fetch(url, {
                ...options,
                headers
            });
            
            // Check if unauthorized
            if (response.status === 401) {
                console.log('API request unauthorized, redirecting to login');
                this.redirectToLogin('Session expired. Please login again.');
                return;
            }
            
            // Check if forbidden
            if (response.status === 403) {
                console.log('API request forbidden');
                throw new Error('You do not have permission to perform this action');
            }
            
            return response;
            
        } catch (error) {
            console.error('Secure fetch error:', error);
            throw error;
        }
    }

    /**
     * Initialize page-specific protections
     */
    initializePageProtections() {
        // Wait for DOM to be ready
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => {
                this.applyPageProtections();
            });
        } else {
            this.applyPageProtections();
        }
    }

    /**
     * Apply page-specific protections
     */
    applyPageProtections() {
        // Protect admin-only elements
        this.protectElements('[data-admin-only]', [USER_ROLES.ADMIN]);
        
        // Protect doctor-only elements
        this.protectElements('[data-doctor-only]', [USER_ROLES.DOCTOR, USER_ROLES.ADMIN]);
        
        // Protect nurse-only elements
        this.protectElements('[data-nurse-only]', [USER_ROLES.NURSE, USER_ROLES.DOCTOR, USER_ROLES.ADMIN]);
        
        // Protect staff-only elements
        this.protectElements('[data-staff-only]', [USER_ROLES.CLINIC_STAFF, USER_ROLES.NURSE, USER_ROLES.DOCTOR, USER_ROLES.ADMIN]);
        
        // Protect patient-only elements
        this.protectElements('[data-patient-only]', [USER_ROLES.PATIENT]);
        
        // Show role-specific content
        this.showRoleSpecificContent();
    }

    /**
     * Show content based on user role
     */
    showRoleSpecificContent() {
        const userRole = authService.getUserRole();
        
        // Hide all role-specific content first
        document.querySelectorAll('[data-role]').forEach(element => {
            element.style.display = 'none';
        });
        
        // Show content for current role
        if (userRole) {
            document.querySelectorAll(`[data-role="${userRole}"]`).forEach(element => {
                element.style.display = '';
            });
            
            // Show content for "all authenticated users"
            document.querySelectorAll('[data-role="authenticated"]').forEach(element => {
                element.style.display = '';
            });
        } else {
            // Show content for unauthenticated users
            document.querySelectorAll('[data-role="unauthenticated"]').forEach(element => {
                element.style.display = '';
            });
        }
    }

    /**
     * Create middleware for protecting routes
     */
    createRouteMiddleware(requiredRoles = [], options = {}) {
        return async () => {
            const {
                requireAuth = true,
                requireEmailVerification = true,
                redirectOnFail = true
            } = options;
            
            // Check authentication
            if (requireAuth && !authService.isAuthenticated()) {
                if (redirectOnFail) {
                    this.redirectToLogin('Authentication required');
                }
                return false;
            }
            
            // Check email verification
            if (requireEmailVerification && authService.isAuthenticated()) {
                const user = authService.getCurrentUser();
                if (!user.emailVerified) {
                    if (redirectOnFail) {
                        this.redirectToEmailVerification();
                    }
                    return false;
                }
            }
            
            // Check roles
            if (requiredRoles.length > 0) {
                const userRole = authService.getUserRole();
                if (!userRole || !requiredRoles.includes(userRole)) {
                    if (redirectOnFail) {
                        this.redirectToUnauthorized();
                    }
                    return false;
                }
            }
            
            return true;
        };
    }
}

// Create singleton instance
const authGuard = new AuthGuard();

// Initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        authGuard.initialize();
        authGuard.initializePageProtections();
    });
} else {
    authGuard.initialize();
    authGuard.initializePageProtections();
}

// Export auth guard
export default authGuard;
export { AuthGuard, USER_ROLES };

console.log('Authentication Guard module loaded'); 