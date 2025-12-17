const express = require('express');
const cors = require('cors');
const swaggerUi = require('swagger-ui-express');
const swaggerSpec = require('./config/swagger');
require('dotenv').config();
const connectDB = require('./config/database');

const app = express();
const PORT = process.env.PORT || 3000;

connectDB();

const allowedOrigins = [
  "https://red-pebble-03589a91e.3.azurestaticapps.net/"
];

app.use(cors({
  origin: function (origin, callback) {
    // allow REST tools like Postman
    if (!origin) return callback(null, true);

    if (allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error("CORS not allowed"));
    }
  },
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
  credentials: true
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

app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, {
  customCss: '.swagger-ui .topbar { display: none }',
  customSiteTitle: 'Health Staff Scheduler API',
}));

app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/users', require('./routes/userRoutes'));
app.use('/api/staff', require('./routes/staffRoutes'));
app.use('/api/attendance', require('./routes/attendanceRoutes'));

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
