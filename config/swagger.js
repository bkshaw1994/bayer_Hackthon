const swaggerJsdoc = require('swagger-jsdoc');

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Health Staff Scheduler & Attendance Tracker API',
      version: '1.0.0',
      description: 'API documentation for the Health Staff Shift Scheduler and Attendance Tracker application. Manage staff, track attendance, and monitor shift requirements.',
      contact: {
        name: 'API Support',
      },
    },
    servers: [
      {
        url: 'http://localhost:3000',
        description: 'Development server',
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description: 'Enter JWT token obtained from /api/auth/login',
        },
      },
      schemas: {
        User: {
          type: 'object',
          required: ['name', 'userName', 'email', 'password'],
          properties: {
            name: {
              type: 'string',
              description: 'User full name',
            },
            userName: {
              type: 'string',
              description: 'Unique username for login',
            },
            email: {
              type: 'string',
              format: 'email',
              description: 'User email address',
            },
            password: {
              type: 'string',
              minLength: 6,
              description: 'User password (min 6 characters)',
            },
          },
        },
        Staff: {
          type: 'object',
          required: ['name', 'staffId', 'role', 'shift'],
          properties: {
            _id: {
              type: 'string',
              description: 'MongoDB document ID',
            },
            name: {
              type: 'string',
              description: 'Staff member name',
            },
            staffId: {
              type: 'string',
              description: 'Unique staff ID',
            },
            role: {
              type: 'string',
              description: 'Staff role (Doctor, Nurse, Technician)',
            },
            shift: {
              type: 'string',
              description: 'Assigned shift',
            },
            attendanceStatus: {
              type: 'string',
              description: 'Attendance status for the specified date (only included when date parameter is provided)',
              enum: ['Present', 'Absent', 'Leave', 'Half-Day', 'Not Marked'],
            },
            attendanceRemarks: {
              type: 'string',
              description: 'Remarks for attendance on the specified date (only included when date parameter is provided)',
            },
            attendance: {
              type: 'object',
              description: 'Detailed attendance object for the specified date (only included in single staff endpoint when date parameter is provided)',
              properties: {
                status: {
                  type: 'string',
                  enum: ['Present', 'Absent', 'Leave', 'Half-Day', 'Not Marked'],
                },
                remarks: {
                  type: 'string',
                },
                markedAt: {
                  type: 'string',
                  format: 'date-time',
                },
              },
            },
          },
        },
        Attendance: {
          type: 'object',
          required: ['staffId', 'date', 'shift', 'status'],
          properties: {
            staffId: {
              type: 'string',
              description: 'Staff member ID reference',
            },
            date: {
              type: 'string',
              format: 'date',
              description: 'Attendance date',
            },
            shift: {
              type: 'string',
              description: 'Shift for attendance',
            },
            status: {
              type: 'string',
              enum: ['Present', 'Absent', 'Leave', 'Half-Day'],
              description: 'Attendance status',
            },
            remarks: {
              type: 'string',
              maxLength: 200,
              description: 'Optional remarks',
            },
          },
        },
        Error: {
          type: 'object',
          properties: {
            success: {
              type: 'boolean',
              example: false,
            },
            message: {
              type: 'string',
            },
          },
        },
      },
    },
    security: [
      {
        bearerAuth: [],
      },
    ],
  },
  apis: ['./routes/*.js', './controllers/*.js'],
};

const swaggerSpec = swaggerJsdoc(options);

module.exports = swaggerSpec;
