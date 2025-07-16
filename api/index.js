// api/index.js
const express = require('express');
const cors = require('cors'); // If your frontend is on a different origin
const patientRoutes = require('./routes/patientRoutes');
const businessRoutes = require('./routes/businessRoutes'); // Assuming you'll have one
const authRoutes = require('./routes/authRoutes'); // For login/signup via custom backend if needed

const app = express();

// Middleware
app.use(express.json()); // For parsing JSON request bodies
app.use(cors()); // Enable CORS for cross-origin requests

// API Routes
app.use('/api/auth', authRoutes); // Example for custom auth endpoints (e.g., registration)
app.use('/api/patients', patientRoutes);
app.use('/api/businesses', businessRoutes); // Example for business routes

// Basic route for testing
app.get('/api', (req, res) => {
  res.status(200).json({ message: 'LingapLink Backend API is running!' });
});

// Global Error handling middleware (should be the last middleware)
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).send('Something broke on the server!');
});

const PORT = process.env.PORT || 3000; // Use environment variable for port
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});