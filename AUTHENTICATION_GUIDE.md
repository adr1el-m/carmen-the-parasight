# Authentication & Authorization System Guide

## 🔐 Overview

This guide covers the comprehensive authentication and authorization system implemented for the LingapLink healthcare platform. The system provides secure JWT-based authentication, session management, and granular role-based access control (RBAC).

## ✨ Key Features

### **Authentication**
- ✅ JWT-based authentication with Firebase
- ✅ Email/password and Google OAuth sign-in
- ✅ Secure session management
- ✅ Automatic session refresh
- ✅ Session timeout with warnings
- ✅ Multi-factor authentication ready

### **Authorization**
- ✅ Role-based access control (RBAC)
- ✅ Granular permissions system
- ✅ Resource-action based permissions
- ✅ Facility-based access control
- ✅ Dynamic permission evaluation
- ✅ HIPAA-compliant access controls

### **Security**
- ✅ Secure session storage
- ✅ Automatic session invalidation
- ✅ Rate limiting protection
- ✅ Audit logging for all actions
- ✅ CSRF protection
- ✅ XSS prevention

## 🏗️ Architecture

### **Core Services**

1. **JWTAuthService** (`src/services/jwt-auth.service.ts`)
   - Handles authentication logic
   - Manages user sessions
   - Provides permission checks
   - Integrates with Firebase Auth

2. **PermissionService** (`src/services/permission.service.ts`)
   - Manages roles and permissions
   - Handles permission evaluation
   - Provides RBAC functionality
   - Caches permissions for performance

3. **SessionManager** (`src/components/SessionManager.tsx`)
   - Manages session timeouts
   - Shows session warnings
   - Handles session refresh
   - Provides user feedback

4. **PermissionGuard** (`src/components/PermissionGuard.tsx`)
   - Protects routes and components
   - Checks user permissions
   - Provides access control
   - Shows appropriate fallbacks

5. **AuthContext** (`src/contexts/AuthContext.tsx`)
   - React context for auth state
   - Provides auth methods
   - Manages user state
   - Offers utility hooks

## 🚀 Quick Start

### **1. Setup Authentication Provider**

Wrap your app with the `AuthProvider`:

```tsx
import { AuthProvider } from './contexts/AuthContext';
import { SessionManager } from './components/SessionManager';

function App() {
  return (
    <AuthProvider>
      <SessionManager>
        {/* Your app components */}
      </SessionManager>
    </AuthProvider>
  );
}
```

### **2. Use Authentication in Components**

```tsx
import { useAuth } from './contexts/AuthContext';

function MyComponent() {
  const { user, isAuthenticated, signIn, signOut } = useAuth();

  if (!isAuthenticated) {
    return <div>Please sign in</div>;
  }

  return (
    <div>
      <h1>Welcome, {user?.displayName}</h1>
      <button onClick={signOut}>Sign Out</button>
    </div>
  );
}
```

### **3. Protect Routes with Permissions**

```tsx
import { PermissionGuard } from './components/PermissionGuard';

function AdminPanel() {
  return (
    <PermissionGuard requiredRoles={['admin', 'system_admin']}>
      <div>Admin Panel Content</div>
    </PermissionGuard>
  );
}
```

## 🔑 Authentication Methods

### **Email/Password Sign In**

```tsx
import { useAuth } from './contexts/AuthContext';

function SignInForm() {
  const { signIn } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await signIn(email, password);
      // Redirect or show success message
    } catch (error) {
      // Handle error
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <input
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="Email"
        required
      />
      <input
        type="password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        placeholder="Password"
        required
      />
      <button type="submit">Sign In</button>
    </form>
  );
}
```

### **Google OAuth Sign In**

```tsx
import { useAuth } from './contexts/AuthContext';

function GoogleSignIn() {
  const { signInWithGoogle } = useAuth();

  const handleGoogleSignIn = async () => {
    try {
      await signInWithGoogle();
      // Redirect or show success message
    } catch (error) {
      // Handle error
    }
  };

  return (
    <button onClick={handleGoogleSignIn}>
      Sign in with Google
    </button>
  );
}
```

### **User Registration**

```tsx
import { useAuth } from './contexts/AuthContext';

function SignUpForm() {
  const { signUp } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await signUp(email, password, {
        displayName,
        roles: ['patient'], // Default role
        facilities: []
      });
      // Redirect or show success message
    } catch (error) {
      // Handle error
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <input
        type="text"
        value={displayName}
        onChange={(e) => setDisplayName(e.target.value)}
        placeholder="Full Name"
        required
      />
      <input
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="Email"
        required
      />
      <input
        type="password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        placeholder="Password"
        required
      />
      <button type="submit">Sign Up</button>
    </form>
  );
}
```

## 🛡️ Permission System

### **Predefined Permissions**

The system includes healthcare-specific permissions:

```typescript
import { HEALTHCARE_PERMISSIONS } from './services/permission.service';

// Patient data permissions
HEALTHCARE_PERMISSIONS.PATIENT_READ      // 'patient:read'
HEALTHCARE_PERMISSIONS.PATIENT_CREATE    // 'patient:create'
HEALTHCARE_PERMISSIONS.PATIENT_UPDATE    // 'patient:update'
HEALTHCARE_PERMISSIONS.PATIENT_DELETE    // 'patient:delete'

// Medical records permissions
HEALTHCARE_PERMISSIONS.MEDICAL_RECORD_READ   // 'medical_record:read'
HEALTHCARE_PERMISSIONS.MEDICAL_RECORD_CREATE // 'medical_record:create'
HEALTHCARE_PERMISSIONS.MEDICAL_RECORD_UPDATE // 'medical_record:update'

// Appointment permissions
HEALTHCARE_PERMISSIONS.APPOINTMENT_READ   // 'appointment:read'
HEALTHCARE_PERMISSIONS.APPOINTMENT_CREATE // 'appointment:create'
HEALTHCARE_PERMISSIONS.APPOINTMENT_UPDATE // 'appointment:update'

// Consent permissions
HEALTHCARE_PERMISSIONS.CONSENT_READ   // 'consent:read'
HEALTHCARE_PERMISSIONS.CONSENT_CREATE // 'consent:create'
HEALTHCARE_PERMISSIONS.CONSENT_UPDATE // 'consent:update'
```

### **Predefined Roles**

```typescript
import { HEALTHCARE_ROLES } from './services/permission.service';

// System roles with different permission levels
HEALTHCARE_ROLES.SYSTEM_ADMIN        // Full system access
HEALTHCARE_ROLES.COMPLIANCE_OFFICER  // HIPAA compliance access
HEALTHCARE_ROLES.FACILITY_ADMIN      // Facility management
HEALTHCARE_ROLES.DOCTOR              // Healthcare provider
HEALTHCARE_ROLES.NURSE               // Healthcare provider
HEALTHCARE_ROLES.CLINIC_STAFF        // Support staff
HEALTHCARE_ROLES.PATIENT             // Patient access
```

### **Permission Checks**

```tsx
import { useAuth } from './contexts/AuthContext';

function MyComponent() {
  const { hasPermission, canPerformAction, hasRole } = useAuth();

  // Check specific permission
  if (!hasPermission('patient:read')) {
    return <div>Access denied</div>;
  }

  // Check resource-action permission
  if (!canPerformAction('medical_record', 'create')) {
    return <div>Cannot create medical records</div>;
  }

  // Check role
  if (!hasRole('doctor')) {
    return <div>Doctor access required</div>;
  }

  return <div>Protected content</div>;
}
```

## 🔒 Route Protection

### **Basic Route Protection**

```tsx
import { PermissionGuard } from './components/PermissionGuard';

function ProtectedRoute() {
  return (
    <PermissionGuard requiredRoles={['admin']}>
      <AdminPanel />
    </PermissionGuard>
  );
}
```

### **Resource-Based Protection**

```tsx
function PatientRecord() {
  return (
    <PermissionGuard 
      requiredResource="patient" 
      requiredAction="read"
      context={{ patientId: '123' }}
    >
      <PatientData />
    </PermissionGuard>
  );
}
```

### **Facility-Based Protection**

```tsx
function FacilityDashboard() {
  return (
    <PermissionGuard 
      requiredRoles={['facility_admin', 'admin']}
      requiredFacility="facility_123"
    >
      <FacilityContent />
    </PermissionGuard>
  );
}
```

### **Custom Fallback**

```tsx
function AdminOnly() {
  return (
    <PermissionGuard 
      requiredRoles={['admin']}
      fallback={<UpgradePrompt />}
    >
      <AdminFeatures />
    </PermissionGuard>
  );
}
```

## 🎯 Utility Components

### **Role-Based Components**

```tsx
import { 
  AdminOnly, 
  DoctorOnly, 
  NurseOnly, 
  PatientOnly,
  ComplianceOfficerOnly,
  FacilityAdminOnly 
} from './components/PermissionGuard';

function Dashboard() {
  return (
    <div>
      <h1>Dashboard</h1>
      
      <AdminOnly>
        <AdminPanel />
      </AdminOnly>
      
      <DoctorOnly>
        <DoctorPanel />
      </DoctorOnly>
      
      <NurseOnly>
        <NursePanel />
      </NurseOnly>
      
      <PatientOnly>
        <PatientPanel />
      </PatientOnly>
      
      <ComplianceOfficerOnly>
        <CompliancePanel />
      </ComplianceOfficerOnly>
      
      <FacilityAdminOnly>
        <FacilityPanel />
      </FacilityAdminOnly>
    </div>
  );
}
```

### **Higher-Order Components**

```tsx
import { withPermission } from './components/PermissionGuard';

const AdminComponent = withPermission(MyComponent, {
  requiredRoles: ['admin']
});

const PatientDataComponent = withPermission(PatientData, {
  requiredResource: 'patient',
  requiredAction: 'read'
});
```

## 🔄 Session Management

### **Session Timeout Configuration**

```tsx
import { SessionManager } from './components/SessionManager';

function App() {
  return (
    <SessionManager 
      warningThreshold={5} // Show warning 5 minutes before expiry
      onSessionExpired={() => {
        // Handle session expiry
        console.log('Session expired');
      }}
      onSessionWarning={() => {
        // Handle session warning
        console.log('Session warning shown');
      }}
    >
      {/* Your app */}
    </SessionManager>
  );
}
```

### **Manual Session Refresh**

```tsx
import { useAuth } from './contexts/AuthContext';

function SessionStatus() {
  const { refreshSession, isSessionValid, getSessionTimeRemaining } = useAuth();

  const handleRefresh = async () => {
    try {
      await refreshSession();
      console.log('Session refreshed');
    } catch (error) {
      console.error('Failed to refresh session');
    }
  };

  return (
    <div>
      <p>Session valid: {isSessionValid() ? 'Yes' : 'No'}</p>
      <p>Time remaining: {Math.floor(getSessionTimeRemaining() / 60000)} minutes</p>
      <button onClick={handleRefresh}>Refresh Session</button>
    </div>
  );
}
```

## 🧪 Testing

### **Unit Testing**

```typescript
import { render, screen } from '@testing-library/react';
import { AuthProvider } from './contexts/AuthContext';
import { PermissionGuard } from './components/PermissionGuard';

test('shows content for authorized users', () => {
  render(
    <AuthProvider>
      <PermissionGuard requiredRoles={['admin']}>
        <div>Admin content</div>
      </PermissionGuard>
    </AuthProvider>
  );
  
  expect(screen.getByText('Admin content')).toBeInTheDocument();
});
```

### **Integration Testing**

```typescript
import { render, screen, fireEvent } from '@testing-library/react';
import { AuthProvider } from './contexts/AuthContext';
import { SignInForm } from './components/SignInForm';

test('user can sign in', async () => {
  render(
    <AuthProvider>
      <SignInForm />
    </AuthProvider>
  );
  
  fireEvent.change(screen.getByPlaceholderText('Email'), {
    target: { value: 'test@example.com' }
  });
  
  fireEvent.change(screen.getByPlaceholderText('Password'), {
    target: { value: 'password123' }
  });
  
  fireEvent.click(screen.getByText('Sign In'));
  
  // Assert successful sign in
});
```

## 🚨 Error Handling

### **Authentication Errors**

```tsx
import { useAuth } from './contexts/AuthContext';

function SignInForm() {
  const { signIn } = useAuth();
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    
    try {
      await signIn(email, password);
    } catch (error: any) {
      if (error.code === 'auth/user-not-found') {
        setError('User not found');
      } else if (error.code === 'auth/wrong-password') {
        setError('Incorrect password');
      } else {
        setError('Authentication failed');
      }
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      {error && <div className="error">{error}</div>}
      {/* Form fields */}
    </form>
  );
}
```

### **Permission Errors**

```tsx
function ProtectedComponent() {
  return (
    <PermissionGuard 
      requiredRoles={['admin']}
      onAccessDenied={(reason) => {
        console.error('Access denied:', reason);
        // Log error, show notification, etc.
      }}
    >
      <AdminContent />
    </PermissionGuard>
  );
}
```

## 🔧 Configuration

### **Environment Variables**

```bash
# Firebase Configuration
VITE_FIREBASE_API_KEY=your_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_domain
VITE_FIREBASE_PROJECT_ID=your_project_id

# Session Configuration
VITE_SESSION_TIMEOUT=1800000        # 30 minutes
VITE_SESSION_WARNING_TIME=300000    # 5 minutes
VITE_MAX_REFRESH_ATTEMPTS=3
```

### **Custom Permissions**

```typescript
import { permissionService } from './services/permission.service';

// Create custom permission
await permissionService.createPermission({
  name: 'Custom Permission',
  description: 'Custom permission description',
  resource: 'custom_resource',
  action: 'custom_action',
  isActive: true
});

// Create custom role
await permissionService.createRole({
  name: 'custom_role',
  description: 'Custom role description',
  permissions: ['custom_resource:custom_action'],
  isActive: true,
  priority: 50
});
```

## 📊 Monitoring & Analytics

### **Session Metrics**

```typescript
import { useAuth } from './contexts/AuthContext';

function SessionMetrics() {
  const { session, isSessionValid, getSessionTimeRemaining } = useAuth();

  return (
    <div>
      <h3>Session Information</h3>
      <p>Session ID: {session?.sessionId}</p>
      <p>User: {session?.email}</p>
      <p>Roles: {session?.roles.join(', ')}</p>
      <p>Valid: {isSessionValid() ? 'Yes' : 'No'}</p>
      <p>Time Remaining: {Math.floor(getSessionTimeRemaining() / 60000)} minutes</p>
    </div>
  );
}
```

### **Permission Analytics**

```typescript
import { permissionService } from './services/permission.service';

async function getPermissionStats() {
  const permissions = permissionService.getAllPermissions();
  const roles = permissionService.getAllRoles();
  
  console.log(`Total permissions: ${permissions.length}`);
  console.log(`Total roles: ${roles.length}`);
  
  // Log permission usage
  permissions.forEach(permission => {
    console.log(`${permission.resource}:${permission.action} - ${permission.description}`);
  });
}
```

## 🆘 Troubleshooting

### **Common Issues**

1. **Session not persisting**
   - Check Firebase configuration
   - Verify environment variables
   - Check browser console for errors

2. **Permissions not working**
   - Verify user roles are assigned
   - Check permission cache
   - Refresh permission cache

3. **Authentication failing**
   - Check Firebase Auth configuration
   - Verify user exists in Firestore
   - Check authentication rules

### **Debug Mode**

```typescript
// Enable debug logging
localStorage.setItem('auth_debug', 'true');

// Check authentication state
console.log('Auth state:', jwtAuthService.getCurrentUser());
console.log('Session state:', jwtAuthService.getCurrentSession());
console.log('Permissions:', await permissionService.getUserPermissions(userId));
```

## 📚 API Reference

### **AuthContext Methods**

```typescript
interface AuthContextType {
  // State
  user: AuthUser | null;
  session: UserSession | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  
  // Methods
  signIn(email: string, password: string): Promise<AuthUser>;
  signInWithGoogle(): Promise<AuthUser>;
  signUp(email: string, password: string, userData: Partial<AuthUser>): Promise<AuthUser>;
  signOut(): Promise<void>;
  refreshSession(): Promise<void>;
  
  // Permission checks
  hasRole(role: string): boolean;
  hasPermission(permission: string): boolean;
  canPerformAction(resource: string, action: string): boolean;
}
```

### **PermissionGuard Props**

```typescript
interface PermissionGuardProps {
  children: React.ReactNode;
  requiredPermission?: string;
  requiredResource?: string;
  requiredAction?: string;
  requiredRoles?: string[];
  requiredFacility?: string;
  fallback?: React.ReactNode;
  onAccessDenied?: (reason: string) => void;
  context?: Record<string, any>;
}
```

## 🔄 Migration Guide

### **From Old Auth System**

1. **Replace auth imports**
   ```typescript
   // Old
   import { auth } from './old-auth';
   
   // New
   import { useAuth } from './contexts/AuthContext';
   ```

2. **Update component usage**
   ```typescript
   // Old
   const user = auth.currentUser;
   
   // New
   const { user } = useAuth();
   ```

3. **Add permission guards**
   ```typescript
   // Old
   if (user.role === 'admin') { /* ... */ }
   
   // New
   <PermissionGuard requiredRoles={['admin']}>
     {/* ... */}
   </PermissionGuard>
   ```

## 📈 Performance Considerations

### **Caching Strategy**

- Permissions and roles are cached in memory
- User sessions are stored in Firestore
- Authentication state is managed locally
- Regular cache refresh prevents stale data

### **Optimization Tips**

1. **Use permission guards sparingly**
   - Don't wrap every component
   - Use at route or major section level

2. **Lazy load permissions**
   - Load permissions only when needed
   - Use permission service methods directly

3. **Monitor session activity**
   - Implement activity tracking
   - Optimize session refresh timing

## 🔐 Security Best Practices

1. **Never expose sensitive data in client code**
2. **Always validate permissions server-side**
3. **Use HTTPS in production**
4. **Implement rate limiting**
5. **Log all authentication events**
6. **Regular security audits**
7. **Keep dependencies updated**

---

**Last Updated**: December 2024  
**Version**: 2.0.0  
**Security Level**: Enterprise Grade  
**Compliance**: HIPAA Ready



