// api/controllers/authController.js
const { auth, db, admin } = require('../config/firebase');

// Example: Register a new user and create a profile in Firestore
const registerUser = async (req, res) => {
  const { email, password, userType, firstName, lastName, ...otherProfileData } = req.body;

  if (!email || !password || !userType || !firstName || !lastName) {
    return res.status(400).json({ message: 'Missing required fields for registration.' });
  }

  try {
    // 1. Create user in Firebase Authentication
    const userRecord = await auth.createUser({
      email: email,
      password: password,
      emailVerified: false, // Set to true after email verification
      disabled: false,
    });

    const uid = userRecord.uid;

    // 2. Set custom claims for user type (important for authorization middleware)
    await auth.setCustomUserClaims(uid, { userType: userType });

    // 3. Create user profile in Firestore based on userType
    if (userType === 'patient') {
      await db.collection('patients').doc(uid).set({
        userId: uid,
        name: { firstName, lastName },
        email: email, // Denormalize email for easier queries
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        // ... include other patient-specific fields from otherProfileData
        ...otherProfileData
      });
    } else if (userType === 'business') {
      await db.collection('businesses').doc(uid).set({
        userId: uid,
        businessName: `${firstName} ${lastName}`, // Assuming name is business name for simplicity
        email: email, // Denormalize email
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        // ... include other business-specific fields from otherProfileData
        ...otherProfileData
      });
    } else {
      // Handle invalid userType
      await auth.deleteUser(uid); // Clean up partially created user
      return res.status(400).json({ message: 'Invalid user type provided.' });
    }

    res.status(201).json({ message: 'User registered successfully. Email verification may be required.' });

  } catch (error) {
    console.error('Error registering user:', error);
    // Handle specific Firebase errors (e.g., email-already-in-use)
    if (error.code === 'auth/email-already-in-use') {
      return res.status(409).json({ message: 'Email is already in use.' });
    }
    res.status(500).json({ message: 'Internal server error during registration.' });
  }
};

// Example: Login (if you want backend to issue custom tokens or handle login flow)
// For most web apps, Firebase client SDK handles direct login and token issuance.
// This endpoint would be used if you need a custom server-side login flow.
const loginUser = async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ message: 'Email and password are required.' });
  }

  try {
    // This is a simplified example. In a real scenario, you might use Firebase client SDK
    // on the frontend to sign in, then send the ID token to the backend.
    // If you need a backend-driven login, you'd integrate with a service that validates
    // credentials and then mint a custom token.
    // For demonstration, let's assume a successful external authentication or direct Firebase Admin SDK verification.

    // This part is for demonstration. In practice, direct password validation here is not recommended.
    // You'd typically use client-side Firebase Auth or a more complex backend auth flow.
    // A common pattern: Frontend logs in with Firebase SDK, sends ID token to backend for verification.

    // If you need to generate a custom token for a user that just logged in via your backend logic:
    const userRecord = await auth.getUserByEmail(email);
    const customToken = await auth.createCustomToken(userRecord.uid);

    res.status(200).json({ message: 'Login successful.', customToken: customToken, uid: userRecord.uid });

  } catch (error) {
    console.error('Error logging in user:', error);
    if (error.code === 'auth/user-not-found' || error.code === 'auth/wrong-password') {
      return res.status(401).json({ message: 'Invalid credentials.' });
    }
    res.status(500).json({ message: 'Internal server error during login.' });
  }
};

module.exports = {
  registerUser,
  loginUser,
};