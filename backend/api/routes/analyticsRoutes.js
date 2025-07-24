// backend/api/routes/analyticsRoutes.js
const express = require('express');
const router = express.Router();
const { query } = require('express-validator');
const { authenticateUser, requireRole } = require('../middleware/auth');
const { mediumLimiter } = require('../middleware/rateLimiters');
const { validateInput } = require('../middleware/validation');
const errorSanitizer = require('../utils/errorSanitizer');
// const { getFirestoreDb } = require('../config/firebase'); // Uncomment if using Firebase

/**
 * @route GET /api/analytics/wait-times
 * @desc Get analytics data for patient wait times.
 * @access Private (Admin, Doctor, Analyst)
 * @middleware mediumLimiter, authenticateUser, requireRole, validateInput
 */
router.get('/wait-times',
    mediumLimiter,
    authenticateUser,
    requireRole(['admin', 'doctor', 'analyst']),
    [
        query('startDate')
            .optional()
            .isISO8601()
            .withMessage('Start date must be in ISO8601 format (YYYY-MM-DD)')
            .custom((value, { req }) => {
                if (req.query.endDate && value > req.query.endDate) {
                    throw new Error('Start date cannot be after end date');
                }
                return true;
            }),
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
        query('department')
            .optional()
            .isString()
            .isLength({ min: 1, max: 100 })
            .withMessage('Department must be under 100 characters and contain only letters, spaces, or hyphens.')
            .matches(/^[a-zA-Z\s\-]+$/)
            .trim(),
        query('location')
            .optional()
            .isString()
            .isLength({ min: 1, max: 100 })
            .withMessage('Location must be under 100 characters.')
            .matches(/^[a-zA-Z0-9\s\-\,\.]+$/)
            .trim()
    ],
    validateInput,
    async (req, res) => {
        try {
            // const db = getFirestoreDb(); // Get Firestore instance
            const userId = req.user.uid;
            const userRole = req.user.role || req.user.custom_claims?.role;
            const userLocation = req.user.location; // Assuming user has a location claim
            const { startDate, endDate, department, location } = req.query;

            // Mock data for demonstration. In a real application, this would fetch
            // and aggregate data from your database based on filters.
            let waitTimeData = [
                { month: 'Sep 2024', averageWaitHours: 2.75, targetHours: 2, improvementVsTarget: -0.75, department: 'General', location: 'Manila' },
                { month: 'Oct 2024', averageWaitHours: 2.63, targetHours: 2, improvementVsTarget: -0.63, department: 'Pediatrics', location: 'Manila' },
                { month: 'Nov 2024', averageWaitHours: 2.37, targetHours: 2, improvementVsTarget: -0.37, department: 'Cardiology', location: 'Quezon City' },
                { month: 'Dec 2024', averageWaitHours: 2.13, targetHours: 2, improvementVsTarget: -0.13, department: 'General', location: 'Quezon City' },
                { month: 'Jan 2025', averageWaitHours: 1.48, targetHours: 2, improvementVsTarget: 0.52, department: 'General', location: 'Manila' },
                { month: 'Feb 2025', averageWaitHours: 1.25, targetHours: 2, improvementVsTarget: 0.75, department: 'Pediatrics', location: 'Manila' }
            ];

            // Apply filters
            if (department) {
                waitTimeData = waitTimeData.filter(d => d.department.toLowerCase() === department.toLowerCase());
            }
            if (location) {
                waitTimeData = waitTimeData.filter(d => d.location.toLowerCase() === location.toLowerCase());
            }
            // Date filtering would be more complex, involving parsing and comparison of month strings or ISO dates.
            // For simplicity, we'll skip complex date filtering on mock data.

            // Role-based filtering (e.g., non-admins only see analytics for their location/department)
            if (userRole !== 'admin' && userLocation) {
                waitTimeData = waitTimeData.filter(d => d.location === userLocation);
            }

            // Calculate overall improvement from the filtered data
            const initialWait = waitTimeData.length > 0 ? waitTimeData[0].averageWaitHours : 0;
            const finalWait = waitTimeData.length > 0 ? waitTimeData[waitTimeData.length - 1].averageWaitHours : 0;
            const totalImprovement = initialWait > 0 ? ((initialWait - finalWait) / initialWait * 100).toFixed(2) : 0;
            const trend = initialWait > finalWait ? 'decreasing' : (initialWait < finalWait ? 'increasing' : 'stable');


            res.json({
                data: waitTimeData,
                overallMetrics: {
                    totalImprovementPercentage: parseFloat(totalImprovement),
                    trend: trend,
                    averageWaitTimeLastPeriodHours: finalWait,
                    targetWaitTimeHours: waitTimeData.length > 0 ? waitTimeData[0].targetHours : 2,
                },
                filtersApplied: {
                    startDate: startDate || 'All',
                    endDate: endDate || 'All',
                    department: department || 'All',
                    location: location || 'All'
                },
                lastUpdated: new Date().toISOString()
            });
        } catch (error) {
            const sanitized = errorSanitizer.sanitizeError(error, { context: 'fetch-wait-time-analytics' });
            res.status(500).json({
                error: 'Failed to fetch wait time analytics',
                ...sanitized
            });
        }
    }
);

module.exports = router;