// Setup script for Carmen Medical Clinic facility
// Run this in the browser console after signing in as the facility

// First, make sure you're signed in as Carmen Medical Clinic
// Then run this script in the browser console

async function setupCarmenMedicalClinic() {
  try {
    // Import Firebase modules
    const { getFirestore, doc, setDoc, serverTimestamp } = await import('https://www.gstatic.com/firebasejs/11.9.1/firebase-firestore.js')
    const { getAuth } = await import('https://www.gstatic.com/firebasejs/11.9.1/firebase-auth.js')
    
    const auth = getAuth()
    const db = getFirestore()
    
    if (!auth.currentUser) {
      console.error('Please sign in as Carmen Medical Clinic first')
      return
    }
    
    const facilityData = {
      uid: auth.currentUser.uid,
      name: 'Carmen Medical Clinic',
      type: 'Medical Clinic',
      email: auth.currentUser.email,
      phone: '+63 2 8123 4567',
      address: '123 Carmen Street',
      city: 'Makati City',
      province: 'Metro Manila',
      postalCode: '1234',
      country: 'Philippines',
      website: 'https://carmenmedicalclinic.ph',
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
        consultationRooms: 3
      },
      languages: ['English', 'Filipino'],
      accreditation: ['Department of Health', 'Philippine Medical Association'],
      insuranceAccepted: ['PhilHealth', 'Maxicare', 'Medicard'],
      licenseNumber: 'CLINIC-2024-001',
      description: 'A modern medical clinic providing comprehensive healthcare services to the community.',
      isActive: true,
      isSearchable: true,
      appointments: [], // Will be populated when patients book appointments
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    }
    
    // Create the facility document
    await setDoc(doc(db, 'facilities', auth.currentUser.uid), facilityData)
    
    console.log('✅ Carmen Medical Clinic facility document created successfully!')
    console.log('Facility ID:', auth.currentUser.uid)
    console.log('You can now receive appointments from patients!')
    
  } catch (error) {
    console.error('❌ Error setting up facility:', error)
  }
}

// Run the setup
setupCarmenMedicalClinic() 