# Healthcare Facility Integration Guide

## Overview

This guide explains the complete implementation of healthcare facility registration and search functionality in the LingapLink platform. The system allows healthcare facilities to register and patients to find and book appointments with them.

## 🏗️ Architecture

### Data Flow
1. **Healthcare Facilities** register through `PartnerSignUp.tsx`
2. **Facility data** is stored in Firestore under the `facilities` collection
3. **Patients** can search and view facilities in `PatientPortal.tsx`
4. **Appointment booking** connects facilities with patients

### Database Schema

#### Facilities Collection (`facilities/{facilityId}`)
```typescript
interface Facility {
  uid: string                    // Firebase Auth UID
  name: string                   // Facility name (e.g., "Carmen Medical Clinic")
  type: string                   // Facility type (e.g., "Medical Clinic", "Hospital")
  email: string                  // Contact email
  phone: string                  // Contact phone
  address: string                // Street address
  city: string                   // City
  province: string               // Province/State
  postalCode: string             // Postal code
  country: string                // Country
  website: string                // Website URL
  specialties: string[]          // Medical specialties offered
  services: string[]             // Services provided
  operatingHours: {              // Operating hours for each day
    monday: { open: string, close: string, closed: boolean }
    tuesday: { open: string, close: string, closed: boolean }
    // ... other days
  }
  staff: {                       // Staff information
    total: number
    doctors: number
    nurses: number
    supportStaff: number
  }
  capacity: {                    // Facility capacity
    beds: number
    consultationRooms: number
  }
  languages: string[]            // Languages spoken
  accreditation: string[]        // Accreditations
  insuranceAccepted: string[]    // Accepted insurance
  licenseNumber: string          // License number
  description: string            // Facility description
  isActive: boolean              // Whether facility is active
  isSearchable: boolean          // Whether facility appears in search
  createdAt: Timestamp           // Creation timestamp
  updatedAt: Timestamp           // Last update timestamp
}
```

## 🚀 Implementation Details

### 1. PartnerSignUp Component (`src/components/PartnerSignUp.tsx`)

**Purpose**: Allows healthcare facilities to register with LingapLink

**Key Features**:
- Multi-step registration form
- Firebase Authentication integration
- Google OAuth support
- Form validation
- Firestore data storage

**Registration Process**:
1. Facility fills out basic information (name, type, contact details)
2. Firebase Auth account is created
3. Facility profile is stored in Firestore
4. Facility is redirected to Dashboard

**Code Example**:
```typescript
// Create facility profile in Firestore
const createFacilityProfile = async (user: any, facilityData: FormData) => {
  const { getFirestore, doc, setDoc, serverTimestamp } = await import('firebase/firestore')
  const db = getFirestore()
  
  const facilityRef = doc(db, 'facilities', user.uid)
  await setDoc(facilityRef, {
    uid: user.uid,
    name: facilityData.facilityName,
    type: facilityData.facilityType,
    // ... other facility data
    isActive: true,
    isSearchable: true, // Makes it visible to patients
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp()
  })
}
```

### 2. Facility Service (`src/services/facility-service.ts`)

**Purpose**: Handles all facility-related database operations

**Key Functions**:
- `searchFacilities()` - Search facilities with filters
- `getFacility()` - Get specific facility by ID
- `getFacilityTypes()` - Get all available facility types
- `getCities()` - Get all cities with facilities
- `getProvinces()` - Get all provinces with facilities
- `getSpecialties()` - Get all available specialties
- `getServices()` - Get all available services
- `getNearbyFacilities()` - Get facilities by city

**Code Example**:
```typescript
// Search facilities with filters
async searchFacilities(filters: SearchFilters = {}): Promise<Facility[]> {
  let q = query(
    collection(this.db, 'facilities'),
    where('isActive', '==', true),
    where('isSearchable', '==', true)
  )

  // Add filters
  if (filters.name) {
    q = query(q, where('name', '>=', filters.name), where('name', '<=', filters.name + '\uf8ff'))
  }
  if (filters.type) {
    q = query(q, where('type', '==', filters.type))
  }
  // ... more filters

  const querySnapshot = await getDocs(q)
  return querySnapshot.docs.map(doc => ({ ...doc.data(), uid: doc.id }))
}
```

### 3. PatientPortal Facilities Section

**Purpose**: Allows patients to search and view healthcare facilities

**Key Features**:
- Search by facility name
- Filter by type, city, specialty
- Facility cards with detailed information
- Rating system
- Operating hours display
- Book appointment functionality

**Navigation**: Added "Facilities" tab in the sidebar

**Code Example**:
```tsx
{/* Facilities Section */}
{activeSection === 'facilities' && (
  <section className="content-section active">
    <div className="section-header">
      <h1>Healthcare Facilities</h1>
      <p>Find and book appointments with healthcare providers near you</p>
    </div>
    
    <div className="facilities-search">
      {/* Search and filter controls */}
    </div>
    
    <div className="facilities-grid">
      {/* Facility cards */}
      <div className="facility-card">
        <div className="facility-header">
          <div className="facility-icon">
            <i className="fas fa-hospital"></i>
          </div>
          <div className="facility-info">
            <h3>Carmen Medical Clinic</h3>
            <p className="facility-type">Medical Clinic</p>
            <p className="facility-location">
              <i className="fas fa-map-marker-alt"></i>
              Makati City, Metro Manila
            </p>
          </div>
          <div className="facility-rating">
            {/* Rating display */}
          </div>
        </div>
        
        <div className="facility-details">
          {/* Specialties, services, hours */}
        </div>
        
        <div className="facility-actions">
          <button className="btn btn-outline">View Details</button>
          <button className="btn btn-primary">Book Appointment</button>
        </div>
      </div>
    </div>
  </section>
)}
```

### 4. Styling (`src/styles/patientPortal.css`)

**Purpose**: Provides responsive design for the facilities section

**Key Features**:
- Grid layout for facility cards
- Hover effects and animations
- Mobile-responsive design
- Consistent with existing design system

## 🔧 Setup Instructions

### 1. Firebase Configuration

Ensure your Firebase project has the following collections:
- `facilities` - For storing facility data
- `users` - For user authentication
- `appointments` - For appointment booking (future)

### 2. Firestore Security Rules

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Facilities collection
    match /facilities/{facilityId} {
      allow read: if true; // Anyone can read facility data
      allow write: if request.auth != null && 
                   request.auth.uid == facilityId; // Only facility owner can write
    }
    
    // Users collection
    match /users/{userId} {
      allow read, write: if request.auth != null && 
                        request.auth.uid == userId;
    }
  }
}
```

### 3. Environment Variables

Ensure your `.env` file contains:
```env
VITE_FIREBASE_API_KEY=your_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_auth_domain
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_storage_bucket
VITE_FIREBASE_MESSAGING_SENDER_ID=your_messaging_sender_id
VITE_FIREBASE_APP_ID=your_app_id
```

## 🧪 Testing

### Manual Testing

1. **Register a Facility**:
   - Navigate to `/partner-signup`
   - Fill out the registration form
   - Verify facility appears in Firestore

2. **Search Facilities**:
   - Navigate to PatientPortal
   - Click "Facilities" tab
   - Test search and filter functionality
   - Verify facility cards display correctly

### Automated Testing

Use the test script (`test-facility-connection.js`) to verify:
- Firestore connection
- Facility creation
- Facility retrieval
- Facility search

## 📱 User Experience Flow

### For Healthcare Facilities

1. **Registration**:
   - Click "Partner with LingapLink" on landing page
   - Fill out registration form
   - Complete email verification
   - Access facility dashboard

2. **Profile Management**:
   - Update facility information
   - Manage operating hours
   - Add/remove services
   - View patient appointments

### For Patients

1. **Facility Discovery**:
   - Navigate to PatientPortal
   - Click "Facilities" tab
   - Search by name, type, or location
   - Filter by specialties or services

2. **Appointment Booking**:
   - View facility details
   - Check operating hours
   - Click "Book Appointment"
   - Select date and time
   - Confirm booking

## 🔮 Future Enhancements

### Planned Features

1. **Advanced Search**:
   - Distance-based search
   - Insurance filter
   - Availability filter
   - Rating filter

2. **Facility Management**:
   - Staff management
   - Schedule management
   - Patient records
   - Analytics dashboard

3. **Patient Features**:
   - Facility reviews and ratings
   - Appointment history
   - Prescription management
   - Telemedicine integration

4. **Integration Features**:
   - Payment processing
   - Insurance verification
   - Lab result integration
   - Pharmacy integration

## 🛠️ Troubleshooting

### Common Issues

1. **Facility not appearing in search**:
   - Check `isSearchable` field is `true`
   - Verify `isActive` field is `true`
   - Ensure Firestore rules allow reading

2. **Registration fails**:
   - Check Firebase Auth configuration
   - Verify Firestore rules allow writing
   - Check console for error messages

3. **Search not working**:
   - Verify facility service is imported correctly
   - Check Firestore indexes are created
   - Ensure proper error handling

### Debug Tools

1. **Firebase Console**:
   - Monitor Firestore data
   - Check authentication logs
   - View error reports

2. **Browser Console**:
   - Check for JavaScript errors
   - Monitor network requests
   - Debug component state

## 📊 Performance Considerations

1. **Firestore Indexes**:
   - Create composite indexes for complex queries
   - Optimize for common search patterns
   - Monitor query performance

2. **Caching**:
   - Implement client-side caching for facility data
   - Use React Query or SWR for data fetching
   - Cache search results

3. **Pagination**:
   - Implement pagination for large facility lists
   - Use Firestore cursor-based pagination
   - Limit initial load size

## 🔒 Security Considerations

1. **Data Validation**:
   - Validate all input data
   - Sanitize user inputs
   - Implement rate limiting

2. **Access Control**:
   - Proper Firestore security rules
   - Role-based access control
   - Audit logging

3. **Privacy**:
   - HIPAA compliance considerations
   - Data encryption
   - Secure data transmission

## 📞 Support

For technical support or questions about the facility integration:

1. Check the Firebase documentation
2. Review the code comments
3. Test with the provided test script
4. Monitor browser console for errors

---

**Last Updated**: December 2024
**Version**: 1.0.0
**Author**: LingapLink Development Team 