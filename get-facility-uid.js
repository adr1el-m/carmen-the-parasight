// Script to get the actual facility UID
// Run this in the browser console when signed in as Carmen Medical Clinic

async function getFacilityUID() {
  try {
    // Import Firebase modules
    const { getAuth } = await import('https://www.gstatic.com/firebasejs/11.9.1/firebase-auth.js')
    
    const auth = getAuth()
    
    if (!auth.currentUser) {
      console.error('Please sign in as Carmen Medical Clinic first')
      return
    }
    
    console.log('🏥 Facility User Info:')
    console.log('UID:', auth.currentUser.uid)
    console.log('Email:', auth.currentUser.email)
    console.log('Display Name:', auth.currentUser.displayName)
    
    // Also check if there's already a facility document
    const { getFirestore, doc, getDoc } = await import('https://www.gstatic.com/firebasejs/11.9.1/firebase-firestore.js')
    const db = getFirestore()
    
    const facilityDocRef = doc(db, 'facilities', auth.currentUser.uid)
    const facilityDocSnap = await getDoc(facilityDocRef)
    
    if (facilityDocSnap.exists()) {
      console.log('✅ Facility document exists with UID:', auth.currentUser.uid)
      console.log('Facility data:', facilityDocSnap.data())
    } else {
      console.log('❌ No facility document found with UID:', auth.currentUser.uid)
    }
    
    // Check if there are any facility documents with "carmen" in the name
    const { collection, query, where, getDocs } = await import('https://www.gstatic.com/firebasejs/11.9.1/firebase-firestore.js')
    
    const facilitiesRef = collection(db, 'facilities')
    const q = query(facilitiesRef, where('name', '==', 'Carmen Medical Clinic'))
    const querySnapshot = await getDocs(q)
    
    console.log('🔍 Searching for Carmen Medical Clinic documents...')
    querySnapshot.forEach((doc) => {
      console.log('Found facility document:', doc.id, doc.data())
    })
    
    return auth.currentUser.uid
    
  } catch (error) {
    console.error('Error getting facility UID:', error)
  }
}

// Run the function
getFacilityUID() 