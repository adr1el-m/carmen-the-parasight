// api/index.js - Converted to ES Module syntax
import express from 'express';
import cors from 'cors'; // If your frontend is on a different origin
import patientRoutes from './routes/patientRoutes.js'; // IMPORTANT: Add .js extension
import businessRoutes from './routes/businessRoutes.js'; // IMPORTANT: Add .js extension
import authRoutes from './routes/authRoutes.js'; // IMPORTANT: Add .js extension
import dotenv from 'dotenv'; // Import dotenv for environment variables

// Load environment variables from .env file
dotenv.config();

const app = express();

// Middleware
app.use(express.json()); // For parsing JSON request bodies
app.use(cors()); // Enable CORS for cross-origin requests

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/patients', patientRoutes);
app.use('/api/businesses', businessRoutes);

// Basic route for testing
app.get('/api', (req, res) => {
  res.status(200).json({ message: 'LingapLink Backend API is running!' });
});

// Global Error handling middleware (should be the last middleware)
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).send('Something broke on the server!');
});

const PORT = process.env.PORT || 3001; // Use environment variable for port, changed default to 3001 for consistency
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});