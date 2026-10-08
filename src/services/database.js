/**
 * DATABASE SERVICE (NeonDB)
 * This service provides data access functions for the Haliya platform using NeonDB PostgreSQL.
 * All functions call the API which connects to NeonDB.
 */

// Mock data for development
const MOCK_PATIENT_DATA = {
  personalInfo: {
    firstName: 'Mock',
    lastName: 'Patient',
    fullName: 'Mock Patient',
    dateOfBirth: '1990-01-01',
    phone: '+639123456789',
    address: '123 Haliya St, Quezon City'
  },
  medicalInfo: {
    conditions: {},
    allergies: [],
    medications: [],
    surgeries: []
  },
  activity: {
    consultationHistory: [],
    documents: []
  },
  role: 'patient'
};

const MOCK_APPOINTMENTS = [
  {
    id: '1',
    doctorName: 'Dr. Maria Santos',
    specialty: 'Obstetrics and Gynecology',
    time: '10:00 AM',
    date: new Date().toISOString().split('T')[0],
    patientName: 'Mock Patient',
    type: 'Consultation',
    status: 'confirmed'
  }
];

// Utility to handle API calls
async function apiFetch(endpoint, options = {}) {
  try {
    // Get auth token from localStorage (matches auth-service.js SECURE_SESSION_KEYS.TOKEN)
    const token = localStorage.getItem('auth_jwt_token');
    
    const response = await fetch(`/api${endpoint}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
        ...options.headers
      }
    });
    if (!response.ok) {
      console.warn(`API request failed: ${endpoint}`, response.status, response.statusText);
      return null;
    }
    return await response.json();
  } catch (error) {
    console.warn(`API Fetch failed for ${endpoint}:`, error);
    return null;
  }
}

// Patient Data Functions
export const getPatientData = async (userId) => {
  const data = await apiFetch(`/patient/${userId}`);
  return data || MOCK_PATIENT_DATA;
};

export const getCurrentPatientData = async (userId) => {
  return getPatientData(userId);
};

export const createPatientDocument = async (userId, data) => {
  return apiFetch(`/patient/${userId}`, {
    method: 'POST',
    body: JSON.stringify(data)
  });
};

export const updatePatientPersonalInfo = async (userId, data) => {
  return apiFetch(`/patient/${userId}`, {
    method: 'PATCH',
    body: JSON.stringify({ personalInfo: data })
  });
};

// Appointment Functions
export const getFacilityAppointments = async (facilityId) => {
  const data = await apiFetch(`/appointments/facility/${facilityId}`);
  return data?.appointments || [];
};

export const getPatientAppointments = async (patientId) => {
  const data = await apiFetch(`/appointments/patient/${patientId}`);
  return data?.appointments || [];
};

export const addAppointment = async (appointmentData) => {
  const result = await apiFetch('/appointments', {
    method: 'POST',
    body: JSON.stringify(appointmentData)
  });
  return result?.appointment || { id: `new_${Date.now()}`, ...appointmentData };
};

export const updateAppointment = async (id, data) => {
  const result = await apiFetch(`/appointments/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(data)
  });
  return result?.appointment || { id, ...data };
};

export const updateAppointmentStatus = async (id, status) => {
  const result = await apiFetch(`/appointments/${id}/status`, {
    method: 'PATCH',
    body: JSON.stringify({ status })
  });
  return result?.appointment || { id, status };
};

export const deleteAppointment = async (id) => {
  const result = await apiFetch(`/appointments/${id}`, {
    method: 'DELETE'
  });
  return result?.success || true;
};

// Consultation History
export const getConsultationHistory = async (patientId) => {
  return [];
};

export const addConsultationHistory = async (patientId, data) => {
  return true;
};

// Medical Conditions
export const addMedicalCondition = async (patientId, condition) => {
  return true;
};

export const removeMedicalCondition = async (patientId, conditionId) => {
  return true;
};

// Documents
export const getPatientDocuments = async (patientId) => {
  return [];
};

export const addPatientDocument = async (patientId, document) => {
  return { id: `doc_${Date.now()}`, ...document };
};

export const removePatientDocument = async (patientId, documentId) => {
  return true;
};

// Facility Functions
export const getFacilities = async () => {
  const data = await apiFetch('/facilities');
  if (!data || !data.facilities) {
    return [
      {
        uid: 'slmc-1',
        name: "St. Luke's Medical Center",
        type: 'Hospital',
        email: 'info@stluke.com.ph',
        phone: '+632-8789-7700',
        address: '279 E. Rodriguez Sr. Ave',
        city: 'Quezon City',
        province: 'Metro Manila',
        postalCode: '1102',
        country: 'Philippines',
        website: 'https://www.stluke.com.ph',
        specialties: ['Cardiology', 'Oncology', 'Neurology'],
        services: ['Emergency Care', 'Surgery', 'Diagnostics'],
        operatingHours: {
          monday: { open: '08:00', close: '17:00', closed: false },
          tuesday: { open: '08:00', close: '17:00', closed: false },
          wednesday: { open: '08:00', close: '17:00', closed: false },
          thursday: { open: '08:00', close: '17:00', closed: false },
          friday: { open: '08:00', close: '17:00', closed: false },
          saturday: { open: '08:00', close: '12:00', closed: false },
          sunday: { open: '00:00', close: '00:00', closed: true }
        },
        staff: {
          totalStaff: 2500,
          doctors: 500,
          nurses: 1200,
          supportStaff: 800
        },
        capacity: {
          bedCapacity: 650,
          consultationRooms: 50
        },
        languages: ['English', 'Filipino'],
        accreditation: ['DOH', 'PhilHealth'],
        insuranceAccepted: ['PhilHealth', 'Maxicare', 'Medicard'],
        licenseNumber: 'LIC-SLMC-001',
        description: 'Leading tertiary hospital in the Philippines',
        isActive: true,
        isSearchable: true,
        isVerified: true,
        profileComplete: true,
        createdAt: new Date('2020-01-01'),
        updatedAt: new Date()
      },
      {
        uid: 'tmc-1',
        name: 'The Medical City',
        email: 'info@themedicalcity.com',
        phone: '+632-8988-1000',
        address: 'Ortigas Avenue',
        city: 'Pasig City',
        province: 'Metro Manila',
        postalCode: '1605',
        country: 'Philippines',
        website: 'https://www.themedicalcity.com',
        specialties: ['Orthopedics', 'Pediatrics', 'Internal Medicine'],
        services: ['Emergency Care', 'Laboratory', 'Radiology'],
        operatingHours: {
          monday: { open: '00:00', close: '23:59', closed: false },
          tuesday: { open: '00:00', close: '23:59', closed: false },
          wednesday: { open: '00:00', close: '23:59', closed: false },
          thursday: { open: '00:00', close: '23:59', closed: false },
          friday: { open: '00:00', close: '23:59', closed: false },
          saturday: { open: '00:00', close: '23:59', closed: false },
          sunday: { open: '00:00', close: '23:59', closed: false }
        },
        staff: {
          totalStaff: 3000,
          doctors: 600,
          nurses: 1500,
          supportStaff: 900
        },
        capacity: {
          bedCapacity: 700,
          consultationRooms: 60
        },
        languages: ['English', 'Filipino'],
        accreditation: ['DOH', 'PhilHealth', 'JCI'],
        insuranceAccepted: ['PhilHealth', 'Maxicare', 'Medicard', 'AXA'],
        licenseNumber: 'LIC-TMC-001',
        description: 'Premier healthcare institution with 24/7 services',
        isActive: true,
        isSearchable: true,
        isVerified: true,
        profileComplete: true,
        createdAt: new Date('2019-06-15'),
        updatedAt: new Date()
      }
    ];
  }
  
  // Transform snake_case to camelCase
  return data.facilities.map(facility => ({
    uid: facility.uid,
    name: facility.name,
    type: facility.type,
    email: facility.email,
    phone: facility.phone,
    address: facility.address,
    city: facility.city,
    province: facility.province,
    postalCode: facility.postal_code,
    country: facility.country,
    website: facility.website,
    specialties: facility.specialties || [],
    services: facility.services || [],
    operatingHours: facility.operating_hours || {},
    staff: facility.staff || {},
    capacity: facility.capacity || {},
    languages: facility.languages || [],
    accreditation: facility.accreditation || [],
    insuranceAccepted: facility.insurance_accepted || [],
    licenseNumber: facility.license_number,
    description: facility.description,
    isActive: facility.is_active,
    isSearchable: facility.is_searchable,
    isVerified: facility.is_verified,
    profileComplete: facility.profile_complete,
    createdAt: facility.created_at,
    updatedAt: facility.updated_at
  }));
};

// Listeners (Stubbed as we move away from real-time Firestore)
export const listenToPatientData = (userId, callback) => {
  getPatientData(userId).then(callback);
  return () => {}; // No-op unsubscribe
};

export const listenToFacilityAppointments = (facilityId, callback) => {
  getFacilityAppointments(facilityId).then(callback);
  return () => {}; // No-op unsubscribe
};

// Default export
export default {
  getPatientData,
  getCurrentPatientData,
  createPatientDocument,
  updatePatientPersonalInfo,
  getFacilityAppointments,
  getPatientAppointments,
  addAppointment,
  updateAppointment,
  updateAppointmentStatus,
  deleteAppointment,
  getConsultationHistory,
  addConsultationHistory,
  addMedicalCondition,
  removeMedicalCondition,
  getPatientDocuments,
  addPatientDocument,
  removePatientDocument,
  getFacilities,
  listenToPatientData,
  listenToFacilityAppointments
};
