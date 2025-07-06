// Firebase configuration for LingapLink Healthcare System
import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

// Firebase config - using environment variables for security
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "your-api-key-here",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "your-project.firebaseapp.com",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "your-project-id",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "your-project.appspot.com",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "123456789",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "1:123456789:web:abcdef123456",
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID || "G-XXXXXXXXXX"
};

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