const express = require('express');
const router = express.Router();
const { body, query } = require('express-validator');
const { authenticateUser, requireRole } = require('../middleware/auth');
const { mediumLimiter, modificationLimiter } = require('../middleware/rateLimiters');
const { validateInput } = require('../middleware/validation');
const { sanitizeString, sanitizeNumber } = require('../utils/inputSanitization');
const errorSanitizer = require('../utils/errorSanitizer');
// const { getFirestoreDb } = require('../config/firebase'); // Uncomment if using Firebase

/**
 * @route GET /api/telemedicine/patients
 * @desc Get a list of patients suitable for telemedicine or remote care.
 * @access Private (Admin, Doctor, Nurse, Community Health Worker)
 * @middleware mediumLimiter, authenticateUser, requireRole, validateInput
 */
router.get('/patients',
    mediumLimiter,
    authenticateUser,
    requireRole(['admin', 'doctor', 'nurse', 'chw']),
    [
        query('limit')
            .optional()
            .isInt({ min: 1, max: 100 })
            .withMessage('Limit must be between 1 and 100'),
        query('offset')
            .optional()
            .isInt({ min: 0 })
            .withMessage('Offset must be a non-negative integer'),
        query('location')
            .optional()
            .isString()
            .isLength({ min: 1, max: 100 })
            .withMessage('Location must be under 100 characters')
            .trim(),
        query('urgency')
            .optional()
            .isIn(['Low', 'Medium', 'High', 'Critical'])
            .withMessage('Invalid urgency level'),
        query('connectivity')
            .optional()
            .isIn(['None', '2G', '3G', '4G', '5G', 'Satellite'])
            .withMessage('Invalid connectivity type')
    ],
    validateInput,
    async (req, res) => {
        try {
            // const db = getFirestoreDb(); // Get Firestore instance
            const userId = req.user.uid;
            const userRole = req.user.role || req.user.custom_claims?.role;
            const userLocation = req.user.location; // Assuming user has a location claim
            const { limit = 50, offset = 0, location, urgency, connectivity } = req.query;

            // Mock data for demonstration. In a real app, this would query Firebase.
            let ruralPatients = [
                { id: 'pat_RM001', name: 'Rosa Dela Cruz', location: 'Siquijor Island', distance: 623, condition: 'Heavy Menstrual Bleeding', urgency: 'High', connectivity: 'None', communicationMethod: 'Radio', hasSmartphone: false, nearestHealthCenter: 'Siquijor Provincial Hospital', communityHealthWorker: 'Aling Nena Villanueva', lastContact: '2025-01-10', status: 'Waiting for consultation' },
                { id: 'pat_RM002', name: 'Luz Mendoza', location: 'Basilan, Isabela City', distance: 789, condition: 'Pregnancy Complications', urgency: 'Critical', connectivity: '2G', communicationMethod: 'CHW', hasSmartphone: false, nearestHealthCenter: 'Basilan General Hospital', communityHealthWorker: 'Mang Tony Ramos', lastContact: '2025-01-12', status: 'Emergency referral needed' },
                { id: 'pat_RM003', name: 'Pedro Maligalig', location: 'Mt. Province, Sagada', distance: 450, condition: 'Chronic Cough', urgency: 'Medium', connectivity: '3G', communicationMethod: 'SMS', hasSmartphone: true, nearestHealthCenter: 'Sagada Rural Health Unit', communityHealthWorker: 'Ka Linda', lastContact: '2025-07-01', status: 'Telemedicine pending' },
                { id: 'pat_RM004', name: 'Fatima Khan', location: 'Tawi-Tawi', distance: 900, condition: 'Malnutrition (child)', urgency: 'High', connectivity: 'None', communicationMethod: 'Mobile Clinic', hasSmartphone: false, nearestHealthCenter: 'Bongao District Hospital', communityHealthWorker: 'Hadji Omar', lastContact: '2025-07-15', status: 'Requires follow-up' }
            ];

            let filteredPatients = ruralPatients;

            // Apply filters
            if (location) {
                filteredPatients = filteredPatients.filter(p =>
                    p.location.toLowerCase().includes(location.toLowerCase())
                );
            }
            if (urgency) {
                filteredPatients = filteredPatients.filter(p => p.urgency === urgency);
            }
            if (connectivity) {
                filteredPatients = filteredPatients.filter(p => p.connectivity === connectivity);
            }

            // Role-based filtering: CHWs/Nurses might only see patients in their assigned areas
            if (userRole !== 'admin' && userLocation) {
                filteredPatients = filteredPatients.filter(p => p.location.includes(userLocation)); // Simplified check
            }


            const paginatedPatients = filteredPatients.slice(parseInt(offset), parseInt(offset) + parseInt(limit));

            res.json({
                patients: paginatedPatients,
                totalCount: filteredPatients.length,
                limit: parseInt(limit),
                offset: parseInt(offset),
                lastUpdated: new Date().toISOString()
            });
        } catch (error) {
            const sanitized = errorSanitizer.sanitizeError(error, { context: 'fetch-rural-patients' });
            res.status(500).json({
                error: 'Failed to fetch rural patients',
                ...sanitized
            });
        }
    }
);

/**
 * @route POST /api/telemedicine/schedule-offline
 * @desc Schedule an offline consultation for a patient (e.g., mobile clinic, CHW visit).
 * @access Private (Admin, Doctor, Nurse, CHW)
 * @middleware modificationLimiter, authenticateUser, requireRole, validateInput
 */
router.post('/schedule-offline',
    modificationLimiter,
    authenticateUser,
    requireRole(['admin', 'doctor', 'nurse', 'chw']),
    [
        body('patientId')
            .isString()
            .isLength({ min: 1, max: 50 })
            .withMessage('Patient ID is required and must be under 50 characters')
            .trim(),
        body('method')
            .isIn(['Radio', 'CHW', 'Mobile Clinic', 'Offline Form', 'SMS', 'Physical Visit'])
            .withMessage('Invalid consultation method. Must be one of: Radio, CHW, Mobile Clinic, Offline Form, SMS, Physical Visit'),
        body('scheduledDate')
            .isISO8601()
            .toDate()
            .withMessage('Valid scheduled date (ISO8601 format) is required')
            .custom((value) => {
                if (new Date(value) <= new Date()) {
                    throw new Error('Scheduled date must be in the future');
                }
                return true;
            }),
        body('notes')
            .optional()
            .isString()
            .isLength({ max: 1000 })
            .withMessage('Notes must be under 1000 characters')
            .trim(),
        body('priority')
            .optional()
            .isIn(['Low', 'Medium', 'High', 'Critical'])
            .withMessage('Invalid priority level. Must be Low, Medium, High, or Critical')
    ],
    validateInput,
    async (req, res) => {
        try {
            // const db = getFirestoreDb(); // Get Firestore instance
            const { patientId, method, scheduledDate, notes, priority } = req.body;
            const userId = req.user.uid;
            const userRole = req.user.role || req.user.custom_claims?.role;

            // Sanitize inputs
            const sanitizedData = {
                patientId: sanitizeString(patientId, 50),
                method: sanitizeString(method, 50),
                scheduledDate: new Date(scheduledDate).toISOString(), // Store as ISO string
                notes: sanitizeString(notes || '', 1000),
                priority: sanitizeString(priority || 'Medium', 20),
                scheduledBy: userId,
                status: 'scheduled', // Initial status
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString()
            };

            // In production, save to Firebase
            // if (db) {
            //     const docRef = db.collection('offlineConsultations').doc();
            //     await docRef.set({ ...sanitizedData, id: docRef.id });
            //     sanitizedData.id = docRef.id; // Assign the ID generated by Firestore
            //     console.log(`Offline consultation scheduled for patient ${patientId} by ${userId}.`);
            // } else {
            //     console.warn('Firestore database not initialized, skipping save operation for offline consultation.');
            // }

            // Mock response if DB not connected
            const consultation = {
                id: `cons_${Date.now()}`, // Mock ID
                ...sanitizedData
            };

            res.status(201).json({ // 201 Created
                success: true,
                message: `${consultation.method} consultation scheduled successfully for patient ${consultation.patientId}.`,
                consultation
            });
        } catch (error) {
            const sanitized = errorSanitizer.sanitizeError(error, { context: 'schedule-offline-consultation' });
            res.status(500).json({
                error: 'Failed to schedule consultation',
                ...sanitized
            });
        }
    }
);

module.exports = router;