// Check Current User Script
// Run this in the browser console to see which user is signed in

import { getAuth } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js';

const auth = getAuth();

console.log('🔍 Checking current user...');

if (auth.currentUser) {
  console.log('✅ User is signed in:');
  console.log('   UID:', auth.currentUser.uid);
  console.log('   Email:', auth.currentUser.email);
  console.log('   Display Name:', auth.currentUser.displayName);
  console.log('   Provider:', auth.currentUser.providerData[0]?.providerId);
} else {
  console.log('❌ No user is currently signed in');
}

// Listen for auth state changes
auth.onAuthStateChanged((user) => {
  if (user) {
    console.log('🔄 Auth state changed - User signed in:');
    console.log('   UID:', user.uid);
    console.log('   Email:', user.email);
    console.log('   Display Name:', user.displayName);
  } else {
    console.log('🔄 Auth state changed - User signed out');
  }
}); 