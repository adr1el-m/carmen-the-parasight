/**
 * Session Authentication Service
 * Custom session-based authentication using NeonDB.
 */

import authService from './auth-service';

// Authentication Token interfaces
export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  expiresAt: number;
}

export interface UserSession {
  userId: string;
  email: string;
  roles: string[];
  permissions: string[];
  facilities: string[];
  lastActivity: number;
  sessionId: string;
  isActive: boolean;
}

export interface AuthUser {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
  emailVerified: boolean;
  roles: string[];
  permissions: string[];
  facilities: string[];
  sessionId: string;
  lastLogin: Date;
  isActive: boolean;
}

export class SessionService {
  private static instance: SessionService;
  private currentUser: AuthUser | null = null;
  private currentSession: UserSession | null = null;

  private constructor() {
    this.initializeAuthListener();
  }

  public static getInstance(): SessionService {
    if (!SessionService.instance) {
      SessionService.instance = new SessionService();
    }
    return SessionService.instance;
  }

  private initializeAuthListener(): void {
    authService.onAuthStateChanged((user: any) => {
      if (user) {
        this.currentUser = {
          uid: user.id || user.uid,
          email: user.email,
          displayName: user.firstName ? `${user.firstName} ${user.lastName}` : 'User',
          photoURL: null,
          emailVerified: true,
          roles: [user.role || 'patient'],
          permissions: [],
          facilities: [],
          sessionId: 'session_' + Date.now(),
          lastLogin: new Date(),
          isActive: true
        };
        this.currentSession = {
          userId: this.currentUser.uid,
          email: this.currentUser.email || '',
          roles: this.currentUser.roles,
          permissions: [],
          facilities: [],
          lastActivity: Date.now(),
          sessionId: this.currentUser.sessionId,
          isActive: true
        };
      } else {
        this.currentUser = null;
        this.currentSession = null;
      }
    });
  }

  async signInWithEmail(email: string, password: string): Promise<AuthUser> {
    const user = await authService.loginWithEmail(email, password);
    return this.currentUser!;
  }

  async createUser(email: string, password: string, userData: any): Promise<AuthUser> {
    const user = await authService.registerWithEmail(email, password, userData);
    return this.currentUser!;
  }

  async signOut(): Promise<void> {
    await authService.logout();
  }

  getCurrentUser(): AuthUser | null {
    return this.currentUser;
  }

  getCurrentSession(): UserSession | null {
    return this.currentSession;
  }

  isAuthenticated(): boolean {
    return this.currentUser !== null;
  }

  hasRole(role: string): boolean {
    return this.currentUser?.roles.includes(role) || false;
  }

  hasAnyRole(roles: string[]): boolean {
    return this.currentUser?.roles.some(r => roles.includes(r)) || false;
  }

  hasPermission(permission: string): boolean {
    return true; // Simplified for now
  }

  hasFacilityAccess(facilityId: string): boolean {
    return true; // Simplified for now
  }

  canPerformAction(resource: string, action: string): boolean {
    return true;
  }

  isSessionValid(): boolean {
    return true;
  }

  getSessionTimeRemaining(): number {
    return 3600;
  }

  async refreshSession(): Promise<void> {
    // No-op for now
  }

  async updateUserPassword(currentPassword: string, newPassword: string): Promise<void> {
    // No-op for now
  }
}

export const sessionService = SessionService.getInstance();
export const getCurrentUser = () => sessionService.getCurrentUser();
export const isAuthenticated = () => sessionService.isAuthenticated();
export const hasRole = (role: string) => sessionService.hasRole(role);
export const hasPermission = (permission: string) => sessionService.hasPermission(permission);
export const canPerformAction = (resource: string, action: string) => sessionService.canPerformAction(resource, action);
