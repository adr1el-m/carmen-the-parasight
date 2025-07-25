const express = require('express');
const router = express.Router();
const { query } = require('express-validator');
const { authenticateUser, requireRole } = require('../middleware/auth');
const { mediumLimiter } = require('../middleware/rateLimiters');
const { validateInput } = require('../middleware/validation');
const errorSanitizer = require('../utils/errorSanitizer');
// const { getFirestoreDb } = require('../config/firebase'); // Uncomment if using Firebase

/**
 * @route GET /api/dashboard/stats
 * @desc Get various dashboard statistics for the healthcare system.
 * @access Private (Admin, Doctor, Nurse)
 * @middleware mediumLimiter, authenticateUser, requireRole, validateInput
 */
router.get('/stats',
    mediumLimiter,
    authenticateUser,
    requireRole(['admin', 'doctor', 'nurse']),
    [
        query('startDate')
            .optional()
            .isISO8601()
            .withMessage('Start date must be in ISO8601 format (YYYY-MM-DD)'),
        query('endDate')
            .optional()
            .isISO8601()
            .withMessage('End date must be in ISO8601 format (YYYY-MM-DD)')
            .custom((value, { req }) => {
                if (req.query.startDate && value < req.query.startDate) {
                    throw new Error('End date cannot be before start date');
                }
                return true;
            }),
        query('hospital')
            .optional()
            .isString()
            .isLength({ min: 1, max: 100 })
            .matches(/^[a-zA-Z0-9\s\-\_\.]+$/)
            .withMessage('Hospital must be under 100 characters and contain only alphanumeric characters, spaces, hyphens, underscores, or periods')
            .trim()
    ],
    validateInput,
    async (req, res) => {
        try {
            // const db = getFirestoreDb(); // Get Firestore instance
            const userId = req.user.uid;
            const userRole = req.user.role || req.user.custom_claims?.role;
            const userLocation = req.user.location; // Assuming location is part of user claims
            const { startDate, endDate, hospital } = req.query;

            // In a real application, you would fetch these statistics from your database
            // and filter/aggregate based on user role, requested dates, and hospital.
            // For now, providing mock data.
            const stats = {
                patientsInQueue: userRole === 'admin' ? 847 : 156, // Admin sees global, others see local
                averageWaitTimeMinutes: 89, // In minutes
                orUtilizationPercentage: 78,
                urgentCasesToday: 23,
                telemedicineConsultationsLastMonth: 156,
                mobileClinicVisitsLastMonth: 42,
                offlineConsultationsScheduled: 31,
                lastUpdated: new Date().toISOString(),
                filtersApplied: { startDate, endDate, hospital }
            };

            res.json(stats);
        } catch (error) {
            const sanitized = errorSanitizer.sanitizeError(error, { context: 'fetch-dashboard-stats' });
            res.status(500).json({
                error: 'Failed to fetch dashboard statistics',
                ...sanitized
            });
        }
    }
);

module.exports = router;