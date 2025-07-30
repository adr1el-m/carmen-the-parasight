// Firebase configuration for LingapLink Healthcare System
import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import configValidator from '../utils/config-validator.js';

// Get validated Firebase configuration
let firebaseConfig;

try {
  const validatedConfig = configValidator.getValidatedConfig();
  firebaseConfig = validatedConfig.firebase;
  
  // Log configuration status (without exposing sensitive data)
  console.log(`✅ Firebase configuration loaded for ${validatedConfig.environment} environment`);
  console.log(`📁 Project: ${firebaseConfig.projectId}`);
  
} catch (error) {
  console.error('❌ Firebase configuration error:', error.message);
  
  if (configValidator.isProduction) {
    throw new Error('Firebase configuration is required in production. Please check your environment variables.');
  } else {
    // In development, use secure fallbacks
    console.warn('⚠️ Using secure development fallbacks for Firebase configuration');
    console.warn('📝 To enable Google Sign-In, create a .env file with your Firebase credentials:');
    console.warn('   VITE_FIREBASE_API_KEY=your_actual_api_key');
    console.warn('   VITE_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com');
    console.warn('   VITE_FIREBASE_PROJECT_ID=your_project_id');
    console.warn('   VITE_FIREBASE_STORAGE_BUCKET=your_project.appspot.com');
    console.warn('   VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id');
    console.warn('   VITE_FIREBASE_APP_ID=your_app_id');
    
    firebaseConfig = {
      apiKey: configValidator.generateSecureFallback('firebase-api-key', 39),
      authDomain: 'dev-project.firebaseapp.com',
      projectId: 'dev-project-id',
      storageBucket: 'dev-project.appspot.com',
      messagingSenderId: '123456789012',
      appId: '1:123456789012:web:abcdef1234567890',
      measurementId: 'G-DEVXXXXXXXX'
    };
  }
}

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase services
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);

// Export the app instance
export default app;

// Types for TypeScript
export interface ClinicProfile {
  id: string;
  email: string;
  clinicName: string;
  licenseNumber: string;
  facilityType: 'hospital' | 'clinic' | 'health_center';
  createdAt: any;
  updatedAt?: any;
}

export interface PatientAssessment {
  id?: string;
  patientName: string;
  age: number;
  gender: 'male' | 'female' | 'other';
  vitalSigns: {
    systolic?: number;
    diastolic?: number;
    heartRate?: number;
    respiratoryRate?: number;
    temperature?: number;
    oxygenSaturation?: number;
  };
  painLevel: number;
  consciousnessLevel?: string;
  mobility?: string;
  symptoms: string[];
  conditions: string[];
  urgencyLevel: {
    level: number;
    name: string;
    color: string;
    maxWait: number;
  };
  urgencyScore: number;
  clinicId: string;
  timestamp: any;
  status: 'waiting' | 'in_progress' | 'completed';
}

export interface AppointmentRequest {
  id?: string;
  patientName: string;
  patientEmail?: string;
  patientPhone: string;
  requestedDate: string;
  requestedTime: string;
  reason: string;
  urgency: 'low' | 'medium' | 'high' | 'critical';
  clinicId: string;
  status: 'pending' | 'approved' | 'rejected' | 'completed';
  createdAt: any;
  updatedAt?: any;
} 