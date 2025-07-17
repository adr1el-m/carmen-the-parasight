// api/config/firebase.js
import admin from 'firebase-admin';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs'; // Import Node.js file system module

// Get __dirname equivalent in ES Modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load other environment variables from .env (like PORT)
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

// --- IMPORTANT CHANGE: Read serviceAccountKey.json directly ---
const serviceAccountPath = path.resolve(__dirname, './serviceAccountKey.json');

let serviceAccount;
try {
    const serviceAccountJson = fs.readFileSync(serviceAccountPath, 'utf8');
    serviceAccount = JSON.parse(serviceAccountJson);
    console.log('Firebase service account key loaded successfully from file.'); // Debugging log
} catch (error) {
    console.error('Error loading or parsing serviceAccountKey.json:', error);
    console.error('Expected path:', serviceAccountPath);
    process.exit(1); // Exit the process if the key cannot be loaded
}
// --- END IMPORTANT CHANGE ---

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();
const auth = admin.auth();

export { db, auth, admin };