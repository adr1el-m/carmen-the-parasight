#!/usr/bin/env node
/**
 * Environment Variable Verification Script
 * Run this script to verify your environment variables are properly configured
 * 
 * Usage: node scripts/verify-env.js
 */

const fs = require('fs');
const path = require('path');

// Load environment variables
require('dotenv').config();

console.log('🔍 Environment Variable Verification\n');

// Check if .env file exists
const envPath = path.join(process.cwd(), '.env');
if (!fs.existsSync(envPath)) {
    console.error('❌ .env file not found!');
    console.log('📝 Please create a .env file in your project root.');
    console.log('📖 See SECURITY_SETUP.md for detailed instructions.\n');
    process.exit(1);
}


console.log('✅ .env file found\n');

// Required environment variables
const requiredEnvVars = [
    'FIREBASE_API_KEY',
    'FIREBASE_AUTH_DOMAIN', 
    'FIREBASE_PROJECT_ID',
    'VITE_FIREBASE_API_KEY',
    'VITE_FIREBASE_AUTH_DOMAIN',
    'VITE_FIREBASE_PROJECT_ID'
];

const optionalEnvVars = [
    'FIREBASE_STORAGE_BUCKET',
    'FIREBASE_MESSAGING_SENDER_ID',
    'FIREBASE_APP_ID',
    'FIREBASE_MEASUREMENT_ID',
    'VITE_FIREBASE_STORAGE_BUCKET',
    'VITE_FIREBASE_MESSAGING_SENDER_ID',
    'VITE_FIREBASE_APP_ID',
    'VITE_FIREBASE_MEASUREMENT_ID',
    'VITE_GEMINI_API_KEY',
    'CORS_ORIGIN',
    'PORT'
];

let missingRequired = [];
let missingOptional = [];

// Check required variables
console.log('📋 Checking required environment variables:');
requiredEnvVars.forEach(varName => {
    const value = process.env[varName];
    if (!value || value === 'your_actual_firebase_api_key_here' || value === 'your_project_id') {
        console.log(`❌ ${varName}: Not set or using placeholder value`);
        missingRequired.push(varName);
    } else {
        console.log(`✅ ${varName}: Set (${value.substring(0, 10)}...)`);
    }
});

console.log('\n📋 Checking optional environment variables:');
optionalEnvVars.forEach(varName => {
    const value = process.env[varName];
    if (!value || value.includes('your_') || value.includes('here')) {
        console.log(`⚠️  ${varName}: Not set or using placeholder value`);
        missingOptional.push(varName);
    } else {
        console.log(`✅ ${varName}: Set (${value.substring(0, 10)}...)`);
    }
});

// Summary
console.log('\n📊 Summary:');
if (missingRequired.length === 0) {
    console.log('✅ All required environment variables are configured!');
} else {
    console.log(`❌ Missing ${missingRequired.length} required environment variables`);
    console.log('Required variables missing:', missingRequired.join(', '));
}

if (missingOptional.length > 0) {
    console.log(`⚠️  ${missingOptional.length} optional environment variables are not set`);
    console.log('Optional variables missing:', missingOptional.join(', '));
}

// Check for common issues
console.log('\n🔍 Common Issues Check:');

// Check for hardcoded values in config files
const configFiles = [
    'public/js/config.js',
    'src/config/firebase.ts'
];

configFiles.forEach(filePath => {
    if (fs.existsSync(filePath)) {
        const content = fs.readFileSync(filePath, 'utf8');
        if (content.includes('AIzaSy') && !content.includes('import.meta.env')) {
            console.log(`❌ ${filePath}: Contains hardcoded API keys`);
        } else {
            console.log(`✅ ${filePath}: Using environment variables`);
        }
    }
});

// Check .gitignore
const gitignorePath = path.join(process.cwd(), '.gitignore');
if (fs.existsSync(gitignorePath)) {
    const gitignoreContent = fs.readFileSync(gitignorePath, 'utf8');
    if (gitignoreContent.includes('.env')) {
        console.log('✅ .gitignore: .env files are excluded from version control');
    } else {
        console.log('⚠️  .gitignore: .env files are NOT excluded from version control');
    }
}

// Final recommendations
console.log('\n💡 Recommendations:');
if (missingRequired.length > 0) {
    console.log('1. Set the required environment variables in your .env file');
    console.log('2. Get your actual Firebase configuration from the Firebase Console');
    console.log('3. Replace placeholder values with real configuration');
}

if (missingOptional.length > 0) {
    console.log('4. Consider setting optional environment variables for full functionality');
}

console.log('5. Never commit your .env file to version control');
console.log('6. Use different Firebase projects for development and production');
console.log('7. Set up Firebase Security Rules for proper data protection');

console.log('\n📖 For detailed setup instructions, see SECURITY_SETUP.md');

if (missingRequired.length > 0) {
    process.exit(1);
} else {
    console.log('\n🎉 Environment configuration looks good!');
    process.exit(0);
} 