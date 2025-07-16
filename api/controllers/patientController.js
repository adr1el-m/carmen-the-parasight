// api/controllers/patientController.js - Converted to ES Module syntax

// IMPORTANT: Change require() to import and add .js extension for local files
import { db, admin } from '../config/firebase.js'; // Include 'admin' for FieldValue.serverTimestamp()

export const getPatientProfile = async (req, res) => { // IMPORTANT: Add export
  try {
    const uid = req.user.uid; // User UID from the authenticated token
    const patientRef = db.collection('patients').doc(uid);
    const doc = await patientRef.get();

    if (!doc.exists) {
      return res.status(404).json({ message: 'Patient profile not found.' });
    }

    res.status(200).json(doc.data());
  } catch (error) {
    console.error('Error getting patient profile:', error);
    res.status(500).json({ message: 'Internal server error.' });
  }
};

export const updatePatientProfile = async (req, res) => { // IMPORTANT: Add export
  try {
    const uid = req.user.uid;
    const { name, address, contactNumber, dateOfBirth, medicalHistory, allergies } = req.body;

    // Basic server-side validation
    if (!name || !address || !contactNumber) {
      return res.status(400).json({ message: 'Missing required fields: name, address, and contactNumber.' });
    }

    const patientRef = db.collection('patients').doc(uid);
    await patientRef.set({ // Use .set with merge: true to avoid overwriting the whole document
      name,
      address,
      contactNumber,
      dateOfBirth: dateOfBirth ? new Date(dateOfBirth) : null, // Convert string to Date object for Firestore
      medicalHistory: medicalHistory || [],
      allergies: allergies || [],
      updatedAt: admin.firestore.FieldValue.serverTimestamp() // Update timestamp
    }, { merge: true });

    res.status(200).json({ message: 'Patient profile updated successfully.' });
  } catch (error) {
    console.error('Error updating patient profile:', error);
    res.status(500).json({ message: 'Internal server error.' });
  }
};

// IMPORTANT: Remove module.exports. Functions are now directly exported using 'export const'
// module.exports = {
//   getPatientProfile,
//   updatePatientProfile,
// };