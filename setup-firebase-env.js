#!/usr/bin/env node

/**
 * Firebase Environment Setup Script
 * This script helps you create a .env file with the required Firebase configuration
 */

const fs = require('fs');
const path = require('path');
const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

console.log('🔧 Firebase Environment Setup');
console.log('============================\n');

console.log('This script will help you create a .env file with your Firebase configuration.');
console.log('You will need to get these values from your Firebase Console:\n');

console.log('1. Go to: https://console.firebase.google.com/project/carmen-para-sight-v2');
console.log('2. Click on the gear icon (⚙️) next to "Project Overview"');
console.log('3. Click "Project settings"');
console.log('4. Scroll down to "Your apps" section');
console.log('5. If you don\'t have a web app, click "Add app" and choose "Web"');
console.log('6. Copy the configuration values\n');

const questions = [
  {
    name: 'apiKey',
    question: 'Enter your Firebase API Key: ',
    required: true
  },
  {
    name: 'senderId',
    question: 'Enter your Firebase Messaging Sender ID: ',
    required: true
  },
  {
    name: 'appId',
    question: 'Enter your Firebase App ID: ',
    required: true
  },
  {
    name: 'measurementId',
    question: 'Enter your Firebase Measurement ID (optional, press Enter to skip): ',
    required: false
  }
];

const answers = {};

function askQuestion(index) {
  if (index >= questions.length) {
    createEnvFile();
    return;
  }

  const question = questions[index];
  rl.question(question.question, (answer) => {
    if (question.required && (!answer || answer.trim() === '')) {
      console.log('❌ This field is required. Please provide a value.\n');
      askQuestion(index);
      return;
    }

    answers[question.name] = answer.trim();
    askQuestion(index + 1);
  });
}

function createEnvFile() {
  const envContent = `# HealthSync PH Environment Variables
# ⚠️  CRITICAL SECURITY: This file contains sensitive configuration
# ⚠️  The .env file is already in .gitignore to prevent accidental commits

# Node Environment
NODE_ENV=development

# Firebase Configuration (Client-Side)
# ⚠️ CRITICAL: These are exposed to the client and should be considered public
# ⚠️ SECURITY: Use Firebase Security Rules to restrict access, not API keys

VITE_FIREBASE_API_KEY=${answers.apiKey}
VITE_FIREBASE_AUTH_DOMAIN=carmen-para-sight-v2.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=carmen-para-sight-v2
VITE_FIREBASE_STORAGE_BUCKET=carmen-para-sight-v2.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=${answers.senderId}
VITE_FIREBASE_APP_ID=${answers.appId}
${answers.measurementId ? `VITE_FIREBASE_MEASUREMENT_ID=${answers.measurementId}` : '# VITE_FIREBASE_MEASUREMENT_ID=YOUR_MEASUREMENT_ID_HERE'}

# Application Settings
VITE_APP_NAME=LingapLink
VITE_APP_VERSION=1.0.0
VITE_ENVIRONMENT=development

# API Configuration
VITE_API_URL=http://localhost:3001

# ✅ Firebase configuration complete!
# Restart your development server for changes to take effect.
`;

  const envPath = path.join(__dirname, '.env');
  
  try {
    fs.writeFileSync(envPath, envContent);
    console.log('\n✅ .env file created successfully!');
    console.log('📁 Location:', envPath);
    console.log('\n🔧 Next steps:');
    console.log('1. Restart your development server');
    console.log('2. Try signing in with Google again');
    console.log('3. The Firebase configuration error should be resolved');
    console.log('\n⚠️  Security reminder:');
    console.log('- The .env file is already in .gitignore');
    console.log('- Never commit this file to version control');
    console.log('- Keep your Firebase credentials secure');
  } catch (error) {
    console.error('\n❌ Failed to create .env file:', error.message);
    console.log('\n🔧 Manual setup:');
    console.log('1. Create a file named .env in your project root');
    console.log('2. Copy the content below into it:');
    console.log('\n' + '='.repeat(50));
    console.log(envContent);
    console.log('='.repeat(50));
  }

  rl.close();
}

// Start the setup process
askQuestion(0);
