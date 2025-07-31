// Test script to verify Firestore facility connection
import { initializeApp } from 'firebase/app'
import { getFirestore, doc, setDoc, getDoc, collection, query, where, getDocs } from 'firebase/firestore'

// Firebase configuration (you'll need to replace with your actual config)
const firebaseConfig = {
  apiKey: "your-api-key",
  authDomain: "your-auth-domain",
  projectId: "your-project-id",
  storageBucket: "your-storage-bucket",
  messagingSenderId: "your-messaging-sender-id",
  appId: "your-app-id"
}

// Initialize Firebase
const app = initializeApp(firebaseConfig)
const db = getFirestore(app)

// Test function to create a sample facility
async function createSampleFacility() {
  try {
    const facilityData = {
      uid: 'test-facility-001',
      name: 'Carmen Medical Clinic',
      type: 'Medical Clinic',
      email: 'info@carmenmedical.com',
      phone: '+63 2 1234 5678',
      address: '123 Medical Plaza',
      city: 'Makati',
      province: 'Metro Manila',
      postalCode: '1200',
      country: 'Philippines',
      website: 'https://carmenmedical.com',
      specialties: ['General Medicine', 'Cardiology', 'Pediatrics'],
      services: ['Consultation', 'Laboratory Tests', 'Vaccination'],
      operatingHours: {
        monday: { open: '08:00', close: '18:00', closed: false },
        tuesday: { open: '08:00', close: '18:00', closed: false },
        wednesday: { open: '08:00', close: '18:00', closed: false },
        thursday: { open: '08:00', close: '18:00', closed: false },
        friday: { open: '08:00', close: '18:00', closed: false },
        saturday: { open: '08:00', close: '12:00', closed: false },
        sunday: { open: '08:00', close: '12:00', closed: true }
      },
      staff: {
        total: 15,
        doctors: 5,
        nurses: 8,
        supportStaff: 2
      },
      capacity: {
        beds: 0,
        consultationRooms: 8
      },
      languages: ['English', 'Filipino'],
      accreditation: ['Department of Health', 'Philippine Medical Association'],
      insuranceAccepted: ['PhilHealth', 'Maxicare', 'Medicard'],
      licenseNumber: 'DOH-2024-001',
      description: 'A comprehensive medical clinic providing quality healthcare services to the community.',
      isActive: true,
      isSearchable: true,
      createdAt: new Date(),
      updatedAt: new Date()
    }

    // Create the facility document
    const facilityRef = doc(db, 'facilities', facilityData.uid)
    await setDoc(facilityRef, facilityData)
    
    console.log('✅ Sample facility created successfully!')
    console.log('Facility ID:', facilityData.uid)
    console.log('Facility Name:', facilityData.name)
    
    return facilityData.uid
  } catch (error) {
    console.error('❌ Error creating sample facility:', error)
    throw error
  }
}

// Test function to retrieve the sample facility
async function getSampleFacility(facilityId) {
  try {
    const facilityRef = doc(db, 'facilities', facilityId)
    const facilitySnap = await getDoc(facilityRef)
    
    if (facilitySnap.exists()) {
      const facilityData = facilitySnap.data()
      console.log('✅ Sample facility retrieved successfully!')
      console.log('Facility Data:', facilityData)
      return facilityData
    } else {
      console.log('❌ Facility not found')
      return null
    }
  } catch (error) {
    console.error('❌ Error retrieving sample facility:', error)
    throw error
  }
}

// Test function to search for facilities
async function searchFacilities() {
  try {
    const q = query(
      collection(db, 'facilities'),
      where('isActive', '==', true),
      where('isSearchable', '==', true)
    )
    
    const querySnapshot = await getDocs(q)
    const facilities = []
    
    querySnapshot.forEach((doc) => {
      facilities.push({
        id: doc.id,
        ...doc.data()
      })
    })
    
    console.log('✅ Facilities search completed!')
    console.log('Found facilities:', facilities.length)
    facilities.forEach(facility => {
      console.log(`- ${facility.name} (${facility.type}) in ${facility.city}`)
    })
    
    return facilities
  } catch (error) {
    console.error('❌ Error searching facilities:', error)
    throw error
  }
}

// Main test function
async function runTests() {
  console.log('🚀 Starting Firestore facility connection tests...\n')
  
  try {
    // Test 1: Create sample facility
    console.log('📝 Test 1: Creating sample facility...')
    const facilityId = await createSampleFacility()
    console.log('')
    
    // Test 2: Retrieve sample facility
    console.log('🔍 Test 2: Retrieving sample facility...')
    await getSampleFacility(facilityId)
    console.log('')
    
    // Test 3: Search for facilities
    console.log('🔎 Test 3: Searching for facilities...')
    await searchFacilities()
    console.log('')
    
    console.log('🎉 All tests completed successfully!')
    console.log('✅ Firestore connection is working properly')
    console.log('✅ Facilities can be created, retrieved, and searched')
    
  } catch (error) {
    console.error('💥 Test failed:', error)
    console.log('❌ Please check your Firebase configuration and Firestore rules')
  }
}

// Run the tests if this file is executed directly
if (typeof window === 'undefined') {
  runTests()
}

export { createSampleFacility, getSampleFacility, searchFacilities } 