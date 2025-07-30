# Firebase Setup Guide

## Current Issue
The Google Sign-In is failing because the app is using placeholder Firebase credentials instead of real ones.

## Quick Fix Steps

### 1. Get Your Firebase Configuration
1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project (or create a new one)
3. Go to Project Settings (gear icon) → General
4. Scroll down to "Your apps" section
5. Click on your web app (or create one if you don't have it)
6. Copy the configuration object

### 2. Create Environment File
Create a file named `.env` in your project root (same level as `package.json`) with this content:

```env
# Firebase Configuration
VITE_FIREBASE_API_KEY=your_actual_api_key_here
VITE_FIREBASE_AUTH_DOMAIN=your_project_id.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_project_id.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id
VITE_FIREBASE_MEASUREMENT_ID=your_measurement_id

# Other required variables
VITE_APP_NAME=LingapLink
VITE_APP_VERSION=1.0.0
VITE_ENVIRONMENT=development
JWT_SECRET=your_secure_jwt_secret_here
```

### 3. Enable Google Sign-In
1. In Firebase Console, go to Authentication → Sign-in method
2. Enable Google as a sign-in provider
3. Add your domain (localhost:5173 for development) to the authorized domains list

### 4. Restart Development Server
After creating the `.env` file, restart your development server:

```bash
npm run dev
```

## Example Firebase Config
Your Firebase config should look something like this:

```javascript
const firebaseConfig = {
  apiKey: "AIzaSyC_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx",
  authDomain: "your-project.firebaseapp.com",
  projectId: "your-project-id",
  storageBucket: "your-project.appspot.com",
  messagingSenderId: "123456789012",
  appId: "1:123456789012:web:abcdef1234567890",
  measurementId: "G-XXXXXXXXXX"
};
```

## Troubleshooting
- Make sure your `.env` file is in the project root
- Ensure all environment variables start with `VITE_`
- Check that your Firebase project has Google Sign-In enabled
- Verify your domain is in the authorized domains list
- Restart the development server after making changes

## Security Note
Never commit your `.env` file to version control. It should already be in your `.gitignore` file. 