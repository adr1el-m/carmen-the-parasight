const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const { body, validationResult } = require('express-validator');
const jwt = require('jsonwebtoken');
const morgan = require('morgan');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const { initializeApp } = require('firebase/app');
const { getFirestore, doc, setDoc, getDoc, collection, getDocs, query, where, orderBy, addDoc, updateDoc } = require('firebase/firestore');
const { getAuth } = require('firebase-admin/auth');
require('dotenv').config();

const app = express();

// Security Headers
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
      fontSrc: ["'self'", "https://fonts.gstatic.com"],
      scriptSrc: ["'self'", "'unsafe-inline'", "https://www.gstatic.com"],
      imgSrc: ["'self'", "data:", "https:"],
      connectSrc: ["'self'", "https://firebaseapp.com", "https://identitytoolkit.googleapis.com"]
    }
  },
  crossOriginEmbedderPolicy: false, // Disable for Firebase compatibility
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true
  }
}));

// HTTPS Redirect for production
if (process.env.NODE_ENV === 'production') {
  app.use((req, res, next) => {
    if (req.header('x-forwarded-proto') !== 'https') {
      res.redirect(`https://${req.header('host')}${req.url}`);
    } else {
      next();
    }
  });
}

// Request Logging
app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev'));

// Rate Limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: process.env.NODE_ENV === 'production' ? 100 : 1000, // limit each IP to 100 requests per windowMs in production
  message: {
    error: 'Too many requests from this IP, please try again later.',
    retryAfter: 15 * 60 * 1000
  },
  standardHeaders: true,
  legacyHeaders: false,
});

const strictLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // limit each IP to 10 requests per windowMs for sensitive endpoints
  message: {
    error: 'Too many requests to this endpoint, please try again later.',
    retryAfter: 15 * 60 * 1000
  },
  standardHeaders: true,
  legacyHeaders: false,
});

app.use('/api/', limiter);

// Enhanced CORS Configuration
app.use(cors({
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    
    const allowedOrigins = process.env.NODE_ENV === 'production' 
      ? [
          process.env.CORS_ORIGIN || 'https://your-vercel-domain.vercel.app',
          'https://lingaplink.vercel.app',
          'https://carmen-para-sight.vercel.app'
        ]
      : [
          'http://localhost:5173',
          'http://localhost:3000',
          'http://localhost:3001',
          'http://localhost:8080',
          'http://127.0.0.1:5173',
          'http://127.0.0.1:3000'
        ];
    
    if (allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept', 'Origin'],
  exposedHeaders: ['X-Total-Count', 'X-Page-Count'],
  maxAge: 86400 // 24 hours
}));

// Body Parser with size limits
app.use(express.json({ 
  limit: '10mb',
  strict: true
}));
app.use(express.urlencoded({ 
  extended: true, 
  limit: '10mb' 
}));

// Firebase Configuration - using environment variables for security
const firebaseConfig = {
  apiKey: process.env.FIREBASE_API_KEY || process.env.VITE_FIREBASE_API_KEY,
  authDomain: process.env.FIREBASE_AUTH_DOMAIN || process.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.FIREBASE_PROJECT_ID || process.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: process.env.FIREBASE_STORAGE_BUCKET || process.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.FIREBASE_MESSAGING_SENDER_ID || process.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.FIREBASE_APP_ID || process.env.VITE_FIREBASE_APP_ID,
  measurementId: process.env.FIREBASE_MEASUREMENT_ID || process.env.VITE_FIREBASE_MEASUREMENT_ID
};

// Validate Firebase configuration
if (!firebaseConfig.apiKey || !firebaseConfig.projectId) {
  console.error('❌ Firebase configuration incomplete. Please check your environment variables.');
  console.log('Required environment variables:');
  console.log('- FIREBASE_API_KEY (or VITE_FIREBASE_API_KEY)');
  console.log('- FIREBASE_PROJECT_ID (or VITE_FIREBASE_PROJECT_ID)');
  console.log('- FIREBASE_AUTH_DOMAIN (or VITE_FIREBASE_AUTH_DOMAIN)');
  process.exit(1);
}

// Initialize Firebase
const firebaseApp = initializeApp(firebaseConfig);
const db = getFirestore(firebaseApp);

// Initialize Firebase Admin (for server-side authentication)
let adminAuth;
try {
  const admin = require('firebase-admin');
  if (!admin.apps.length) {
    admin.initializeApp({
      credential: admin.credential.applicationDefault(),
      projectId: firebaseConfig.projectId
    });
  }
  adminAuth = admin.auth();
} catch (error) {
  console.warn('⚠️  Firebase Admin not configured. Some authentication features may not work.');
  console.warn('For production, set up Firebase Admin SDK with service account credentials.');
}

// Initialize Gemini AI
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || process.env.VITE_GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-pro" });

// Authentication Middleware
const authenticateUser = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ 
        error: 'Unauthorized', 
        message: 'No valid authorization token provided' 
      });
    }
    
    const token = authHeader.split(' ')[1];
    
    // Verify Firebase ID token
    if (adminAuth) {
      const decodedToken = await adminAuth.verifyIdToken(token);
      req.user = decodedToken;
    } else {
      // Fallback JWT verification (for development)
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback-secret');
      req.user = decoded;
    }
    
    next();
  } catch (error) {
    console.error('Authentication error:', error);
    res.status(401).json({ 
      error: 'Unauthorized', 
      message: 'Invalid or expired token' 
    });
  }
};

// Optional Authentication Middleware (for endpoints that can work with or without auth)
const optionalAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.split(' ')[1];
      
      if (adminAuth) {
        const decodedToken = await adminAuth.verifyIdToken(token);
        req.user = decodedToken;
      } else {
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback-secret');
        req.user = decoded;
      }
    }
    
    next();
  } catch (error) {
    // Continue without authentication
    next();
  }
};

// Role-based authorization middleware
const requireRole = (roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ 
        error: 'Unauthorized', 
        message: 'Authentication required' 
      });
    }
    
    const userRole = req.user.role || req.user.custom_claims?.role;
    
    if (!roles.includes(userRole)) {
      return res.status(403).json({ 
        error: 'Forbidden', 
        message: 'Insufficient permissions' 
      });
    }
    
    next();
  };
};

// Input validation middleware
const validateInput = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      error: 'Validation Error',
      details: errors.array()
    });
  }
  next();
};

// Error handling middleware
const errorHandler = (err, req, res, next) => {
  console.error('Error:', err);
  
  // CORS error
  if (err.message === 'Not allowed by CORS') {
    return res.status(403).json({
      error: 'CORS Error',
      message: 'Origin not allowed'
    });
  }
  
  // Rate limit error
  if (err.status === 429) {
    return res.status(429).json({
      error: 'Rate Limit Exceeded',
      message: 'Too many requests, please try again later'
    });
  }
  
  // Firebase errors
  if (err.code && err.code.startsWith('auth/')) {
    return res.status(401).json({
      error: 'Authentication Error',
      message: 'Invalid authentication credentials'
    });
  }
  
  // Validation errors
  if (err.name === 'ValidationError') {
    return res.status(400).json({
      error: 'Validation Error',
      message: err.message
    });
  }
  
  // Default error response
  res.status(err.status || 500).json({
    error: 'Internal Server Error',
    message: process.env.NODE_ENV === 'production' 
      ? 'Something went wrong' 
      : err.message
  });
};

// Health check endpoint (no auth required)
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    message: 'LingapLink PH API is running',
    timestamp: new Date().toISOString(),
    version: process.env.npm_package_version || '1.0.0'
  });
});

// Get dashboard statistics (requires authentication)
app.get('/api/dashboard/stats', authenticateUser, requireRole(['admin', 'doctor', 'nurse']), async (req, res) => {
  try {
    // In production, this would fetch from Firebase based on user's hospital/clinic
    const userId = req.user.uid;
    const userRole = req.user.role || req.user.custom_claims?.role;
    
    // Demo data - in production, filter by user's access level
    const stats = {
      patientsInQueue: userRole === 'admin' ? 847 : 156,
      averageWaitTime: "89 days",
      orUtilization: "78%",
      urgentCases: 23,
      telemedicineConsultations: 156,
      mobileClinicVisits: 42,
      offlineConsultations: 31,
      lastUpdated: new Date().toISOString()
    };
    
    res.json(stats);
  } catch (error) {
    console.error('Error fetching dashboard stats:', error);
    res.status(500).json({ 
      error: 'Failed to fetch dashboard statistics',
      message: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// Surgery prioritization endpoints (requires authentication)
app.get('/api/surgery/queue', authenticateUser, requireRole(['admin', 'doctor', 'surgeon']), async (req, res) => {
  try {
    const userId = req.user.uid;
    const userRole = req.user.role || req.user.custom_claims?.role;
    
    // Sample data - in production, fetch from Firebase based on user's hospital/location
    const surgeryQueue = [
      {
        id: '1',
        patientName: 'Maria Santos',
        patientId: 'patient_001',
        procedure: 'Hysterectomy',
        urgency: 'Critical',
        waitTime: 156,
        location: 'Manila',
        urgencyScore: 89,
        estimatedDuration: '2-3 hours',
        requiredSpecialty: 'Gynecology',
        createdAt: new Date().toISOString()
      },
      {
        id: '2',
        patientName: 'Ana Rodriguez',
        patientId: 'patient_002',
        procedure: 'Fibroid Removal',
        urgency: 'High',
        waitTime: 134,
        location: 'Quezon City',
        urgencyScore: 82,
        estimatedDuration: '1-2 hours',
        requiredSpecialty: 'Gynecology',
        createdAt: new Date().toISOString()
      },
      {
        id: '3',
        patientName: 'Carmen Dela Cruz',
        patientId: 'patient_003',
        procedure: 'Ovarian Cyst Surgery',
        urgency: 'High',
        waitTime: 98,
        location: 'Rural Bataan',
        urgencyScore: 78,
        estimatedDuration: '1-2 hours',
        requiredSpecialty: 'Gynecology',
        createdAt: new Date().toISOString()
      }
    ];
    
    // Filter based on user role and location
    const filteredQueue = userRole === 'admin' 
      ? surgeryQueue 
      : surgeryQueue.filter(item => item.location === req.user.location);
    
    res.json({ 
      queue: filteredQueue,
      totalCount: filteredQueue.length,
      lastUpdated: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error fetching surgery queue:', error);
    res.status(500).json({ 
      error: 'Failed to fetch surgery queue',
      message: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// OR optimization endpoints (requires authentication)
app.get('/api/or/status', authenticateUser, requireRole(['admin', 'doctor', 'nurse', 'or_coordinator']), async (req, res) => {
  try {
    const userId = req.user.uid;
    const userRole = req.user.role || req.user.custom_claims?.role;
    
    const orStatus = [
      { 
        id: 'OR-1', 
        status: 'In Use', 
        utilization: 85, 
        specialty: 'Gynecology',
        currentProcedure: 'Hysterectomy',
        estimatedCompletion: '2024-01-15T14:30:00Z',
        lastUpdated: new Date().toISOString()
      },
      { 
        id: 'OR-2', 
        status: 'Available', 
        utilization: 72, 
        specialty: 'General Surgery',
        currentProcedure: null,
        estimatedCompletion: null,
        lastUpdated: new Date().toISOString()
      },
      { 
        id: 'OR-3', 
        status: 'Maintenance', 
        utilization: 45, 
        specialty: 'Orthopedics',
        currentProcedure: null,
        estimatedCompletion: '2024-01-15T16:00:00Z',
        lastUpdated: new Date().toISOString()
      },
      { 
        id: 'OR-4', 
        status: 'In Use', 
        utilization: 92, 
        specialty: 'Gynecology',
        currentProcedure: 'Fibroid Removal',
        estimatedCompletion: '2024-01-15T15:00:00Z',
        lastUpdated: new Date().toISOString()
      },
      { 
        id: 'OR-5', 
        status: 'Scheduled', 
        utilization: 68, 
        specialty: 'Cardiology',
        currentProcedure: null,
        estimatedCompletion: '2024-01-15T13:00:00Z',
        lastUpdated: new Date().toISOString()
      }
    ];
    
    res.json({ 
      orStatus,
      totalRooms: orStatus.length,
      averageUtilization: Math.round(orStatus.reduce((acc, or) => acc + or.utilization, 0) / orStatus.length),
      lastUpdated: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error fetching OR status:', error);
    res.status(500).json({ 
      error: 'Failed to fetch OR status',
      message: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// AI-powered optimization suggestions (requires authentication and strict rate limiting)
app.post('/api/or/optimize', 
  strictLimiter, 
  authenticateUser, 
  requireRole(['admin', 'or_coordinator']),
  [
    body('orData').isArray().withMessage('OR data must be an array'),
    body('orData.*.id').notEmpty().withMessage('OR ID is required'),
    body('orData.*.utilization').isNumeric().withMessage('Utilization must be a number'),
    body('demandData').optional().isObject().withMessage('Demand data must be an object')
  ],
  validateInput,
  async (req, res) => {
    try {
      const { orData, demandData } = req.body;
      
      // Input sanitization
      const sanitizedOrData = orData.map(or => ({
        id: or.id,
        status: or.status,
        utilization: Math.min(Math.max(or.utilization, 0), 100),
        specialty: or.specialty
      }));
      
      if (!genAI) {
        return res.status(503).json({ 
          error: 'AI Service Unavailable',
          message: 'Gemini AI is not configured. Please check your API key.'
        });
      }
      
      const prompt = `
      As an AI healthcare optimization specialist, analyze this OR utilization data and provide optimization suggestions:
      
      Operating Rooms: ${JSON.stringify(sanitizedOrData)}
      Demand Data: ${JSON.stringify(demandData || {})}
      
      Provide 4-5 specific, actionable recommendations to improve OR utilization and reduce surgical wait times in Philippine hospitals.
      Focus on:
      1. Scheduling optimization
      2. Resource allocation
      3. Staff efficiency
      4. Equipment utilization
      5. Maintenance scheduling
      
      Format as a JSON array of objects with 'suggestion' and 'impact' properties.
      Keep suggestions practical and implementable.
      `;

      const result = await model.generateContent(prompt);
      const response = await result.response;
      let suggestions = response.text();
      
      // Try to parse as JSON, fallback to default suggestions if parsing fails
      try {
        suggestions = JSON.parse(suggestions);
      } catch {
        suggestions = [
          { 
            suggestion: "Reschedule OR-3 maintenance to off-peak hours (6 PM - 6 AM)", 
            impact: "+12% utilization",
            priority: "High",
            estimatedImplementationTime: "1 week"
          },
          { 
            suggestion: "Cross-train staff for gynecology procedures to reduce bottlenecks", 
            impact: "+8% efficiency",
            priority: "Medium",
            estimatedImplementationTime: "2-3 months"
          },
          { 
            suggestion: "Extend OR-1 operating hours on Wednesdays to handle backlog", 
            impact: "+15% capacity",
            priority: "High",
            estimatedImplementationTime: "2 weeks"
          },
          { 
            suggestion: "Implement rapid turnover protocols between procedures", 
            impact: "+20 min saved per surgery",
            priority: "Medium",
            estimatedImplementationTime: "1 month"
          }
        ];
      }
      
      res.json({ 
        suggestions,
        generatedAt: new Date().toISOString(),
        basedOn: {
          orRoomsAnalyzed: sanitizedOrData.length,
          averageUtilization: Math.round(sanitizedOrData.reduce((acc, or) => acc + or.utilization, 0) / sanitizedOrData.length)
        }
      });
    } catch (error) {
      console.error('Error generating optimization suggestions:', error);
      res.status(500).json({ 
        error: 'Failed to generate optimization suggestions',
        message: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
      });
    }
  }
);

// Telemedicine and rural patient endpoints (requires authentication)
app.get('/api/telemedicine/patients', authenticateUser, requireRole(['admin', 'doctor', 'nurse', 'chw']), async (req, res) => {
  try {
    const userId = req.user.uid;
    const userRole = req.user.role || req.user.custom_claims?.role;
    
    const ruralPatients = [
      {
        id: '1',
        name: 'Rosa Dela Cruz',
        location: 'Siquijor Island',
        distance: 623,
        condition: 'Heavy Menstrual Bleeding',
        urgency: 'High',
        connectivity: 'None',
        communicationMethod: 'Radio',
        hasSmartphone: false,
        nearestHealthCenter: 'Siquijor Provincial Hospital',
        communityHealthWorker: 'Aling Nena Villanueva',
        lastContact: '2024-01-10',
        status: 'Waiting for consultation'
      },
      {
        id: '2',
        name: 'Luz Mendoza',
        location: 'Basilan, Isabela City',
        distance: 789,
        condition: 'Pregnancy Complications',
        urgency: 'Critical',
        connectivity: 'None',
        communicationMethod: 'CHW',
        hasSmartphone: false,
        nearestHealthCenter: 'Basilan General Hospital',
        communityHealthWorker: 'Mang Tony Ramos',
        lastContact: '2024-01-12',
        status: 'Emergency referral needed'
      }
    ];
    
    res.json({ 
      patients: ruralPatients,
      totalCount: ruralPatients.length,
      lastUpdated: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error fetching rural patients:', error);
    res.status(500).json({ 
      error: 'Failed to fetch rural patients',
      message: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// Schedule offline consultation
app.post('/api/telemedicine/schedule-offline', async (req, res) => {
  try {
    const { patientId, method, scheduledDate } = req.body;
    
    // In production, save to Firebase
    const consultation = {
      id: Date.now().toString(),
      patientId,
      method,
      scheduledDate,
      status: 'scheduled',
      createdAt: new Date().toISOString()
    };
    
    res.json({ 
      success: true, 
      message: `${method} consultation scheduled successfully`,
      consultation 
    });
  } catch (error) {
    console.error('Error scheduling offline consultation:', error);
    res.status(500).json({ error: 'Failed to schedule consultation' });
  }
});

// AI health consultation endpoint (requires authentication and strict rate limiting)
app.post('/api/ai/consultation', 
  strictLimiter,
  authenticateUser,
  requireRole(['admin', 'doctor', 'nurse', 'patient']),
  [
    body('symptoms').isString().isLength({ min: 10, max: 1000 }).withMessage('Symptoms must be between 10 and 1000 characters'),
    body('patientHistory').optional().isString().isLength({ max: 2000 }).withMessage('Patient history must be less than 2000 characters'),
    body('urgency').isIn(['Low', 'Medium', 'High', 'Critical']).withMessage('Urgency must be Low, Medium, High, or Critical')
  ],
  validateInput,
  async (req, res) => {
    try {
      const { symptoms, patientHistory, urgency } = req.body;
      const userId = req.user.uid;
      
      // Input sanitization
      const sanitizedSymptoms = symptoms.trim().substring(0, 1000);
      const sanitizedHistory = patientHistory ? patientHistory.trim().substring(0, 2000) : '';
      
      if (!genAI) {
        return res.status(503).json({ 
          error: 'AI Service Unavailable',
          message: 'AI consultation service is temporarily unavailable. Please consult with a healthcare provider directly.'
        });
      }
      
      const prompt = `
      As a medical AI assistant for LingapLink PH, provide a preliminary assessment for a Filipino patient:
      
      Symptoms: ${sanitizedSymptoms}
      Patient History: ${sanitizedHistory}
      Urgency Level: ${urgency}
      
      Please provide:
      1. Preliminary assessment (non-diagnostic)
      2. Recommended urgency level (Low/Medium/High/Critical)
      3. Suggested next steps
      4. Whether immediate medical attention is needed
      5. Telemedicine suitability
      
      Important: This is not a medical diagnosis. Always recommend consulting with healthcare professionals.
      Respond in JSON format with clear, patient-friendly language in English and Filipino.
      `;

      const result = await model.generateContent(prompt);
      const response = await result.response;
      let assessment = response.text();
      
      // Try to parse as JSON, fallback to structured response
      try {
        assessment = JSON.parse(assessment);
      } catch {
        assessment = {
          preliminaryAssessment: "Based on the symptoms provided, further medical evaluation is recommended.",
          recommendedUrgency: urgency,
          nextSteps: [
            "Schedule consultation with healthcare provider",
            "Monitor symptoms closely",
            "Seek immediate care if symptoms worsen",
            "Consider telemedicine consultation"
          ],
          immediateAttention: urgency === 'Critical' || urgency === 'High',
          telemedicineSuitable: true,
          disclaimer: "This is not a medical diagnosis. Please consult with a qualified healthcare professional."
        };
      }
      
      res.json({ 
        assessment,
        consultationId: `consult_${Date.now()}`,
        timestamp: new Date().toISOString(),
        userId: userId
      });
    } catch (error) {
      console.error('Error generating AI consultation:', error);
      res.status(500).json({ 
        error: 'Failed to generate consultation',
        message: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
      });
    }
  }
);

// Patient portal endpoints (requires authentication)
app.get('/api/patient/:id', 
  authenticateUser,
  requireRole(['admin', 'doctor', 'nurse', 'patient']),
  async (req, res) => {
    try {
      const { id } = req.params;
      const userId = req.user.uid;
      const userRole = req.user.role || req.user.custom_claims?.role;
      
      // Authorization check: patients can only access their own data
      if (userRole === 'patient' && id !== userId) {
        return res.status(403).json({ 
          error: 'Forbidden',
          message: 'You can only access your own patient data'
        });
      }
      
      // Sample patient data - in production, fetch from Firebase
      const patient = {
        id,
        name: 'Maria Santos',
        age: 34,
        condition: 'Uterine Fibroids',
        nextAppointment: '2024-01-15',
        lastVisit: '2023-12-10',
        medications: ['Ibuprofen 400mg', 'Iron supplements'],
        documents: [
          { name: 'Lab Results', type: 'PDF', date: '2024-01-10' },
          { name: 'Ultrasound Report', type: 'PDF', date: '2023-12-08' }
        ],
        contactInfo: {
          email: 'maria.santos@email.com',
          phone: '+63 917 123 4567'
        },
        emergencyContact: {
          name: 'Juan Santos',
          relationship: 'Spouse',
          phone: '+63 917 987 6543'
        },
        lastUpdated: new Date().toISOString()
      };
      
      res.json(patient);
    } catch (error) {
      console.error('Error fetching patient data:', error);
      res.status(500).json({ 
        error: 'Failed to fetch patient data',
        message: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
      });
    }
  }
);

// Analytics endpoints (requires authentication)
app.get('/api/analytics/wait-times', 
  authenticateUser,
  requireRole(['admin', 'doctor', 'analyst']),
  async (req, res) => {
    try {
      const userId = req.user.uid;
      const userRole = req.user.role || req.user.custom_claims?.role;
      
      const waitTimeData = [
        { month: 'Sep', averageWait: 165, target: 120, improvement: -27 },
        { month: 'Oct', averageWait: 158, target: 120, improvement: -4 },
        { month: 'Nov', averageWait: 142, target: 120, improvement: -10 },
        { month: 'Dec', averageWait: 128, target: 120, improvement: -10 },
        { month: 'Jan', averageWait: 89, target: 120, improvement: -30 }
      ];
      
      res.json({ 
        data: waitTimeData,
        totalImprovement: 46, // percentage improvement from Sep to Jan
        trend: 'decreasing',
        lastUpdated: new Date().toISOString()
      });
    } catch (error) {
      console.error('Error fetching wait time analytics:', error);
      res.status(500).json({ 
        error: 'Failed to fetch wait time analytics',
        message: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
      });
    }
  }
);

// Save patient data (requires authentication and validation)
app.post('/api/patient', 
  authenticateUser,
  requireRole(['admin', 'doctor', 'nurse']),
  [
    body('name').isString().isLength({ min: 2, max: 100 }).withMessage('Name must be between 2 and 100 characters'),
    body('age').isInt({ min: 0, max: 150 }).withMessage('Age must be a valid number between 0 and 150'),
    body('condition').optional().isString().isLength({ max: 500 }).withMessage('Condition must be less than 500 characters'),
    body('medications').optional().isArray().withMessage('Medications must be an array'),
    body('contactInfo.email').optional().isEmail().withMessage('Please provide a valid email'),
    body('contactInfo.phone').optional().isString().isLength({ min: 10, max: 20 }).withMessage('Phone number must be between 10 and 20 characters')
  ],
  validateInput,
  async (req, res) => {
    try {
      const patientData = req.body;
      const userId = req.user.uid;
      
      // Input sanitization
      const sanitizedData = {
        ...patientData,
        name: patientData.name.trim(),
        age: parseInt(patientData.age),
        condition: patientData.condition ? patientData.condition.trim() : '',
        medications: patientData.medications || [],
        contactInfo: {
          email: patientData.contactInfo?.email?.trim() || '',
          phone: patientData.contactInfo?.phone?.trim() || ''
        },
        createdBy: userId,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      
      // In production, save to Firebase
      const docRef = doc(db, 'patients', patientData.id || Date.now().toString());
      await setDoc(docRef, sanitizedData);
      
      res.json({ 
        success: true, 
        message: 'Patient data saved successfully',
        patientId: docRef.id,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error('Error saving patient data:', error);
      res.status(500).json({ 
        error: 'Failed to save patient data',
        message: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
      });
    }
  }
);

// Apply the comprehensive error handling middleware
app.use(errorHandler);

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ 
    error: 'API endpoint not found',
    message: 'The requested endpoint does not exist',
    timestamp: new Date().toISOString()
  });
});

const port = process.env.PORT || 3001;

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('SIGINT received, shutting down gracefully');
  process.exit(0);
});

if (process.env.NODE_ENV !== 'production') {
  app.listen(port, () => {
    console.log(`🚀 LingapLink PH API server running on port ${port}`);
    console.log(`🔒 Security features enabled`);
    console.log(`📊 Environment: ${process.env.NODE_ENV || 'development'}`);
    console.log(`🏥 Firebase project: ${firebaseConfig.projectId}`);
  });
}

module.exports = app; 