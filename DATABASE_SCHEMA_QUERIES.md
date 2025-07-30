# LingapLink Healthcare System - Database Schema & Queries

## 📊 Entity-Relationship Diagram (ERD)

```
┌─────────────────────────────────────────────────────────────────────────────────────────────────┐
│                                    LINGAPLINK HEALTHCARE SYSTEM                                  │
│                                        DATABASE SCHEMA ERD                                       │
└─────────────────────────────────────────────────────────────────────────────────────────────────┘

┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│     USERS       │    │    PATIENTS     │    │ ORGANIZATIONS   │    │ STAFF_INVITATIONS│
├─────────────────┤    ├─────────────────┤    ├─────────────────┤    ├─────────────────┤
│ PK: uid         │    │ PK: uid         │    │ PK: id          │    │ PK: id          │
│ email           │    │ email           │    │ name            │    │ organizationId  │
│ displayName     │    │ role            │    │ type            │    │ email           │
│ role            │    │ personalInfo    │    │ description     │    │ role            │
│ organizationId  │    │ medicalInfo     │    │ address         │    │ firstName       │
│ personalInfo    │    │ settings        │    │ contact         │    │ lastName        │
│ permissions     │    │ activity        │    │ license         │    │ title           │
│ createdAt       │    │ profileComplete │    │ settings        │    │ department      │
│ lastLogin       │    │ createdAt       │    │ subscription    │    │ permissions     │
│ isActive        │    │ lastLoginAt     │    │ stats           │    │ invitedBy       │
│ emailVerified   │    │ updatedAt       │    │ adminUserId     │    │ createdAt       │
└─────────────────┘    │ isActive        │    │ createdAt       │    │ expiresAt       │
         │             │ emailVerified   │    │ updatedAt       │    │ status          │
         │             │ authProvider    │    │ isActive        │    └─────────────────┘
         │             └─────────────────┘    └─────────────────┘             │
         │                      │                      │                      │
         │                      │                      │                      │
         └──────────────────────┼──────────────────────┼──────────────────────┘
                                │                      │
                                │                      │
         ┌──────────────────────┼──────────────────────┼──────────────────────┐
         │                      │                      │                      │
         │                      │                      │                      │
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│  MEDICAL_RECORDS│    │  NOTIFICATIONS  │    │  AUDIT_LOGS     │    │ORGANIZATION_REPORTS│
├─────────────────┤    ├─────────────────┤    ├─────────────────┤    ├─────────────────┤
│ PK: recordId    │    │ PK: notificationId│  │ PK: logId       │    │ PK: reportId    │
│ patientId       │    │ recipientId     │    │ userId          │    │ organizationId  │
│ doctorId        │    │ senderId        │    │ action          │    │ reportType      │
│ consultationId  │    │ type            │    │ resource        │    │ data            │
│ diagnosis       │    │ title           │    │ details         │    │ generatedAt     │
│ treatment       │    │ message         │    │ ipAddress       │    │ createdBy       │
│ prescriptions   │    │ priority        │    │ userAgent       │    │ createdAt       │
│ notes           │    │ isRead          │    │ timestamp       │    └─────────────────┘
│ createdAt       │    │ createdAt       │    │ severity        │
│ updatedAt       │    │ expiresAt       │    └─────────────────┘
└─────────────────┘    └─────────────────┘
         │                      │
         │                      │
         └──────────────────────┼──────────────────────┐
                                │                      │
                                │                      │
         ┌──────────────────────┼──────────────────────┼──────────────────────┐
         │                      │                      │                      │
         │                      │                      │                      │
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   CONDITIONS    │    │   DOCUMENTS     │    │ CONSULTATIONS   │    │  APPOINTMENTS   │
│  (Subcollection)│    │  (Subcollection)│    │ (Subcollection) │    │ (Subcollection) │
├─────────────────┤    ├─────────────────┤    ├─────────────────┤    ├─────────────────┤
│ PK: conditionId │    │ PK: documentId  │    │ PK: consultationId│  │ PK: appointmentId│
│ category        │    │ name            │    │ date            │    │ date            │
│ condition       │    │ type            │    │ doctor          │    │ time            │
│ severity        │    │ url             │    │ type            │    │ doctor          │
│ diagnosisDate   │    │ size            │    │ status          │    │ type            │
│ notes           │    │ uploadDate      │    │ notes           │    │ status          │
│ createdAt       │    │ createdAt       │    │ createdAt       │    │ notes           │
└─────────────────┘    └─────────────────┘    └─────────────────┘    └─────────────────┘

┌─────────────────────────────────────────────────────────────────────────────────────────────────┐
│                                    RELATIONSHIPS & CARDINALITY                                   │
└─────────────────────────────────────────────────────────────────────────────────────────────────┘

USERS (1) ──── (1) PATIENTS                    (One-to-One: User account to patient profile)
USERS (1) ──── (1) ORGANIZATIONS               (One-to-One: User to organization membership)
ORGANIZATIONS (1) ──── (M) STAFF_INVITATIONS   (One-to-Many: Organization to staff invitations)
PATIENTS (1) ──── (M) CONDITIONS               (One-to-Many: Patient to medical conditions)
PATIENTS (1) ──── (M) DOCUMENTS                (One-to-Many: Patient to medical documents)
PATIENTS (1) ──── (M) CONSULTATIONS            (One-to-Many: Patient to consultation history)
PATIENTS (1) ──── (M) APPOINTMENTS             (One-to-Many: Patient to appointments)
PATIENTS (1) ──── (M) MEDICAL_RECORDS          (One-to-Many: Patient to medical records)
USERS (1) ──── (M) NOTIFICATIONS               (One-to-Many: User to notifications)
USERS (1) ──── (M) AUDIT_LOGS                  (One-to-Many: User to audit logs)
ORGANIZATIONS (1) ──── (M) ORGANIZATION_REPORTS (One-to-Many: Organization to reports)
```

## 🔥 Firestore NoSQL Schema Implementation

### 1. USERS Collection
**Purpose**: General user authentication and role management
```javascript
{
  uid: "string",                    // Primary Key - Firebase Auth UID
  email: "string",                  // User email address
  displayName: "string",            // User display name
  role: "string",                   // User role: 'patient', 'doctor', 'admin', 'nurse', 'clinic_staff', 'organization_admin', 'organization_member', 'system_admin'
  organizationId: "string",         // Foreign Key to Organizations
  personalInfo: {
    firstName: "string",
    lastName: "string",
    title: "string",
    department: "string",
    phone: "string"
  },
  permissions: {
    canManageStaff: "boolean",
    canManagePatients: "boolean",
    canManageSettings: "boolean",
    canViewReports: "boolean",
    canManageBilling: "boolean"
  },
  createdAt: "timestamp",
  lastLogin: "timestamp",
  isActive: "boolean",
  emailVerified: "boolean"
}
```

### 2. PATIENTS Collection
**Purpose**: Detailed patient information and medical data
```javascript
{
  uid: "string",                    // Primary Key - Firebase Auth UID
  email: "string",                  // Patient email
  role: "string",                   // Always 'patient'
  personalInfo: {
    firstName: "string",
    lastName: "string",
    fullName: "string",
    dateOfBirth: "string",          // YYYY-MM-DD format
    age: "number",
    gender: "string",               // 'male', 'female', 'other', 'prefer_not_to_say'
    phone: "string",
    address: "string",
    bio: "string",
    location: "string"
  },
  medicalInfo: {
    conditions: {
      speech: ["string"],
      physical: ["string"],
      mental: ["string"],
      other: ["string"]
    },
    allergies: ["string"],
    medications: ["string"],
    emergencyContact: {
      name: "string",
      phone: "string",
      relationship: "string"
    }
  },
  settings: {
    notifications: "boolean",
    language: "string",             // 'en', 'fil', 'es', 'fr', 'de'
    theme: "string",                // 'light', 'dark', 'auto'
    privacy: {
      shareData: "boolean",
      allowResearch: "boolean"
    }
  },
  activity: {
    consultationHistory: ["object"],
    documents: ["object"],
    appointments: ["object"]
  },
  profileComplete: "boolean",
  organizationId: "string",         // Foreign Key to Organizations
  createdAt: "timestamp",
  lastLoginAt: "timestamp",
  updatedAt: "timestamp",
  isActive: "boolean",
  emailVerified: "boolean",
  authProvider: "string"            // 'email', 'google', 'facebook'
}
```

### 3. ORGANIZATIONS Collection
**Purpose**: Healthcare provider organizations (hospitals, clinics)
```javascript
{
  id: "string",                     // Primary Key
  name: "string",                   // Organization name
  type: "string",                   // 'hospital', 'clinic', 'practice', 'other'
  description: "string",
  address: {
    street: "string",
    city: "string",
    state: "string",
    zipCode: "string",
    country: "string"
  },
  contact: {
    email: "string",
    phone: "string",
    website: "string"
  },
  license: {
    number: "string",
    state: "string",
    expirationDate: "timestamp"
  },
  settings: {
    allowPatientRegistration: "boolean",
    requireApproval: "boolean",
    timezone: "string"
  },
  subscription: {
    plan: "string",                 // 'trial', 'basic', 'professional', 'enterprise'
    status: "string",               // 'active', 'inactive', 'suspended'
    trialEndsAt: "timestamp"
  },
  stats: {
    totalStaff: "number",
    totalPatients: "number",
    totalAppointments: "number"
  },
  adminUserId: "string",            // Foreign Key to Users
  createdAt: "timestamp",
  updatedAt: "timestamp",
  isActive: "boolean"
}
```

### 4. STAFF_INVITATIONS Collection
**Purpose**: Manage staff invitations to organizations
```javascript
{
  id: "string",                     // Primary Key
  organizationId: "string",         // Foreign Key to Organizations
  organizationName: "string",
  email: "string",
  role: "string",
  firstName: "string",
  lastName: "string",
  title: "string",
  department: "string",
  permissions: "object",
  invitedBy: "string",              // Foreign Key to Users
  createdAt: "timestamp",
  expiresAt: "timestamp",
  status: "string"                  // 'pending', 'accepted', 'expired'
}
```

### 5. MEDICAL_RECORDS Collection
**Purpose**: Detailed medical records with strict access control
```javascript
{
  recordId: "string",               // Primary Key
  patientId: "string",              // Foreign Key to Patients
  doctorId: "string",               // Foreign Key to Users
  consultationId: "string",         // Foreign Key to Consultations
  diagnosis: "string",
  treatment: "string",
  prescriptions: ["string"],
  notes: "string",
  createdAt: "timestamp",
  updatedAt: "timestamp"
}
```

### 6. NOTIFICATIONS Collection
**Purpose**: System notifications for users
```javascript
{
  notificationId: "string",         // Primary Key
  recipientId: "string",            // Foreign Key to Users
  senderId: "string",               // Foreign Key to Users
  type: "string",                   // 'appointment', 'consultation', 'system', 'alert'
  title: "string",
  message: "string",
  priority: "string",               // 'low', 'medium', 'high', 'urgent'
  isRead: "boolean",
  createdAt: "timestamp",
  expiresAt: "timestamp"
}
```

### 7. AUDIT_LOGS Collection
**Purpose**: Security audit trail
```javascript
{
  logId: "string",                  // Primary Key
  userId: "string",                 // Foreign Key to Users
  action: "string",                 // 'login', 'logout', 'create', 'update', 'delete', 'access'
  resource: "string",               // Collection/document accessed
  details: "object",
  ipAddress: "string",
  userAgent: "string",
  timestamp: "timestamp",
  severity: "string"                // 'info', 'warning', 'error', 'critical'
}
```

### 8. ORGANIZATION_REPORTS Collection
**Purpose**: Analytics and reporting data
```javascript
{
  reportId: "string",               // Primary Key
  organizationId: "string",         // Foreign Key to Organizations
  reportType: "string",             // 'patient_stats', 'revenue', 'utilization', 'performance'
  data: "object",                   // Report-specific data structure
  generatedAt: "timestamp",
  createdBy: "string",              // Foreign Key to Users
  createdAt: "timestamp"
}
```

## 🔗 Subcollections

### PATIENTS/{patientId}/CONDITIONS
```javascript
{
  conditionId: "string",            // Primary Key
  category: "string",               // 'speech', 'physical', 'mental', 'other'
  condition: "string",
  severity: "string",               // 'mild', 'moderate', 'severe'
  diagnosisDate: "timestamp",
  notes: "string",
  createdAt: "timestamp"
}
```

### PATIENTS/{patientId}/DOCUMENTS
```javascript
{
  documentId: "string",             // Primary Key
  name: "string",
  type: "string",                   // 'medical_record', 'prescription', 'lab_result', 'other'
  url: "string",                    // Storage URL
  size: "number",
  uploadDate: "timestamp",
  createdAt: "timestamp"
}
```

### PATIENTS/{patientId}/CONSULTATIONS
```javascript
{
  consultationId: "string",         // Primary Key
  date: "timestamp",
  doctor: "string",
  type: "string",                   // 'in_person', 'telemedicine', 'follow_up'
  status: "string",                 // 'scheduled', 'in_progress', 'completed', 'cancelled'
  notes: "string",
  createdAt: "timestamp"
}
```

### PATIENTS/{patientId}/APPOINTMENTS
```javascript
{
  appointmentId: "string",          // Primary Key
  date: "string",                   // YYYY-MM-DD
  time: "string",                   // HH:MM
  doctor: "string",
  type: "string",                   // 'consultation', 'procedure', 'follow_up'
  status: "string",                 // 'scheduled', 'confirmed', 'completed', 'cancelled'
  notes: "string",
  createdAt: "timestamp"
}
```

## 🔍 Key Database Queries (Firestore Implementation)

### 1. Patient Data Retrieval
```javascript
// Get patient with all subcollections
const getPatientWithAllData = async (patientId) => {
  const patientDoc = await getDoc(doc(db, 'patients', patientId));
  const conditionsQuery = query(collection(db, 'patients', patientId, 'conditions'));
  const documentsQuery = query(collection(db, 'patients', patientId, 'documents'));
  const consultationsQuery = query(collection(db, 'patients', patientId, 'consultations'));
  const appointmentsQuery = query(collection(db, 'patients', patientId, 'appointments'));
  
  const [conditions, documents, consultations, appointments] = await Promise.all([
    getDocs(conditionsQuery),
    getDocs(consultationsQuery),
    getDocs(appointmentsQuery)
  ]);
  
  return {
    patient: patientDoc.data(),
    conditions: conditions.docs.map(doc => doc.data()),
    documents: documents.docs.map(doc => doc.data()),
    consultations: consultations.docs.map(doc => doc.data()),
    appointments: appointments.docs.map(doc => doc.data())
  };
};
```

### 2. Organization Staff Management
```javascript
// Get all staff members for an organization
const getOrganizationStaff = async (organizationId) => {
  const usersQuery = query(
    collection(db, 'users'),
    where('organizationId', '==', organizationId),
    where('isActive', '==', true)
  );
  
  const snapshot = await getDocs(usersQuery);
  return snapshot.docs.map(doc => doc.data());
};
```

### 3. Patient Search by Organization
```javascript
// Get patients assigned to an organization
const getOrganizationPatients = async (organizationId, limit = 50) => {
  const patientsQuery = query(
    collection(db, 'patients'),
    where('organizationId', '==', organizationId),
    where('isActive', '==', true),
    orderBy('lastLoginAt', 'desc'),
    limit(limit)
  );
  
  const snapshot = await getDocs(patientsQuery);
  return snapshot.docs.map(doc => doc.data());
};
```

### 4. Medical Records Access Control
```javascript
// Get medical records for a patient (doctor access)
const getPatientMedicalRecords = async (patientId, doctorId) => {
  const recordsQuery = query(
    collection(db, 'medical_records'),
    where('patientId', '==', patientId),
    orderBy('createdAt', 'desc')
  );
  
  const snapshot = await getDocs(recordsQuery);
  return snapshot.docs.map(doc => doc.data());
};
```

### 5. Appointment Scheduling
```javascript
// Get available appointments for a doctor
const getDoctorAppointments = async (doctorId, date) => {
  const appointmentsQuery = query(
    collection(db, 'appointments'),
    where('doctor', '==', doctorId),
    where('date', '==', date),
    where('status', 'in', ['scheduled', 'confirmed'])
  );
  
  const snapshot = await getDocs(appointmentsQuery);
  return snapshot.docs.map(doc => doc.data());
};
```

### 6. Notification System
```javascript
// Get unread notifications for a user
const getUnreadNotifications = async (userId) => {
  const notificationsQuery = query(
    collection(db, 'notifications'),
    where('recipientId', '==', userId),
    where('isRead', '==', false),
    orderBy('createdAt', 'desc')
  );
  
  const snapshot = await getDocs(notificationsQuery);
  return snapshot.docs.map(doc => doc.data());
};
```

### 7. Audit Trail
```javascript
// Get user activity audit logs
const getUserAuditLogs = async (userId, startDate, endDate) => {
  const logsQuery = query(
    collection(db, 'audit_logs'),
    where('userId', '==', userId),
    where('timestamp', '>=', startDate),
    where('timestamp', '<=', endDate),
    orderBy('timestamp', 'desc')
  );
  
  const snapshot = await getDocs(logsQuery);
  return snapshot.docs.map(doc => doc.data());
};
```

### 8. Analytics and Reporting
```javascript
// Generate organization statistics
const getOrganizationStats = async (organizationId) => {
  const patientsQuery = query(
    collection(db, 'patients'),
    where('organizationId', '==', organizationId),
    where('isActive', '==', true)
  );
  
  const staffQuery = query(
    collection(db, 'users'),
    where('organizationId', '==', organizationId),
    where('isActive', '==', true)
  );
  
  const [patientsSnapshot, staffSnapshot] = await Promise.all([
    getDocs(patientsQuery),
    getDocs(staffQuery)
  ]);
  
  return {
    totalPatients: patientsSnapshot.size,
    totalStaff: staffSnapshot.size,
    activePatients: patientsSnapshot.docs.filter(doc => 
      doc.data().lastLoginAt > new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
    ).length
  };
};
```

## 🔐 Security Rules Summary

The database implements comprehensive security rules:

1. **Authentication Required**: All operations require valid Firebase authentication
2. **Role-Based Access**: Different user roles have different permissions
3. **Data Ownership**: Users can only access their own data
4. **Organization Isolation**: Organization members can only access their organization's data
5. **Audit Logging**: All sensitive operations are logged
6. **Input Validation**: All data is validated before storage
7. **Rate Limiting**: Prevents abuse through request limiting

## 📊 Performance Considerations

1. **Indexing**: Create composite indexes for common queries
2. **Pagination**: Implement cursor-based pagination for large datasets
3. **Caching**: Use Firebase offline persistence for frequently accessed data
4. **Batch Operations**: Use batch writes for multiple document operations
5. **Real-time Updates**: Use Firestore listeners for live data updates

## 🚀 API Endpoints (Express.js Implementation)

### Authentication Endpoints
```javascript
// POST /api/auth/register
// POST /api/auth/login
// POST /api/auth/logout
// POST /api/auth/verify-email
// POST /api/auth/reset-password
// GET /api/auth/profile
// PUT /api/auth/profile
```

### Patient Endpoints
```javascript
// GET /api/patients/:id
// PUT /api/patients/:id
// GET /api/patients/:id/conditions
// POST /api/patients/:id/conditions
// DELETE /api/patients/:id/conditions/:conditionId
// GET /api/patients/:id/documents
// POST /api/patients/:id/documents
// DELETE /api/patients/:id/documents/:documentId
// GET /api/patients/:id/consultations
// POST /api/patients/:id/consultations
// GET /api/patients/:id/appointments
// POST /api/patients/:id/appointments
// PUT /api/patients/:id/appointments/:appointmentId
```

### Organization Endpoints
```javascript
// POST /api/organizations
// GET /api/organizations/:id
// PUT /api/organizations/:id
// GET /api/organizations/:id/staff
// POST /api/organizations/:id/staff/invite
// PUT /api/organizations/:id/staff/invitations/:invitationId/accept
// GET /api/organizations/:id/patients
// POST /api/organizations/:id/patients/:patientId/assign
```

### Medical Records Endpoints
```javascript
// GET /api/medical-records/:patientId
// POST /api/medical-records
// PUT /api/medical-records/:recordId
// DELETE /api/medical-records/:recordId
```

### Notification Endpoints
```javascript
// GET /api/notifications
// POST /api/notifications
// PUT /api/notifications/:notificationId/read
// DELETE /api/notifications/:notificationId
```

### Audit Log Endpoints
```javascript
// GET /api/audit-logs
// GET /api/audit-logs/:userId
// POST /api/audit-logs
```

## 🔧 Database Indexes

### Required Composite Indexes
```javascript
// Patients collection
patients: [organizationId, isActive, lastLoginAt]
patients: [organizationId, profileComplete, createdAt]

// Users collection
users: [organizationId, isActive, role]
users: [email, isActive]

// Medical records collection
medical_records: [patientId, createdAt]
medical_records: [doctorId, createdAt]

// Notifications collection
notifications: [recipientId, isRead, createdAt]
notifications: [type, priority, createdAt]

// Audit logs collection
audit_logs: [userId, timestamp]
audit_logs: [action, severity, timestamp]

// Staff invitations collection
staff_invitations: [organizationId, status, expiresAt]
staff_invitations: [email, status]
```

## 📈 Data Validation Schemas

### Patient Data Validation
```javascript
const patientDataSchema = {
  firstName: {
    required: true,
    type: 'string',
    minLength: 2,
    maxLength: 50,
    pattern: /^[a-zA-ZÀ-ÿ\u0100-\u017F\u0180-\u024F\u1E00-\u1EFF\s'-]+$/,
    sanitize: true
  },
  lastName: {
    required: true,
    type: 'string',
    minLength: 2,
    maxLength: 50,
    pattern: /^[a-zA-ZÀ-ÿ\u0100-\u017F\u0180-\u024F\u1E00-\u1EFF\s'-]+$/,
    sanitize: true
  },
  email: {
    required: true,
    type: 'email',
    maxLength: 254,
    sanitize: true
  },
  dateOfBirth: {
    required: true,
    type: 'date',
    minAge: 13,
    maxAge: 120
  },
  phone: {
    required: false,
    type: 'phone',
    pattern: /^[\+]?[1-9][\d\s\-\(\)\.]{8,}$/
  }
};
```

### Organization Data Validation
```javascript
const organizationSchema = {
  name: {
    required: true,
    type: 'string',
    minLength: 2,
    maxLength: 100,
    pattern: /^[a-zA-Z0-9\s\-\.\,\&]+$/,
    sanitize: true
  },
  type: {
    required: true,
    type: 'enum',
    values: ['hospital', 'clinic', 'pharmacy', 'laboratory', 'other']
  },
  address: {
    required: true,
    type: 'object',
    properties: {
      street: { required: true, type: 'string', maxLength: 200 },
      city: { required: true, type: 'string', maxLength: 100 },
      state: { required: true, type: 'string', maxLength: 100 },
      zipCode: { required: true, type: 'string', maxLength: 20 }
    }
  }
};
```

## 🔄 Real-time Data Synchronization

### Firestore Listeners
```javascript
// Listen to patient data changes
const unsubscribePatient = onSnapshot(doc(db, 'patients', patientId), (doc) => {
  if (doc.exists()) {
    const patientData = doc.data();
    updateUI(patientData);
  }
});

// Listen to notifications
const unsubscribeNotifications = onSnapshot(
  query(
    collection(db, 'notifications'),
    where('recipientId', '==', userId),
    where('isRead', '==', false)
  ),
  (snapshot) => {
    const notifications = snapshot.docs.map(doc => doc.data());
    updateNotificationBadge(notifications.length);
  }
);

// Listen to organization updates
const unsubscribeOrganization = onSnapshot(
  doc(db, 'organizations', organizationId),
  (doc) => {
    if (doc.exists()) {
      const orgData = doc.data();
      updateOrganizationUI(orgData);
    }
  }
);
```

## 🛡️ Security Implementation

### Input Sanitization
```javascript
const sanitizeInput = (input, maxLength = 1000) => {
  if (typeof input !== 'string') return input;
  
  // Remove potentially dangerous characters
  let sanitized = input
    .replace(/[<>]/g, '') // Remove < and >
    .replace(/javascript:/gi, '') // Remove javascript: protocol
    .replace(/on\w+\s*=/gi, '') // Remove event handlers
    .trim();
  
  // Limit length
  if (sanitized.length > maxLength) {
    sanitized = sanitized.substring(0, maxLength);
  }
  
  return sanitized;
};

const sanitizeEmail = (email) => {
  return validator.isEmail(email) ? email.toLowerCase().trim() : null;
};

const sanitizePhone = (phone) => {
  return phone.replace(/[^\d\s\-\+\(\)]/g, '').trim();
};
```

### Rate Limiting
```javascript
const rateLimiter = {
  attempts: new Map(),
  
  isAllowed(userId, maxAttempts, windowMs) {
    const now = Date.now();
    const userAttempts = this.attempts.get(userId) || [];
    
    // Remove old attempts outside the window
    const recentAttempts = userAttempts.filter(time => now - time < windowMs);
    
    if (recentAttempts.length >= maxAttempts) {
      return false;
    }
    
    // Add current attempt
    recentAttempts.push(now);
    this.attempts.set(userId, recentAttempts);
    
    return true;
  }
};
```

## 📊 Analytics and Monitoring

### Performance Metrics
```javascript
// Track query performance
const trackQueryPerformance = async (queryName, queryFn) => {
  const startTime = performance.now();
  try {
    const result = await queryFn();
    const duration = performance.now() - startTime;
    
    // Log performance metrics
    console.log(`Query ${queryName} completed in ${duration.toFixed(2)}ms`);
    
    // Send to analytics if duration is concerning
    if (duration > 1000) {
      console.warn(`Slow query detected: ${queryName} took ${duration.toFixed(2)}ms`);
    }
    
    return result;
  } catch (error) {
    const duration = performance.now() - startTime;
    console.error(`Query ${queryName} failed after ${duration.toFixed(2)}ms:`, error);
    throw error;
  }
};
```

### Error Tracking
```javascript
// Track database errors
const trackDatabaseError = (error, context) => {
  const errorInfo = {
    timestamp: new Date().toISOString(),
    error: error.message,
    code: error.code,
    context: context,
    userAgent: navigator.userAgent,
    url: window.location.href
  };
  
  // Log to console in development
  if (process.env.NODE_ENV === 'development') {
    console.error('Database Error:', errorInfo);
  }
  
  // Send to error tracking service in production
  if (process.env.NODE_ENV === 'production') {
    // Send to error tracking service
    sendErrorToTrackingService(errorInfo);
  }
};
```

This comprehensive database schema and queries document provides a complete overview of the LingapLink healthcare system's data architecture, including both the theoretical ERD and the actual Firestore implementation with security rules, validation schemas, and performance optimizations. 