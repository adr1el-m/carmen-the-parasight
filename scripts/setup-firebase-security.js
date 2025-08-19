#!/usr/bin/env node

/**
 * Firebase Security Setup Script
 * Helps developers configure Firebase security properly
 */

const fs = require('fs');
const path = require('path');
const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

console.log('🔒 Firebase Security Setup Script');
console.log('==================================\n');

// Check if .env file exists
const envPath = path.join(process.cwd(), '.env');
const envTemplatePath = path.join(process.cwd(), 'env.template');

if (!fs.existsSync(envTemplatePath)) {
  console.error('❌ env.template not found. Please ensure it exists in the project root.');
  process.exit(1);
}

if (fs.existsSync(envPath)) {
  console.log('⚠️  .env file already exists. This script will help you verify your configuration.');
} else {
  console.log('📝 Creating new .env file from template...');
  fs.copyFileSync(envTemplatePath, envPath);
  console.log('✅ .env file created successfully.');
}

console.log('\n🔧 Let\'s configure your Firebase security settings...\n');

// Firebase configuration questions
const questions = [
  {
    name: 'apiKey',
    question: 'Enter your Firebase API Key: ',
    required: true,
    validate: (value) => value.length >= 30
  },
  {
    name: 'authDomain',
    question: 'Enter your Firebase Auth Domain (e.g., project.firebaseapp.com): ',
    required: true,
    validate: (value) => value.endsWith('.firebaseapp.com')
  },
  {
    name: 'projectId',
    question: 'Enter your Firebase Project ID: ',
    required: true,
    validate: (value) => /^[a-z0-9-]+$/.test(value)
  },
  {
    name: 'storageBucket',
    question: 'Enter your Firebase Storage Bucket (e.g., project.appspot.com): ',
    required: true,
    validate: (value) => value.endsWith('.appspot.com')
  },
  {
    name: 'messagingSenderId',
    question: 'Enter your Firebase Messaging Sender ID: ',
    required: true,
    validate: (value) => /^\d+$/.test(value)
  },
  {
    name: 'appId',
    question: 'Enter your Firebase App ID: ',
    required: true,
    validate: (value) => value.includes(':')
  },
  {
    name: 'measurementId',
    question: 'Enter your Firebase Measurement ID (optional, press Enter to skip): ',
    required: false,
    validate: (value) => !value || value.startsWith('G-')
  }
];

const answers = {};

async function askQuestion(questionObj) {
  return new Promise((resolve) => {
    rl.question(questionObj.question, (answer) => {
      if (questionObj.required && !answer.trim()) {
        console.log('❌ This field is required. Please try again.');
        askQuestion(questionObj).then(resolve);
        return;
      }
      
      if (questionObj.validate && !questionObj.validate(answer.trim())) {
        console.log('❌ Invalid format. Please check your input and try again.');
        askQuestion(questionObj).then(resolve);
        return;
      }
      
      answers[questionObj.name] = answer.trim();
      resolve();
    });
  });
}

async function runSetup() {
  try {
    // Ask all questions
    for (const question of questions) {
      await askQuestion(question);
    }
    
    // Read current .env file
    let envContent = fs.readFileSync(envPath, 'utf8');
    
    // Update Firebase configuration
    const firebaseVars = {
      'VITE_FIREBASE_API_KEY': answers.apiKey,
      'VITE_FIREBASE_AUTH_DOMAIN': answers.authDomain,
      'VITE_FIREBASE_PROJECT_ID': answers.projectId,
      'VITE_FIREBASE_STORAGE_BUCKET': answers.storageBucket,
      'VITE_FIREBASE_MESSAGING_SENDER_ID': answers.messagingSenderId,
      'VITE_FIREBASE_APP_ID': answers.appId
    };
    
    if (answers.measurementId) {
      firebaseVars['VITE_FIREBASE_MEASUREMENT_ID'] = answers.measurementId;
    }
    
    // Replace values in .env file
    for (const [key, value] of Object.entries(firebaseVars)) {
      const regex = new RegExp(`^${key}=.*$`, 'm');
      if (regex.test(envContent)) {
        envContent = envContent.replace(regex, `${key}=${value}`);
      } else {
        // Add if not found
        envContent += `\n${key}=${value}`;
      }
    }
    
    // Write updated .env file
    fs.writeFileSync(envPath, envContent);
    
    console.log('\n✅ Firebase configuration updated successfully!');
    
    // Security recommendations
    console.log('\n🔒 Security Recommendations:');
    console.log('============================');
    console.log('1. ✅ Environment variables configured');
    console.log('2. 🔧 Deploy Firebase security rules:');
    console.log('   firebase deploy --only firestore:rules');
    console.log('   firebase deploy --only storage');
    console.log('3. 🔍 Test your configuration:');
    console.log('   npm run dev');
    console.log('4. 📊 Monitor Firebase usage in console');
    console.log('5. 🚨 Set up security alerts');
    
    // Next steps
    console.log('\n📋 Next Steps:');
    console.log('===============');
    console.log('1. Test your application with the new configuration');
    console.log('2. Deploy security rules to Firebase');
    console.log('3. Review the FIREBASE_SECURITY_GUIDE.md');
    console.log('4. Set up monitoring and alerting');
    console.log('5. Train your team on security procedures');
    
    // Security checklist
    console.log('\n🔍 Security Checklist:');
    console.log('=====================');
    console.log('□ Firebase Security Rules deployed');
    console.log('□ Storage Security Rules deployed');
    console.log('□ User authentication configured');
    console.log('□ Role-based access control active');
    console.log('□ Audit logging enabled');
    console.log('□ Rate limiting implemented');
    console.log('□ Monitoring and alerts configured');
    
  } catch (error) {
    console.error('❌ Setup failed:', error.message);
    process.exit(1);
  } finally {
    rl.close();
  }
}

// Run the setup
runSetup();



