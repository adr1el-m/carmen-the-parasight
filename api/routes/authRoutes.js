// api/routes/authRoutes.js - Converted to ES Module syntax
import express from 'express';
const router = express.Router(); // express.Router() is a function call, not a module import

// IMPORTANT: Import all exports from authController as a namespace object
import * as authController from '../controllers/authController.js'; // Add .js extension

router.post('/register', authController.registerUser);
router.post('/login', authController.loginUser); // If you're handling login on backend

// IMPORTANT: Change module.exports to export default
export default router;