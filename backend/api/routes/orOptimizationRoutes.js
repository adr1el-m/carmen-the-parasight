// backend/api/routes/orOptimizationRoutes.js
const express = require('express');
const router = express.Router();
const { body, query } = require('express-validator');
const { authenticateUser, requireRole } = require('../middleware/auth');
const { strictLimiter, mediumLimiter } = require('../middleware/rateLimiters');
const { validateInput } = require('../middleware/validation');
const { model: geminiModel } = require('../config/gemini'); // Renamed to avoid conflict with 'model' in routes
const { sanitizeString, sanitizeNumber } = require('../utils/inputSanitization');
const errorSanitizer = require('../utils/errorSanitizer');
// const { getFirestoreDb } = require('../config/firebase'); // Uncomment if using Firebase

/**
 * @route GET /api/or/surgery/queue
 * @desc Get the list of patients in the surgery queue.
 * @access Private (Admin, Doctor, Surgeon)
 * @middleware mediumLimiter, authenticateUser, requireRole, validateInput
 */
router.get('/surgery/queue',
    mediumLimiter,
    authenticateUser,
    requireRole(['admin', 'doctor', 'surgeon']),
    [
        query('limit')
            .optional()
            .isInt({ min: 1, max: 100 })
            .withMessage('Limit must be between 1 and 100'),
        query('offset')
            .optional()
            .isInt({ min: 0 })
            .withMessage('Offset must be a non-negative integer'),
        query('urgency')
            .optional()
            .isIn(['Low', 'Medium', 'High', 'Critical'])
            .withMessage('Invalid urgency level'),
        query('specialty')
            .optional()
            .isString()
            .isLength({ min: 1, max: 50 })
            .matches(/^[a-zA-Z\s\-]+$/)
            .withMessage('Specialty must be under 50 characters and contain only letters, spaces, or hyphens'),
        query('location')
            .optional()
            .isString()
            .isLength({ min: 1, max: 100 })
            .matches(/^[a-zA-Z0-9\s\-\,\.]+$/)
            .withMessage('Location must be under 100 characters and contain only alphanumeric, spaces, hyphens, commas, or periods')
    ],
    validateInput,
    async (req, res) => {
        try {
            // const db = getFirestoreDb(); // Get Firestore instance
            const userId = req.user.uid;
            const userRole = req.user.role || req.user.custom_claims?.role;
            const userLocation = req.user.location; // Assuming user has a location claim
            const { limit = 50, offset = 0, urgency, specialty, location } = req.query;

            // Mock data for demonstration. In a real app, this would query Firestore.
            let surgeryQueue = [
                { id: '1', patientName: 'Maria Santos', patientId: 'patient_001', procedure: 'Hysterectomy', urgency: 'Critical', waitTimeDays: 156, location: 'Manila', urgencyScore: 89, estimatedDurationHours: '2-3 hours', requiredSpecialty: 'Gynecology', createdAt: '2024-01-10T08:00:00Z' },
                { id: '2', patientName: 'Ana Rodriguez', patientId: 'patient_002', procedure: 'Fibroid Removal', urgency: 'High', waitTimeDays: 134, location: 'Quezon City', urgencyScore: 82, estimatedDurationHours: '1-2 hours', requiredSpecialty: 'Gynecology', createdAt: '2024-01-11T09:00:00Z' },
                { id: '3', patientName: 'Carmen Dela Cruz', patientId: 'patient_003', procedure: 'Ovarian Cyst Surgery', urgency: 'High', waitTimeDays: 98, location: 'Rural Bataan', urgencyScore: 78, estimatedDurationHours: '1-2 hours', requiredSpecialty: 'Gynecology', createdAt: '2024-01-12T10:00:00Z' },
                { id: '4', patientName: 'Jose Rizal', patientId: 'patient_004', procedure: 'Appendectomy', urgency: 'Medium', waitTimeDays: 30, location: 'Manila', urgencyScore: 60, estimatedDurationHours: '1 hour', requiredSpecialty: 'General Surgery', createdAt: '2024-02-01T11:00:00Z' },
                { id: '5', patientName: 'Lina Reyes', patientId: 'patient_005', procedure: 'Cataract Surgery', urgency: 'Low', waitTimeDays: 200, location: 'Rural Bataan', urgencyScore: 45, estimatedDurationHours: '30-45 min', requiredSpecialty: 'Ophthalmology', createdAt: '2023-08-15T12:00:00Z' }
            ];

            // Apply filters
            if (urgency) {
                surgeryQueue = surgeryQueue.filter(p => p.urgency === urgency);
            }
            if (specialty) {
                surgeryQueue = surgeryQueue.filter(p => p.requiredSpecialty.toLowerCase().includes(specialty.toLowerCase()));
            }
            if (location) {
                surgeryQueue = surgeryQueue.filter(p => p.location.toLowerCase().includes(location.toLowerCase()));
            }

            // Role-based filtering (e.g., non-admins only see patients from their location)
            if (userRole !== 'admin' && userLocation) {
                surgeryQueue = surgeryQueue.filter(p => p.location === userLocation);
            }

            // Pagination
            const paginatedQueue = surgeryQueue.slice(parseInt(offset), parseInt(offset) + parseInt(limit));

            res.json({
                queue: paginatedQueue,
                totalCount: surgeryQueue.length,
                limit: parseInt(limit),
                offset: parseInt(offset),
                lastUpdated: new Date().toISOString()
            });
        } catch (error) {
            const sanitized = errorSanitizer.sanitizeError(error, { context: 'fetch-surgery-queue' });
            res.status(500).json({
                error: 'Failed to fetch surgery queue',
                ...sanitized
            });
        }
    }
);

/**
 * @route GET /api/or/status
 * @desc Get the current status of Operating Rooms.
 * @access Private (Admin, Doctor, Nurse, OR Coordinator)
 * @middleware mediumLimiter, authenticateUser, requireRole, validateInput
 */
router.get('/status',
    mediumLimiter,
    authenticateUser,
    requireRole(['admin', 'doctor', 'nurse', 'or_coordinator']),
    [
        query('status')
            .optional()
            .isIn(['Available', 'In Use', 'Maintenance', 'Scheduled'])
            .withMessage('Invalid OR status'),
        query('specialty')
            .optional()
            .isString()
            .isLength({ min: 1, max: 50 })
            .matches(/^[a-zA-Z\s\-]+$/)
            .withMessage('Specialty must be under 50 characters and contain only letters, spaces, or hyphens'),
        query('minUtilization')
            .optional()
            .isInt({ min: 0, max: 100 })
            .withMessage('Minimum utilization must be between 0 and 100'),
        query('maxUtilization')
            .optional()
            .isInt({ min: 0, max: 100 })
            .withMessage('Maximum utilization must be between 0 and 100')
    ],
    validateInput,
    async (req, res) => {
        try {
            // const db = getFirestoreDb(); // Get Firestore instance
            const userId = req.user.uid;
            const userRole = req.user.role || req.user.custom_claims?.role;
            const { status, specialty, minUtilization, maxUtilization } = req.query;

            // Mock OR status data
            let orStatus = [
                { id: 'OR-1', status: 'In Use', utilization: 85, specialty: 'Gynecology', currentProcedure: 'Hysterectomy', estimatedCompletion: '2025-07-24T14:30:00Z', lastUpdated: '2025-07-24T10:00:00Z', location: 'Manila' },
                { id: 'OR-2', status: 'Available', utilization: 0, specialty: 'General Surgery', currentProcedure: null, estimatedCompletion: null, lastUpdated: '2025-07-24T10:00:00Z', location: 'Quezon City' },
                { id: 'OR-3', status: 'Maintenance', utilization: 45, specialty: 'Orthopedics', currentProcedure: null, estimatedCompletion: '2025-07-24T16:00:00Z', lastUpdated: '2025-07-24T10:00:00Z', location: 'Rural Bataan' },
                { id: 'OR-4', status: 'In Use', utilization: 92, specialty: 'Gynecology', currentProcedure: 'Fibroid Removal', estimatedCompletion: '2025-07-24T15:00:00Z', lastUpdated: '2025-07-24T10:00:00Z', location: 'Manila' },
                { id: 'OR-5', status: 'Scheduled', utilization: 68, specialty: 'Cardiology', currentProcedure: null, estimatedCompletion: '2025-07-24T13:00:00Z', lastUpdated: '2025-07-24T10:00:00Z', location: 'Quezon City' }
            ];

            // Apply filters
            if (status) {
                orStatus = orStatus.filter(or => or.status === status);
            }
            if (specialty) {
                orStatus = orStatus.filter(or => or.specialty.toLowerCase().includes(specialty.toLowerCase()));
            }
            if (minUtilization) {
                orStatus = orStatus.filter(or => or.utilization >= parseInt(minUtilization));
            }
            if (maxUtilization) {
                orStatus = orStatus.filter(or => or.utilization <= parseInt(maxUtilization));
            }

            // Role-based filtering (e.g., only see ORs in their assigned location)
            const userLocation = req.user.location; // Assuming location is part of user claims
            if (userRole !== 'admin' && userLocation) {
                orStatus = orStatus.filter(or => or.location === userLocation);
            }


            const averageUtilization = orStatus.length > 0
                ? Math.round(orStatus.reduce((acc, or) => acc + or.utilization, 0) / orStatus.length)
                : 0;

            res.json({
                orStatus,
                totalRooms: orStatus.length,
                averageUtilization,
                lastUpdated: new Date().toISOString()
            });
        } catch (error) {
            const sanitized = errorSanitizer.sanitizeError(error, { context: 'fetch-or-status' });
            res.status(500).json({
                error: 'Failed to fetch OR status',
                ...sanitized
            });
        }
    }
);

/**
 * @route POST /api/or/optimize
 * @desc Generate AI-powered OR optimization suggestions.
 * @access Private (Admin, OR Coordinator)
 * @middleware strictLimiter, authenticateUser, requireRole, validateInput
 */
router.post('/optimize',
    strictLimiter,
    authenticateUser,
    requireRole(['admin', 'or_coordinator']),
    [
        body('orData')
            .isArray({ min: 1 })
            .withMessage('OR data must be a non-empty array of OR objects.'),
        body('orData.*.id')
            .notEmpty()
            .isString()
            .withMessage('Each OR object must have a non-empty string ID.'),
        body('orData.*.status')
            .isIn(['Available', 'In Use', 'Maintenance', 'Scheduled'])
            .withMessage('Invalid OR status in orData.'),
        body('orData.*.utilization')
            .isInt({ min: 0, max: 100 })
            .withMessage('Utilization must be an integer between 0 and 100.'),
        body('orData.*.specialty')
            .isString()
            .isLength({ min: 1, max: 50 })
            .withMessage('Specialty must be a string between 1 and 50 characters.'),
        body('demandData')
            .optional()
            .isObject()
            .withMessage('Demand data must be an object.'),
        body('demandData.newCases')
            .optional()
            .isInt({ min: 0 })
            .withMessage('New cases must be a non-negative integer.'),
        body('demandData.priorityCases')
            .optional()
            .isInt({ min: 0 })
            .withMessage('Priority cases must be a non-negative integer.')
    ],
    validateInput,
    async (req, res) => {
        try {
            const { orData, demandData } = req.body;
            const userId = req.user.uid;

            // Input sanitization for AI prompt to prevent injection/hallucination
            const sanitizedOrData = orData.map(or => ({
                id: sanitizeString(or.id, 50),
                status: sanitizeString(or.status, 50),
                utilization: sanitizeNumber(or.utilization, 0, 100),
                specialty: sanitizeString(or.specialty, 50),
                currentProcedure: or.currentProcedure ? sanitizeString(or.currentProcedure, 100) : null,
                estimatedCompletion: or.estimatedCompletion ? sanitizeString(or.estimatedCompletion, 100) : null
            }));

            const sanitizedDemandData = demandData ? {
                newCases: sanitizeNumber(demandData.newCases || 0),
                priorityCases: sanitizeNumber(demandData.priorityCases || 0),
                urgentSpecialties: Array.isArray(demandData.urgentSpecialties)
                    ? demandData.urgentSpecialties.map(s => sanitizeString(s, 50))
                    : []
            } : {};

            if (!geminiModel) {
                return res.status(503).json({
                    error: 'AI Service Unavailable',
                    message: 'Gemini AI model is not configured or initialized. Please check your API key.'
                });
            }

            const prompt = `
            As an AI healthcare optimization specialist for a Philippine hospital, analyze the provided Operating Room (OR) utilization and surgical demand data.
            Your goal is to provide 4-5 specific, actionable, and realistic recommendations to improve OR efficiency and reduce patient surgical wait times, tailored for a Philippine healthcare context.

            Consider the following data:
            Operating Rooms (Current Status): ${JSON.stringify(sanitizedOrData, null, 2)}
            Surgical Demand (Optional Data): ${JSON.stringify(sanitizedDemandData, null, 2)}

            Focus your recommendations on these areas:
            1.  **Scheduling Optimization**: How to better schedule surgeries to maximize OR use.
            2.  **Resource Allocation**: How to efficiently assign staff and equipment.
            3.  **Staff Efficiency**: Ways to improve the performance of OR teams.
            4.  **Equipment Utilization**: How to make the most of surgical equipment.
            5.  **Maintenance Scheduling**: Suggest optimal times for OR maintenance.

            Provide your response in a JSON array of objects. Each object should have the following properties:
            -   \`suggestion\` (string): A concise, actionable recommendation.
            -   \`impact\` (string): Estimated positive impact (e.g., "+10% utilization", "Reduced wait time by 5 days").
            -   \`priority\` (string): "High", "Medium", or "Low".
            -   \`estimatedImplementationTime\` (string): Rough time to implement (e.g., "1 week", "2-3 months").

            Ensure the JSON is perfectly parsable. Do not include any text outside the JSON block.
            `;

            const result = await geminiModel.generateContent(prompt);
            const response = await result.response;
            let suggestionsText = response.text();

            let suggestions;
            try {
                // Attempt to parse the AI's response as JSON
                suggestions = JSON.parse(suggestionsText);
                // Basic validation: ensure it's an array and contains expected properties
                if (!Array.isArray(suggestions) || suggestions.some(s => !s.suggestion || !s.impact || !s.priority)) {
                    throw new Error('AI response is not a valid array of suggestion objects.');
                }
            } catch (parseError) {
                console.warn('Failed to parse AI response as JSON:', parseError.message);
                console.warn('Raw AI response:', suggestionsText.substring(0, 500) + '...'); // Log partial raw response
                // Fallback to a default set of suggestions if parsing fails or structure is incorrect
                suggestions = [
                    {
                        suggestion: "Implement dynamic scheduling algorithms to fill OR-2's available slots with high-priority cases from the queue.",
                        impact: "Increase OR-2 utilization by 60%",
                        priority: "High",
                        estimatedImplementationTime: "2 weeks"
                    },
                    {
                        suggestion: "Cross-train nursing staff for different OR specialties (e.g., Orthopedics and General Surgery) to allow flexible staffing.",
                        impact: "Reduce staffing bottlenecks by 15%",
                        priority: "Medium",
                        estimatedImplementationTime: "3 months"
                    },
                    {
                        suggestion: "Schedule OR-3 maintenance during evening/weekend hours to free up daytime capacity.",
                        impact: "Reclaim 4-6 hours of OR time daily",
                        priority: "High",
                        estimatedImplementationTime: "1 week"
                    },
                    {
                        suggestion: "Adopt a 'fast-track' protocol for minor, quick procedures in a dedicated OR or during specific blocks.",
                        impact: "Reduce overall patient wait times by 10%",
                        priority: "Medium",
                        estimatedImplementationTime: "1 month"
                    },
                    {
                        suggestion: "Analyze peak demand times for each specialty and allocate ORs accordingly, pre-booking high-demand slots.",
                        impact: "Optimize OR allocation by 20%",
                        priority: "High",
                        estimatedImplementationTime: "1 month"
                    }
                ];
            }

            res.json({
                suggestions,
                generatedAt: new Date().toISOString(),
                basedOn: {
                    orRoomsAnalyzed: sanitizedOrData.length,
                    averageUtilizationOfProvidedData: sanitizedOrData.length > 0
                        ? Math.round(sanitizedOrData.reduce((acc, or) => acc + or.utilization, 0) / sanitizedOrData.length)
                        : 0,
                    demandDataUsed: Object.keys(sanitizedDemandData).length > 0
                }
            });
        } catch (error) {
            console.error('Error in /or/optimize:', error);
            const sanitized = errorSanitizer.sanitizeError(error, { context: 'generate-optimization-suggestions' });
            res.status(500).json({
                error: 'Failed to generate optimization suggestions',
                ...sanitized,
                details: process.env.NODE_ENV === 'development' ? error.message : undefined
            });
        }
    }
);

module.exports = router;