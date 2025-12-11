# Health Staff Scheduler & Attendance Tracker API

A comprehensive Node.js backend API for managing healthcare staff scheduling and attendance tracking with shift requirement validation.

## 🚀 Features

- **Authentication**: JWT-based login system with encrypted passwords
- **Staff Management**: Complete CRUD operations for staff members
- **Shift Validation**: Automatic validation of shift requirements (1 Doctor, 2 Nurses, 1 Technician per shift)
- **Attendance Tracking**: Date-wise and shift-wise attendance management with history
- **Filtering**: Advanced filtering capabilities for staff and attendance data
- **API Documentation**: Interactive Swagger UI documentation
- **Testing**: Comprehensive test suite with 88.63% code coverage

## 📋 Prerequisites

- Node.js v18.12.1 or higher
- MongoDB database
- npm package manager

## Getting Started

### Installation
```bash
npm install
```

#### Development Mode (with auto-restart)
```bash
npm run dev
```

#### Production Mode
```bash
npm start
```

Server starts on `http://localhost:3000`

## 📚 API Documentation

**Swagger UI**: [http://localhost:3000/api-docs](http://localhost:3000/api-docs)

### Quick Start with Swagger

1. Start the server
2. Open http://localhost:3000/api-docs
3. Login via `/api/auth/login`:
   - Username: `bkshaw` | Password: `password123`
4. Copy the JWT token from response
5. Click "Authorize" in Swagger UI and paste token
6. Test all endpoints interactively

## 🔐 Authentication

**Login**: `POST /api/auth/login`
```json
{
  "userName": "bkshaw",
  "password": "password123"
}
```

Returns JWT token - use in header: `Authorization: Bearer <token>`

## 📡 API Endpoints

### Authentication
- `POST /api/auth/login` - Login user
- `GET /api/auth/me` - Get current user

### Staff Management  
- `GET /api/staff?shift=Morning` - Get all staff (with optional shift filter)
- `POST /api/staff` - Create staff member
- `GET /api/staff/:id` - Get single staff
- `PUT /api/staff/:id` - Update staff
- `DELETE /api/staff/:id` - Delete staff

### Attendance
- `GET /api/attendance` - Get records (supports date, shift, staffId, status filters)
- `POST /api/attendance` - Mark single attendance
- `POST /api/attendance/bulk` - Mark bulk attendance
- `GET /api/attendance/staff/:staffId` - Get staff history with statistics
- `PUT /api/attendance/:id` - Update record
- `DELETE /api/attendance/:id` - Delete record

### Users (Admin)
- Full CRUD operations on `/api/users`

## 🧪 Testing

```bash
npm test              # Run all tests with coverage
npm run test:watch    # Watch mode
```

**Results**: 87 tests passing | 88.63% coverage

## 🗄️ Database Models

- **User**: Authentication & admin management
- **Staff**: Staff members with shift assignment
- **Attendance**: Daily attendance tracking with status

## 📊 Shift Requirements

Auto-validates each shift has:
- 1 Doctor | 2 Nurses | 1 Technician

## 🛠️ Tech Stack

- Express.js | MongoDB | Mongoose
- JWT + bcryptjs | Swagger UI
- Jest + Supertest | Nodemon

## 📝 Demo Credentials

#### Development Mode (with auto-restart)

**Development mode (with auto-restart):**
```bash
npm run dev
```

**Production mode:**
```bash
npm start
```

The server will run on `http://localhost:3000` by default.

## Project Structure

```
BackEnd/
├── server.js          # Main server file
├── package.json       # Project dependencies
├── .env              # Environment variables
├── .gitignore        # Git ignore file
├── routes/           # Route definitions
├── controllers/      # Request handlers
├── middleware/       # Custom middleware
└── models/           # Data models
```

## API Endpoints

- `GET /` - Welcome message
- `GET /api/health` - Health check endpoint

## 📝 Demo Credentials

- **User 1**: `bkshaw` / `password123`
- **User 2**: `venky` / `demo1234`

## 📄 Documentation

---

**Developed for Bayer Hackathon 2025** 🏥
