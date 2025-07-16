// api/routes/patientRoutes.js - Converted to ES Module syntax
import express from 'express';
const router = express.Router(); // express.Router() is a function call, not a module import

// IMPORTANT: Import all exports from patientController as a namespace object
import * as patientController from '../controllers/patientController.js'; // Add .js extension

// IMPORTANT: Import named exports from authMiddleware
import { authenticateUser, authorizeRoles } from '../middleware/authMiddleware.js'; // Add .js extension

// Protected routes for patients
router.get('/profile', authenticateUser, authorizeRoles(['patient']), patientController.getPatientProfile);
router.put('/profile', authenticateUser, authorizeRoles(['patient']), patientController.updatePatientProfile);

// You can add more patient-specific routes here (e.g., /appointments, /messages)

// IMPORTANT: Change module.exports to export default
export default router;