// api/controllers/businessController.js - Converted to ES Module syntax

// IMPORTANT: Change require() to import and add .js extension for local files
import { db, admin } from '../config/firebase.js';

export const getBusinessProfile = async (req, res) => { // IMPORTANT: Add export
  try {
    const uid = req.user.uid; // User UID from the authenticated token
    const businessRef = db.collection('businesses').doc(uid);
    const doc = await businessRef.get();

    if (!doc.exists) {
      return res.status(404).json({ message: 'Business profile not found.' });
    }

    res.status(200).json(doc.data());
  } catch (error) {
    console.error('Error getting business profile:', error);
    res.status(500).json({ message: 'Internal server error.' });
  }
};

export const updateBusinessProfile = async (req, res) => { // IMPORTANT: Add export
  try {
    const uid = req.user.uid;
    const { businessName, registrationNumber, businessAddress, contactPerson, contactEmail, phoneNumber, servicesOffered, operatingHours, website, logoUrl } = req.body;

    // Basic server-side validation
    if (!businessName || !businessAddress || !contactEmail) {
      return res.status(400).json({ message: 'Missing required fields: businessName, businessAddress, and contactEmail.' });
    }

    const businessRef = db.collection('businesses').doc(uid);
    await businessRef.set({ // Use .set with merge: true
      businessName,
      registrationNumber: registrationNumber || null,
      businessAddress,
      contactPerson: contactPerson || null,
      contactEmail,
      phoneNumber: phoneNumber || null,
      servicesOffered: servicesOffered || [],
      operatingHours: operatingHours || {},
      website: website || null,
      logoUrl: logoUrl || null,
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    }, { merge: true });

    res.status(200).json({ message: 'Business profile updated successfully.' });
  } catch (error) {
    console.error('Error updating business profile:', error);
    res.status(500).json({ message: 'Internal server error.' });
  }
};

// Example: Get services offered by a specific business (accessible to patients)
export const getBusinessServices = async (req, res) => { // IMPORTANT: Add export
  try {
    const { businessId } = req.params; // Get businessId from URL parameter
    const businessRef = db.collection('businesses').doc(businessId);
    const doc = await businessRef.get();

    if (!doc.exists) {
      return res.status(404).json({ message: 'Business not found.' });
    }

    res.status(200).json({
      businessName: doc.data().businessName,
      servicesOffered: doc.data().servicesOffered || [],
      operatingHours: doc.data().operatingHours || {}
    });
  } catch (error) {
    console.error('Error getting business services:', error);
    res.status(500).json({ message: 'Internal server error.' });
  }
};

// IMPORTANT: Remove module.exports. Functions are now directly exported using 'export const'
// module.exports = {
//   getBusinessProfile,
//   updateBusinessProfile,
//   getBusinessServices
// };