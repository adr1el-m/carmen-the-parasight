const express = require('express');
const router = express.Router();
const { body, param } = require('express-validator');
const { authenticateUser, requireRole } = require('../middleware/auth');
const { mediumLimiter, modificationLimiter } = require('../middleware/rateLimiters');
const { validateInput } = require('../middleware/validation');
const { sanitizeString, sanitizeNumber, sanitizeArray, sanitizeEmail, sanitizePhone } = require('../utils/inputSanitization');
const errorSanitizer = require('../utils/errorSanitizer');
const { getFirestoreDb } = require('../config/firebase'); // Get Firestore instance

/**
 * @route GET /api/patient/:id
 * @desc Get details for a specific patient.
 * @access Private (Admin, Doctor, Nurse, Patient - self-access only)
 * @middleware mediumLimiter, authenticateUser, requireRole, validateInput
 */
router.get('/:id',
    mediumLimiter,
    authenticateUser,
    requireRole(['admin', 'doctor', 'nurse', 'patient']),
    [
        param('id')
            .isString()
            .isLength({ min: 1, max: 50 })
            .matches(/^[a-zA-Z0-9_-]+$/)
            .withMessage('Invalid patient ID format. Must be alphanumeric with hyphens or underscores.')
    ],
    validateInput,
    async (req, res) => {
        try {
            const db = getFirestoreDb(); // Get Firestore instance
            const { id } = req.params;
            const userId = req.user.uid;
            const userRole = req.user.role || req.user.custom_claims?.role;

            const sanitizedId = sanitizeString(id, 50);

            // Authorization check: patients can only access their own data
            if (userRole === 'patient' && sanitizedId !== userId) {
                return res.status(403).json({
                    error: 'Forbidden',
                    message: 'You are not authorized to access this patient\'s data. Patients can only view their own records.'
                });
            }

            if (db) {
                const patientDocRef = db.collection('patients').doc(sanitizedId);
                const patientDoc = await patientDocRef.get();

                if (!patientDoc.exists) {
                    return res.status(404).json({
                        error: 'Not Found',
                        message: 'Patient not found with the provided ID.'
                    });
                }
                const patientData = patientDoc.data();
                return res.json({ ...patientData, id: patientDoc.id });
            } else {
                console.warn('Firestore database not initialized, returning mock patient data.');
                // Fallback to mock data if Firebase is not connected
                const patient = {
                    id: sanitizedId,
                    name: 'Mock Patient Name',
                    age: 30,
                    condition: 'Common cold',
                    nextAppointment: '2025-08-01',
                    lastVisit: '2025-07-20',
                    medications: ['Paracetamol'],
                    documents: [],
                    contactInfo: {
                        email: 'mock.patient@example.com',
                        phone: '+639123456789'
                    },
                    emergencyContact: {
                        name: 'Mock Emergency',
                        relationship: 'Friend',
                        phone: '+639209876543'
                    },
                    lastUpdated: new Date().toISOString()
                };
                res.json(patient);
            }
        } catch (error) {
            const sanitized = errorSanitizer.sanitizeError(error, { context: 'fetch-patient-data' });
            res.status(500).json({
                error: 'Failed to fetch patient data',
                ...sanitized
            });
        }
    }
);

/**
 * @route POST /api/patient
 * @desc Create a new patient record.
 * @access Private (Admin, Doctor, Nurse)
 * @middleware modificationLimiter, authenticateUser, requireRole, validateInput
 */
router.post('/',
    modificationLimiter,
    authenticateUser,
    requireRole(['admin', 'doctor', 'nurse']),
    [
        body('name')
            .isString()
            .isLength({ min: 2, max: 100 })
            .withMessage('Name must be between 2 and 100 characters.')
            .trim(),
        body('age')
            .isInt({ min: 0, max: 150 })
            .withMessage('Age must be a valid number between 0 and 150.'),
        body('gender')
            .optional()
            .isIn(['Male', 'Female', 'Other', 'Prefer not to say'])
            .withMessage('Invalid gender value.'),
        body('address')
            .optional()
            .isString()
            .isLength({ max: 255 })
            .withMessage('Address must be less than 255 characters.')
            .trim(),
        body('condition')
            .optional()
            .isString()
            .isLength({ max: 500 })
            .withMessage('Condition must be less than 500 characters.')
            .trim(),
        body('medications')
            .optional()
            .isArray()
            .withMessage('Medications must be an array of strings.'),
        body('medications.*')
            .isString()
            .isLength({ max: 100 })
            .withMessage('Each medication must be a string under 100 characters.')
            .trim(),
        body('contactInfo.email')
            .optional()
            .isEmail()
            .withMessage('Please provide a valid email address.')
            .normalizeEmail(),
        body('contactInfo.phone')
            .optional()
            .isString()
            .isLength({ min: 7, max: 20 })
            .withMessage('Phone number must be between 7 and 20 characters.')
            .trim(),
        body('emergencyContact.name')
            .optional()
            .isString()
            .isLength({ min: 2, max: 100 })
            .withMessage('Emergency contact name must be between 2 and 100 characters.')
            .trim(),
        body('emergencyContact.relationship')
            .optional()
            .isString()
            .isLength({ min: 2, max: 50 })
            .withMessage('Emergency contact relationship must be between 2 and 50 characters.')
            .trim(),
        body('emergencyContact.phone')
            .optional()
            .isString()
            .isLength({ min: 7, max: 20 })
            .withMessage('Emergency contact phone number must be between 7 and 20 characters.')
            .trim(),
    ],
    validateInput,
    async (req, res) => {
        try {
            const db = getFirestoreDb(); // Get Firestore instance
            const patientData = req.body;
            const userId = req.user.uid; // User creating the record

            // Sanitize all incoming data
            const sanitizedData = {
                name: sanitizeString(patientData.name, 100),
                age: sanitizeNumber(patientData.age, 0, 150),
                gender: patientData.gender ? sanitizeString(patientData.gender, 50) : null,
                address: patientData.address ? sanitizeString(patientData.address, 255) : null,
                condition: patientData.condition ? sanitizeString(patientData.condition, 500) : null,
                medications: sanitizeArray(patientData.medications, 50, (item) => sanitizeString(item, 100)),
                contactInfo: {
                    email: patientData.contactInfo?.email ? sanitizeEmail(patientData.contactInfo.email) : null,
                    phone: patientData.contactInfo?.phone ? sanitizePhone(patientData.contactInfo.phone) : null
                },
                emergencyContact: {
                    name: patientData.emergencyContact?.name ? sanitizeString(patientData.emergencyContact.name, 100) : null,
                    relationship: patientData.emergencyContact?.relationship ? sanitizeString(patientData.emergencyContact.relationship, 50) : null,
                    phone: patientData.emergencyContact?.phone ? sanitizePhone(patientData.emergencyContact.phone) : null
                },
                createdBy: userId,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString()
            };

            if (db) {
                // For new documents, Firestore can auto-generate an ID, or you can specify one
                const docRef = db.collection('patients').doc(); // Auto-generate new ID
                await docRef.set(sanitizedData); // Use set for creating new doc with auto-generated ID
                sanitizedData.id = docRef.id; // Assign the new ID to the response

                res.status(201).json({ // 201 Created
                    success: true,
                    message: 'Patient record created successfully.',
                    patient: sanitizedData, // Return the saved data with its new ID
                    timestamp: new Date().toISOString()
                });
            } else {
                console.warn('Firestore database not initialized, returning mock patient creation response.');
                const mockPatientId = `mock_patient_${Date.now()}`;
                res.status(201).json({
                    success: true,
                    message: 'Patient data received (DB not connected for persistence).',
                    patient: { ...sanitizedData, id: mockPatientId },
                    timestamp: new Date().toISOString()
                });
            }
        } catch (error) {
            console.error('Error in /patient (POST):', error);
            const sanitized = errorSanitizer.sanitizeError(error, { context: 'create-patient-data' });
            res.status(500).json({
                error: 'Failed to save patient data',
                ...sanitized
            });
        }
    }
);

module.exports = router;