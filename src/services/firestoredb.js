// Firestore Database Service
import { initializeApp, getApps, getApp } from 'https://www.gstatic.com/firebasejs/11.9.1/firebase-app.js';
import { 
    getAuth, 
    onAuthStateChanged
} from 'https://www.gstatic.com/firebasejs/11.9.1/firebase-auth.js';
import { 
    getFirestore, 
    doc, 
    getDoc,
    setDoc,
    updateDoc,
    deleteDoc,
    collection,
    query,
    where,
    orderBy,
    limit,
    getDocs,
    addDoc,
    arrayUnion,
    arrayRemove,
    serverTimestamp,
    onSnapshot
} from 'https://www.gstatic.com/firebasejs/11.9.1/firebase-firestore.js';

// Import Firebase configuration from config.js
import { firebaseConfig } from './config.js';

// Import validation utilities
import { 
    validateProfileUpdateData, 
    validateMedicalCondition, 
    validateCategory, 
    validateDocumentName,
    sanitizeInput,
    escapeHtml,
    rateLimiter
} from '../utils/validation.js';

// Initialize Firebase (avoid duplicate initialization)
let app;
let auth;
let db;

try {
    // Check if Firebase is already initialized
    if (getApps().length === 0) {
        app = initializeApp(firebaseConfig);
        // Firebase initialized by Firestore service
    } else {
        app = getApp();
        // Using existing Firebase instance
    }
    
    auth = getAuth(app);
    db = getFirestore(app);
    
} catch (error) {
    console.error('Firebase initialization error:', error);
    throw error;
}

// Log Firebase initialization
// Firestore DB Service initialized

// Export Firebase instances for global access (if needed)
window.firebaseApp = app;
window.auth = auth;
window.db = db;

// ============= USER MANAGEMENT =============

/**
 * Get current authenticated user
 */
export function getCurrentUser() {
    return auth.currentUser;
}

/**
 * Check if user is authenticated
 */
export function isAuthenticated() {
    return auth.currentUser !== null;
}

/**
 * Listen to authentication state changes
 */
export function onAuthStateChange(callback) {
    return onAuthStateChanged(auth, callback);
}

// ============= PATIENT DATA OPERATIONS =============

/**
 * Get patient data by user ID
 */
export async function getPatientData(userId) {
    try {
        const userDoc = await getDoc(doc(db, 'patients', userId));
        if (userDoc.exists()) {
            return userDoc.data();
        } else {
            // No patient data found for user
            return null;
        }
    } catch (error) {
        console.error('Error fetching patient data:', error);
        throw error;
    }
}

/**
 * Get current user's patient data
 */
export async function getCurrentPatientData() {
    const user = getCurrentUser();
    if (!user) {
        throw new Error('No authenticated user');
    }
    return await getPatientData(user.uid);
}

/**
 * Create initial patient document
 */
export async function createPatientDocument(user, additionalData = {}) {
    try {
        if (!user) {
            throw new Error('User is required');
        }

        const firstName = additionalData.personalInfo?.firstName || additionalData.firstName || user.displayName?.split(' ')[0] || '';
        const lastName = additionalData.personalInfo?.lastName || additionalData.lastName || user.displayName?.split(' ').slice(1).join(' ') || '';
        const fullName = additionalData.personalInfo?.fullName || additionalData.fullName || `${firstName} ${lastName}`.trim() || user.displayName || user.email.split('@')[0];
        
        // Calculate age from birth date
        let age = null;
        if (additionalData.birthDate) {
            const birthDate = new Date(additionalData.birthDate);
            const today = new Date();
            age = today.getFullYear() - birthDate.getFullYear();
            const monthDiff = today.getMonth() - birthDate.getMonth();
            if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
                age--;
            }
        }

        const patientData = {
            // Basic Information
            uid: user.uid,
            email: user.email,
            displayName: fullName,
            photoURL: user.photoURL || null,
            userType: 'patient',
            authProvider: additionalData.authProvider || 'email',
            
            // Personal Information
            personalInfo: {
                firstName: firstName,
                lastName: lastName,
                fullName: fullName,
                dateOfBirth: additionalData.birthDate || null,
                age: age,
                gender: additionalData.gender || null,
                phone: additionalData.phone || '',
                address: additionalData.address || '',
                bio: additionalData.bio || '',
                location: additionalData.location || ''
            },
            
            // Medical Information
            medicalInfo: {
                conditions: {
                    speech: additionalData.speechConditions || [],
                    physical: additionalData.physicalConditions || [],
                    mental: additionalData.mentalConditions || [],
                    other: additionalData.otherConditions || []
                },
                allergies: additionalData.allergies || [],
                medications: additionalData.medications || [],
                emergencyContact: {
                    name: additionalData.emergencyContactName || '',
                    phone: additionalData.emergencyContactPhone || '',
                    relationship: additionalData.emergencyContactRelationship || ''
                }
            },
            
            // Account Settings
            settings: {
                notifications: true,
                language: 'en',
                theme: 'light',
                privacy: {
                    shareData: false,
                    allowResearch: false
                }
            },
            
            // Activity Tracking
            activity: {
                consultationHistory: [],
                documents: [],
                appointments: []
            },
            
            // Timestamps
            createdAt: serverTimestamp(),
            lastLoginAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
            
            // Profile Status
            profileComplete: Boolean(firstName && lastName && additionalData.phone),
            isActive: true,
            emailVerified: user.emailVerified || false
        };

        await setDoc(doc(db, 'patients', user.uid), patientData, { merge: true });
        // Patient document created successfully
        return patientData;
    } catch (error) {
        console.error('Error creating patient document:', error);
        throw error;
    }
}

/**
 * Update patient personal information
 */
export async function updatePatientPersonalInfo(userId, personalInfo) {
    try {
        // Check rate limiting
        if (!rateLimiter.isAllowed(userId, 5, 60000)) {
            throw new Error('Too many update attempts. Please wait 1 minute before trying again.');
        }

        // Validate and sanitize the personal information
        const validationResult = validateProfileUpdateData(personalInfo);
        if (!validationResult.valid) {
            throw new Error(validationResult.errors[0]);
        }

        const updates = {
            personalInfo: validationResult.sanitizedData,
            updatedAt: serverTimestamp()
        };
        
        await updateDoc(doc(db, 'patients', userId), updates);
        // Patient personal info updated successfully
        return true;
    } catch (error) {
        console.error('Error updating patient personal info:', error);
        throw error;
    }
}

/**
 * Update patient medical information
 */
export async function updatePatientMedicalInfo(userId, medicalInfo) {
    try {
        const updates = {
            medicalInfo: medicalInfo,
            updatedAt: serverTimestamp()
        };
        
        await updateDoc(doc(db, 'patients', userId), updates);
        // Patient medical info updated successfully
        return true;
    } catch (error) {
        console.error('Error updating patient medical info:', error);
        throw error;
    }
}

/**
 * Update patient settings
 */
export async function updatePatientSettings(userId, settings) {
    try {
        const updates = {
            settings: settings,
            updatedAt: serverTimestamp()
        };
        
        await updateDoc(doc(db, 'patients', userId), updates);
        // Patient settings updated successfully
        return true;
    } catch (error) {
        console.error('Error updating patient settings:', error);
        throw error;
    }
}

/**
 * Add medical condition to patient
 */
export async function addMedicalCondition(userId, category, condition) {
    try {
        // Check rate limiting
        if (!rateLimiter.isAllowed(userId, 10, 60000)) {
            throw new Error('Too many condition additions. Please wait 1 minute before trying again.');
        }

        // Validate category
        const categoryResult = validateCategory(category);
        if (!categoryResult.valid) {
            throw new Error(categoryResult.error);
        }

        // Validate condition
        const conditionResult = validateMedicalCondition(condition);
        if (!conditionResult.valid) {
            throw new Error(conditionResult.error);
        }

        const conditionPath = `medicalInfo.conditions.${categoryResult.value}`;
        const updates = {
            [conditionPath]: arrayUnion(conditionResult.value),
            updatedAt: serverTimestamp()
        };
        
        await updateDoc(doc(db, 'patients', userId), updates);
        console.log('Medical condition added successfully');
        return true;
    } catch (error) {
        console.error('Error adding medical condition:', error);
        throw error;
    }
}

/**
 * Remove medical condition from patient
 */
export async function removeMedicalCondition(userId, category, condition) {
    try {
        const conditionPath = `medicalInfo.conditions.${category}`;
        const updates = {
            [conditionPath]: arrayRemove(condition),
            updatedAt: serverTimestamp()
        };
        
        await updateDoc(doc(db, 'patients', userId), updates);
        console.log('Medical condition removed successfully');
        return true;
    } catch (error) {
        console.error('Error removing medical condition:', error);
        throw error;
    }
}

// ============= CONSULTATION HISTORY =============

/**
 * Add consultation to patient history
 */
export async function addConsultationHistory(userId, consultation) {
    try {
        const consultationData = {
            id: `consultation_${Date.now()}`,
            date: consultation.date || new Date().toISOString(),
            doctor: consultation.doctor || '',
            type: consultation.type || '',
            status: consultation.status || 'completed',
            notes: consultation.notes || '',
            createdAt: serverTimestamp()
        };
        
        const updates = {
            'activity.consultationHistory': arrayUnion(consultationData),
            updatedAt: serverTimestamp()
        };
        
        await updateDoc(doc(db, 'patients', userId), updates);
        console.log('Consultation history added successfully');
        return true;
    } catch (error) {
        console.error('Error adding consultation history:', error);
        throw error;
    }
}

/**
 * Get patient consultation history
 */
export async function getConsultationHistory(userId) {
    try {
        const patientData = await getPatientData(userId);
        return patientData?.activity?.consultationHistory || [];
    } catch (error) {
        console.error('Error fetching consultation history:', error);
        throw error;
    }
}

// ============= DOCUMENT MANAGEMENT =============

/**
 * Add document to patient records
 */
export async function addPatientDocument(userId, document) {
    try {
        // Check rate limiting
        if (!rateLimiter.isAllowed(userId, 5, 60000)) {
            throw new Error('Too many document uploads. Please wait 1 minute before trying again.');
        }

        // Validate document name
        const nameResult = validateDocumentName(document.name);
        if (!nameResult.valid) {
            throw new Error(nameResult.error);
        }

        // Sanitize document data
        const documentData = {
            id: `doc_${Date.now()}`,
            name: nameResult.value,
            type: sanitizeInput(document.type || 'other'),
            url: sanitizeInput(document.url || ''),
            size: document.size || 0,
            uploadDate: new Date().toISOString(),
            createdAt: serverTimestamp()
        };
        
        const updates = {
            'activity.documents': arrayUnion(documentData),
            updatedAt: serverTimestamp()
        };
        
        await updateDoc(doc(db, 'patients', userId), updates);
        console.log('Document added successfully');
        return documentData;
    } catch (error) {
        console.error('Error adding document:', error);
        throw error;
    }
}

/**
 * Remove document from patient records
 */
export async function removePatientDocument(userId, documentId) {
    try {
        const patientData = await getPatientData(userId);
        const documents = patientData?.activity?.documents || [];
        const updatedDocuments = documents.filter(doc => doc.id !== documentId);
        
        const updates = {
            'activity.documents': updatedDocuments,
            updatedAt: serverTimestamp()
        };
        
        await updateDoc(doc(db, 'patients', userId), updates);
        console.log('Document removed successfully');
        return true;
    } catch (error) {
        console.error('Error removing document:', error);
        throw error;
    }
}

/**
 * Get patient documents
 */
export async function getPatientDocuments(userId) {
    try {
        const patientData = await getPatientData(userId);
        return patientData?.activity?.documents || [];
    } catch (error) {
        console.error('Error fetching patient documents:', error);
        throw error;
    }
}

// ============= APPOINTMENT MANAGEMENT =============

/**
 * Add appointment to patient records
 */
export async function addAppointment(userId, appointment) {
    try {
        const appointmentData = {
            id: `appointment_${Date.now()}`,
            date: appointment.date || '',
            time: appointment.time || '',
            doctor: appointment.doctor || '',
            type: appointment.type || '',
            status: appointment.status || 'scheduled',
            notes: appointment.notes || '',
            createdAt: serverTimestamp()
        };
        
        const updates = {
            'activity.appointments': arrayUnion(appointmentData),
            updatedAt: serverTimestamp()
        };
        
        await updateDoc(doc(db, 'patients', userId), updates);
        console.log('Appointment added successfully');
        return appointmentData;
    } catch (error) {
        console.error('Error adding appointment:', error);
        throw error;
    }
}

/**
 * Update appointment status
 */
export async function updateAppointmentStatus(userId, appointmentId, status) {
    try {
        const patientData = await getPatientData(userId);
        const appointments = patientData?.activity?.appointments || [];
        const updatedAppointments = appointments.map(apt => 
            apt.id === appointmentId ? { ...apt, status, updatedAt: new Date().toISOString() } : apt
        );
        
        const updates = {
            'activity.appointments': updatedAppointments,
            updatedAt: serverTimestamp()
        };
        
        await updateDoc(doc(db, 'patients', userId), updates);
        console.log('Appointment status updated successfully');
        return true;
    } catch (error) {
        console.error('Error updating appointment status:', error);
        throw error;
    }
}

/**
 * Get patient appointments
 */
export async function getPatientAppointments(userId) {
    try {
        const patientData = await getPatientData(userId);
        return patientData?.activity?.appointments || [];
    } catch (error) {
        console.error('Error fetching patient appointments:', error);
        throw error;
    }
}

// ============= REAL-TIME LISTENERS =============

/**
 * Listen to patient data changes
 */
export function listenToPatientData(userId, callback) {
    const unsubscribe = onSnapshot(doc(db, 'patients', userId), (doc) => {
        if (doc.exists()) {
            callback(doc.data());
        } else {
            callback(null);
        }
    });
    
    return unsubscribe;
}

// ============= UTILITY FUNCTIONS =============

/**
 * Update last login timestamp
 */
export async function updateLastLogin(userId) {
    try {
        console.log('🕐 Updating last login for user:', userId);
        
        // First, check if patient document exists
        const docRef = doc(db, 'patients', userId);
        const docSnap = await getDoc(docRef);
        
        if (docSnap.exists()) {
            // Document exists, update it
            await updateDoc(docRef, {
                lastLoginAt: serverTimestamp()
            });
            console.log('✅ Last login updated successfully');
        } else {
            // Document doesn't exist, skip update silently
            console.log('⚠️ Patient document does not exist, skipping last login update');
        }
    } catch (error) {
        // Don't throw error, just log it - last login update is not critical
        console.warn('⚠️ Error updating last login (non-critical):', error.message);
    }
}

/**
 * Check if user profile is complete
 */
export async function checkProfileComplete(userId) {
    try {
        const patientData = await getPatientData(userId);
        if (!patientData) return false;
        
        const personalInfo = patientData.personalInfo || {};
        const hasBasicInfo = personalInfo.firstName && personalInfo.lastName && personalInfo.phone;
        
        return Boolean(hasBasicInfo);
    } catch (error) {
        console.error('Error checking profile completion:', error);
        return false;
    }
}

/**
 * Get patient statistics
 */
export async function getPatientStats(userId) {
    try {
        const patientData = await getPatientData(userId);
        if (!patientData) return null;
        
        const activity = patientData.activity || {};
        
        return {
            totalConsultations: activity.consultationHistory?.length || 0,
            totalDocuments: activity.documents?.length || 0,
            totalAppointments: activity.appointments?.length || 0,
            completedConsultations: activity.consultationHistory?.filter(c => c.status === 'completed').length || 0,
            upcomingAppointments: activity.appointments?.filter(a => a.status === 'scheduled').length || 0
        };
    } catch (error) {
        console.error('Error fetching patient stats:', error);
        return null;
    }
}

// Console log for debugging
console.log('Firestore Database Service ready - Auth and DB instances created');

// Export Firebase instances
export { app, auth, db };
