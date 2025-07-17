// api/routes/businessRoutes.js - Converted to ES Module syntax
import express from 'express';
const router = express.Router(); // express.Router() is a function call, not a module import

// IMPORTANT: Import all exports from businessController as a namespace object
import * as businessController from '../controllers/businessController.js'; // Add .js extension

// IMPORTANT: Import named exports from authMiddleware
import { authenticateUser, authorizeRoles } from '../middleware/authMiddleware.js'; // Add .js extension

// Protected routes for businesses
router.get('/profile', authenticateUser, authorizeRoles(['business']), businessController.getBusinessProfile);
router.put('/profile', authenticateUser, authorizeRoles(['business']), businessController.updateBusinessProfile);

// Public route to get a business's services (e.g., for patients to browse)
router.get('/:businessId/services', businessController.getBusinessServices);

// IMPORTANT: Change module.exports to export default
export default router;