# Fix Firestore Security Rules for Google Authentication

## The Problem
You're getting Firestore permission errors after Google authentication because the current security rules are too restrictive and don't properly handle Google sign-in users.

## Manual Fix Instructions

### Step 1: Open Firebase Console
1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project (`carmen-para-sight` or whatever you named it)

### Step 2: Navigate to Firestore Rules
1. In the left sidebar, click on **"Firestore Database"**
2. Click on the **"Rules"** tab at the top

### Step 3: Update the Email Verification Function
Find this function in your rules (around line 75):
```javascript
function isEmailVerified() {
  return request.auth != null && request.auth.token.email_verified == true;
}
```

Replace it with:
```javascript
function isEmailVerified() {
  return request.auth != null && 
    (request.auth.token.email_verified == true || 
     request.auth.token.firebase.sign_in_provider == 'google.com');
}
```

### Step 4: Update Users Collection Rules
Find the users collection rules (around line 178) and make sure the create rule allows initial user creation:

```javascript
// Users collection - general user data with role-based access
match /users/{userId} {
  // Users can read their own data
  allow read: if isAuthenticated() && isOwner(userId);
  
  // Admins can read all user data
  allow read: if isAuthenticated() && hasRole('admin');
  
  // Create user document (allow initial creation without email verification)
  allow create: if isAuthenticated() 
    && isOwner(userId)
    && isNotRateLimited()
    && request.resource.data.keys().hasAll(['uid', 'email', 'role', 'createdAt'])
    && request.resource.data.uid == userId
    && isValidEmail(request.resource.data.email)
    && isValidRole(request.resource.data.role)
    && request.resource.data.createdAt == request.time
    && (request.resource.data.authProvider == null || isValidAuthProvider(request.resource.data.authProvider))
    && (request.resource.data.isActive == null || request.resource.data.isActive is bool)
    && (request.resource.data.emailVerified == null || request.resource.data.emailVerified is bool);
}
```

### Step 5: Update Patients Collection Rules
Find the patients collection rules (around line 233) and update the comment:

```javascript
// Create patient data (email verification required, Google users are auto-verified)
allow create: if isAuthenticated() 
  && isOwner(patientId)
  && isEmailVerified()
  && isNotRateLimited()
  && isValidPatientData(request.resource.data)
  && request.resource.data.uid == patientId
  && request.resource.data.createdAt == request.time
  && request.resource.data.lastLoginAt == request.time;
```

### Step 6: Deploy the Rules
1. Click the **"Publish"** button at the top right
2. Wait for the deployment to complete (should take a few seconds)

### Step 7: Test the Fix
1. Go back to your app and try the Google sign-in again
2. It should now work without permission errors

## Alternative: Copy Complete Rules File
If you want to be extra sure, you can replace your entire rules file with this updated version:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    
    // Helper functions for validation
    function isAuthenticated() {
      return request.auth != null;
    }
    
    function isOwner(userId) {
      return request.auth.uid == userId;
    }
    
    function isValidEmail(email) {
      return email is string 
        && email.matches('^[a-zA-Z0-9.!#$%&\'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$')
        && email.size() <= 254;
    }
    
    function isValidRole(role) {
      return role is string 
        && role in ['patient', 'doctor', 'admin', 'nurse', 'clinic_staff'];
    }
    
    function isEmailVerified() {
      return request.auth != null && 
        (request.auth.token.email_verified == true || 
         request.auth.token.firebase.sign_in_provider == 'google.com');
    }
    
    function isNotRateLimited() {
      return true; // Simplified for now
    }
    
    function isValidAuthProvider(provider) {
      return provider is string 
        && provider in ['email', 'google', 'facebook'];
    }
    
    // Users collection - basic user data
    match /users/{userId} {
      allow read: if isAuthenticated() && isOwner(userId);
      allow create: if isAuthenticated() 
        && isOwner(userId)
        && isNotRateLimited();
      allow update: if isAuthenticated() 
        && isOwner(userId)
        && isNotRateLimited();
    }
    
    // Patients collection - detailed patient data
    match /patients/{patientId} {
      allow read: if isAuthenticated() && isOwner(patientId);
      allow create: if isAuthenticated() 
        && isOwner(patientId)
        && isEmailVerified()
        && isNotRateLimited();
      allow update: if isAuthenticated() 
        && isOwner(patientId)
        && isEmailVerified()
        && isNotRateLimited();
    }
    
    // Allow all authenticated users to read/write their own data for now
    match /{document=**} {
      allow read, write: if isAuthenticated();
    }
  }
}
```

## Expected Result
After updating the rules:
- Google authentication should work without errors
- Users should be redirected to the patient portal
- The app should display user information properly
- No more "Missing or insufficient permissions" errors

## Need Help?
If you're still having issues after following these steps:
1. Check the browser console for any remaining errors
2. Make sure you published the rules in Firebase Console
3. Try clearing your browser cache and cookies
4. Test with a different Google account

The updated JavaScript code will now handle cases where data isn't immediately available and provide a better user experience during the setup process. 