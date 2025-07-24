// backend/api/config/firebase.js
const admin = require('firebase-admin');
const { getAuth } = require('firebase-admin/auth');
require('dotenv').config({ path: '../.env' }); // Adjust path as necessary, ensuring .env is loaded

const firebaseConfig = {
    apiKey: process.env.FIREBASE_API_KEY || process.env.VITE_FIREBASE_API_KEY,
    authDomain: process.env.FIREBASE_AUTH_DOMAIN || process.env.VITE_FIREBASE_AUTH_DOMAIN,
    projectId: process.env.FIREBASE_PROJECT_ID || process.env.VITE_FIREBASE_PROJECT_ID,
    storageBucket: process.env.FIREBASE_STORAGE_BUCKET || process.env.VITE_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: process.env.FIREBASE_MESSAGING_SENDER_ID || process.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
    appId: process.env.FIREBASE_APP_ID || process.env.VITE_FIREBASE_APP_ID,
    measurementId: process.env.FIREBASE_MEASUREMENT_ID || process.env.VITE_FIREBASE_MEASUREMENT_ID
};

// Validate critical Firebase configuration
if (!firebaseConfig.apiKey || !firebaseConfig.projectId || !firebaseConfig.authDomain) {
    console.error('❌ Firebase client configuration incomplete. Please check your environment variables (e.g., VITE_FIREBASE_API_KEY, VITE_FIREBASE_PROJECT_ID).');
}

let adminAuth;
let db;

try {
    if (!admin.apps.length) {
        const serviceAccountJson = process.env.FIREBASE_SERVICE_ACCOUNT ? JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT) : null;

        if (serviceAccountJson) {
            admin.initializeApp({
                credential: admin.credential.cert(serviceAccountJson),
                projectId: firebaseConfig.projectId // Ensure projectId is correctly derived
            });
            console.log('✅ Firebase Admin SDK initialized using Service Account JSON.');
        } else if (process.env.GOOGLE_APPLICATION_CREDENTIALS) {
            admin.initializeApp({
                credential: admin.credential.applicationDefault(),
                projectId: firebaseConfig.projectId
            });
            console.log('✅ Firebase Admin SDK initialized using Application Default Credentials.');
        } else {
            console.warn('⚠️ Firebase Admin SDK not initialized. Missing FIREBASE_SERVICE_ACCOUNT or GOOGLE_APPLICATION_CREDENTIALS. Authentication and Firestore will be mocked/unavailable.');
        }
    }

    if (admin.apps.length > 0) {
        adminAuth = admin.auth();
        db = admin.firestore();
    } else {
        // Provide mock instances if Firebase Admin SDK couldn't be initialized
        console.warn('⚠️ Providing mock Firebase Auth and Firestore instances for development/unconfigured environments.');
        adminAuth = {
            verifyIdToken: async (token) => {
                // Simplified mock verification for development
                if (token === 'dev-token-admin') return { uid: 'mock-admin-uid', role: 'admin', email: 'admin@example.com' };
                if (token === 'dev-token-doctor') return { uid: 'mock-doctor-uid', role: 'doctor', email: 'doctor@example.com' };
                if (token === 'dev-token-patient') return { uid: 'mock-patient-uid', role: 'patient', email: 'patient@example.com' };
                throw new Error('Invalid mock token');
            },
            // Add other mock methods as needed for testing purposes
        };
        db = {
            collection: (name) => ({
                doc: (id) => ({
                    get: async () => {
                        console.warn(`Mock Firestore: Getting doc '${id}' from collection '${name}'`);
                        // Provide mock data based on collection/doc id for testing
                        if (name === 'patients' && id === 'test-patient-id') {
                             return {
                                 exists: true,
                                 id: 'test-patient-id',
                                 data: () => ({ name: 'Mock Patient', age: 40, condition: 'Fever' })
                             };
                        }
                        return { exists: false, id, data: () => ({}) };
                    },
                    set: async (data, options) => {
                        console.warn(`Mock Firestore: Setting doc '${id}' in collection '${name}' with data`, data, options);
                        return Promise.resolve();
                    }
                }),
                // Add other mock methods like .add(), .where() etc.
            })
        };
    }

} catch (error) {
    console.error('❌ Firebase Admin initialization failed:', error);
    adminAuth = null;
    db = null; // Ensure they are null on failure
}

module.exports = {
    firebaseConfig,
    adminAuth, // Export directly or use getters
    db,        // Export directly or use getters
    getFirebaseAuth: () => adminAuth, // Getter for convenience/flexibility
    getFirestoreDb: () => db         // Getter for convenience/flexibility
};