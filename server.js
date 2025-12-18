const express = require('express');
const cors = require('cors');
const swaggerUi = require('swagger-ui-express');
const swaggerSpec = require('./config/swagger');
require('dotenv').config();
const connectDB = require('./config/database');

const app = express();
const PORT = process.env.PORT || 3000;

console.log('Starting server initialization...');
console.log('Environment variables loaded:');
console.log('- NODE_ENV:', process.env.NODE_ENV);
console.log('- PORT:', PORT);
console.log('- BACKEND_URL:', process.env.BACKEND_URL);
console.log('- MongoDB URI:', process.env.MONGODB_URI ? 'Connected' : 'Not set');

try {
  connectDB();
  console.log('Database connection initiated');
} catch (error) {
  console.error('Database connection error:', error.message);
}

const allowedOrigins = [
  "https://red-pebble-03589a91e.3.azurestaticapps.net",
  "http://localhost:3000",
  "http://localhost:5173",
  "http://localhost:3001"
];

app.use(cors({
  origin: true, // Allow all origins temporarily for debugging
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
  credentials: true,
  maxAge: 86400
}));

app.options("*", cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.get('/', (req, res) => {
  res.json({ 
    message: 'Welcome to the Health Staff Scheduler & Attendance Tracker API',
    documentation: '/api-docs'
  });
});

app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', message: 'Server is running' });
});

try {
  console.log('Loading Swagger documentation...');
  app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, {
    customCss: '.swagger-ui .topbar { display: none }',
    customSiteTitle: 'Health Staff Scheduler API',
  }));
  console.log('Swagger loaded successfully');
} catch (error) {
  console.error('Error loading Swagger:', error.message);
}

try {
  console.log('Loading routes...');
  app.use('/api/auth', require('./routes/authRoutes'));
  console.log('Auth routes loaded');
  app.use('/api/users', require('./routes/userRoutes'));
  console.log('User routes loaded');
  app.use('/api/staff', require('./routes/staffRoutes'));
  console.log('Staff routes loaded');
  app.use('/api/attendance', require('./routes/attendanceRoutes'));
  console.log('Attendance routes loaded');
  app.use('/api/leave', require('./routes/leaveRoutes'));
  console.log('Leave routes loaded');
  app.use('/api/shift', require('./routes/shiftRoutes'));
  console.log('Shift routes loaded');
} catch (error) {
  console.error('Error loading routes:', error.message, error.stack);
}

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('=== ERROR CAUGHT ===');
  console.error('Timestamp:', new Date().toISOString());
  console.error('Path:', req.path);
  console.error('Method:', req.method);
  console.error('Message:', err.message);
  console.error('Stack:', err.stack);
  console.error('==================');
  
  if (err.message === 'CORS not allowed') {
    return res.status(403).json({ 
      success: false, 
      error: 'CORS error: Origin not allowed',
      origin: req.get('origin')
    });
  }
  
  // Always send error details for debugging
  const errorResponse = {
    success: false, 
    error: 'Internal Server Error',
    timestamp: new Date().toISOString(),
    path: req.path,
    method: req.method,
    details: {
      message: err.message,
      type: err.name,
      code: err.code
    }
  };
  
  res.status(500).json(errorResponse);
});

// 404 handler
app.use((req, res) => {
  console.warn(`404 Not Found: ${req.method} ${req.path}`);
  res.status(404).json({ 
    success: false, 
    error: 'Route not found' 
  });
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
  console.log(`API docs available at http://localhost:${PORT}/api-docs`);
});
