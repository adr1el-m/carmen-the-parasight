# Appointment Booking Integration

## Overview
This document explains how appointments booked in the PatientPortal appear in the Dashboard's "My Consults" section.

## Flow

### 1. Patient Books Appointment (PatientPortal)
- Patient navigates to PatientPortal
- Clicks "Book Appointment" button
- Selects "Carmen Medical Clinic" from the facility dropdown
- Fills in appointment details (date, time, type, etc.)
- Submits the form

### 2. Data Storage (Firestore)
- Appointment data is saved to Firestore using `addAppointment()` function
- Data is stored in two places:
  - Patient document: `patients/{userId}/activity/appointments`
  - Facility document: `facilities/{facilityId}/appointments`

### 3. Dashboard Display (Dashboard)
- Dashboard loads appointments for Carmen Medical Clinic (facility ID: `g9dIxoSXbLM0Q95uUVNsLDddPJA2`)
- Uses `getFacilityAppointments()` to fetch appointments
- Real-time listener `listenToFacilityAppointments()` automatically updates when new appointments are added
- Appointments are displayed in the "My Consults" section

## Key Components

### PatientPortal.tsx
- Booking form with facility selection
- Uses `addAppointment()` to save appointment data
- Shows success message directing user to check Dashboard

### Dashboard.tsx
- "My Consults" section displays facility appointments
- Real-time updates via Firestore listener
- Refresh button for manual updates
- Shows facility name (Carmen Medical Clinic)

### firestoredb.js
- `addAppointment()`: Saves appointment to both patient and facility documents
- `getFacilityAppointments()`: Retrieves appointments for a specific facility
- `listenToFacilityAppointments()`: Real-time listener for appointment updates

## Testing the Integration

1. **Book an Appointment:**
   - Go to PatientPortal
   - Click "Book Appointment"
   - Select "Carmen Medical Clinic"
   - Fill in appointment details
   - Submit the form

2. **View in Dashboard:**
   - Go to Dashboard
   - Navigate to "My Consults" section
   - The appointment should appear in the list
   - Real-time updates should work automatically

## Facility ID
- **Carmen Medical Clinic**: `g9dIxoSXbLM0Q95uUVNsLDddPJA2`
- This is the mock healthcare facility used for testing

## Notes
- The integration uses real-time Firestore listeners for automatic updates
- Both patient and facility documents are updated when appointments are booked
- The Dashboard shows appointments from the facility perspective (as a doctor would see them)
- TypeScript errors about missing declaration files are expected since we're importing JavaScript files 