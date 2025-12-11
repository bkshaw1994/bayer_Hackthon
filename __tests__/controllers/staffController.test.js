const request = require('supertest');
const express = require('express');
const jwt = require('jsonwebtoken');
const User = require('../../models/User');
const Staff = require('../../models/Staff');
const Attendance = require('../../models/Attendance');
const staffRoutes = require('../../routes/staffRoutes');
const db = require('../testSetup');

process.env.JWT_SECRET = 'test_secret_key';

const app = express();
app.use(express.json());
app.use('/api/staff', staffRoutes);

let token;
let userId;

beforeAll(async () => {
  await db.connect();
});

beforeEach(async () => {
  const user = await User.create({
    name: 'Admin',
    userName: 'admin',
    email: 'admin@example.com',
    password: 'password',
  });
  userId = user._id;
  token = jwt.sign({ id: userId }, process.env.JWT_SECRET, { expiresIn: '30d' });
});

afterEach(async () => await db.clearDatabase());
afterAll(async () => await db.closeDatabase());

describe('Staff Controller Tests', () => {
  describe('GET /api/staff', () => {
    beforeEach(async () => {
      // Create staff for different shifts
      await Staff.create([
        { name: 'Dr. A', staffId: 'S001', role: 'Doctor', shift: 'Morning (8:00 AM - 4:00 PM)' },
        { name: 'Nurse B', staffId: 'S002', role: 'Nurse', shift: 'Morning (8:00 AM - 4:00 PM)' },
        { name: 'Nurse C', staffId: 'S003', role: 'Nurse', shift: 'Morning (8:00 AM - 4:00 PM)' },
        { name: 'Tech D', staffId: 'S004', role: 'Technician', shift: 'Morning (8:00 AM - 4:00 PM)' },
        { name: 'Dr. E', staffId: 'S005', role: 'Doctor', shift: 'Evening (4:00 PM - 12:00 AM)' },
      ]);
    });

    it('should get all staff with authentication', async () => {
      const response = await request(app)
        .get('/api/staff')
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.count).toBe(5);
      expect(response.body.data).toHaveLength(5);
    });

    it('should return shift status with staff requirements', async () => {
      const response = await request(app)
        .get('/api/staff')
        .set('Authorization', `Bearer ${token}`);

      expect(response.body.shiftStatus).toBeDefined();
      expect(response.body.shiftStatus['Morning (8:00 AM - 4:00 PM)']).toBeDefined();
      expect(response.body.shiftStatus['Morning (8:00 AM - 4:00 PM)'].isFullyStaffed).toBe(true);
    });

    it('should detect short staffed shifts', async () => {
      const response = await request(app)
        .get('/api/staff')
        .set('Authorization', `Bearer ${token}`);

      const eveningShift = response.body.shiftStatus['Evening (4:00 PM - 12:00 AM)'];
      expect(eveningShift.isFullyStaffed).toBe(false);
      expect(eveningShift.shortages).toBeDefined();
      expect(eveningShift.message).toBe('Short staffed');
    });

    it('should fail without authentication', async () => {
      const response = await request(app).get('/api/staff');

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
    });
  });

  describe('POST /api/staff', () => {
    it('should create new staff with authentication and auto-generate staffId', async () => {
      const newStaff = {
        name: 'New Doctor',
        email: 'new.doctor@hospital.com',
        role: 'Doctor',
        shift: 'Morning',
        date: '2025-12-12',
      };

      const response = await request(app)
        .post('/api/staff')
        .set('Authorization', `Bearer ${token}`)
        .send(newStaff);

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data.name).toBe('New Doctor');
      expect(response.body.data.email).toBe('new.doctor@hospital.com');
      expect(response.body.data.staffId).toMatch(/^D\d{3}$/);
    });

    it('should fail to create staff without required fields', async () => {
      const response = await request(app)
        .post('/api/staff')
        .set('Authorization', `Bearer ${token}`)
        .send({ name: 'Incomplete' });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });

    it('should fail without authentication', async () => {
      const response = await request(app)
        .post('/api/staff')
        .send({ name: 'Test', email: 'test@hospital.com', role: 'Nurse', shift: 'Morning' });

      expect(response.status).toBe(401);
    });
  });

  describe('GET /api/staff/:id', () => {
    let staffId;

    beforeEach(async () => {
      const staff = await Staff.create({
        name: 'Test Staff',
        email: 'test.staff@hospital.com',
        role: 'Nurse',
        shift: 'Morning (8:00 AM - 4:00 PM)',
      });
      staffId = staff._id;
    });

    it('should get single staff by id', async () => {
      const response = await request(app)
        .get(`/api/staff/${staffId}`)
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.name).toBe('Test Staff');
    });

    it('should return 404 for non-existent staff', async () => {
      const fakeId = '507f1f77bcf86cd799439011';
      const response = await request(app)
        .get(`/api/staff/${fakeId}`)
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
    });
  });

  describe('PUT /api/staff/:id', () => {
    let staffId;

    beforeEach(async () => {
      const staff = await Staff.create({
        name: 'Update Test',
        email: 'update.test@hospital.com',
        role: 'Nurse',
        shift: 'Morning (8:00 AM - 4:00 PM)',
      });
      staffId = staff._id;
    });

    it('should update staff successfully', async () => {
      const response = await request(app)
        .put(`/api/staff/${staffId}`)
        .set('Authorization', `Bearer ${token}`)
        .send({ role: 'Doctor' });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.role).toBe('Doctor');
    });

    it('should return 404 for non-existent staff', async () => {
      const fakeId = '507f1f77bcf86cd799439011';
      const response = await request(app)
        .put(`/api/staff/${fakeId}`)
        .set('Authorization', `Bearer ${token}`)
        .send({ role: 'Doctor' });

      expect(response.status).toBe(404);
    });
  });

  describe('DELETE /api/staff/:id', () => {
    let staffId;

    beforeEach(async () => {
      const staff = await Staff.create({
        name: 'Delete Test',
        email: 'delete.test@hospital.com',
        role: 'Technician',
        shift: 'Evening (4:00 PM - 12:00 AM)',
      });
      staffId = staff._id;
    });

    it('should delete staff successfully', async () => {
      const response = await request(app)
        .delete(`/api/staff/${staffId}`)
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);

      const deletedStaff = await Staff.findById(staffId);
      expect(deletedStaff).toBeNull();
    });

    it('should return 404 for non-existent staff', async () => {
      const fakeId = '507f1f77bcf86cd799439011';
      const response = await request(app)
        .delete(`/api/staff/${fakeId}`)
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(404);
    });
  });

  describe('GET /api/staff/:staffId/weekly-stats - Get Weekly Stats', () => {
    let staff;

    beforeEach(async () => {
      staff = await Staff.create({
        name: 'Test Staff',
        email: 'test.staff@hospital.com',
        role: 'Technician',
        shift: 'Morning'
      });
    });

    it('should get weekly stats with staffId', async () => {
      // Create some attendance records for the past 7 days
      const today = new Date();
      for (let i = 0; i < 7; i++) {
        const date = new Date(today);
        date.setDate(date.getDate() - i);
        await Attendance.create({
          staffId: staff._id,
          date: date,
          shift: 'Morning',
          status: i % 2 === 0 ? 'Present' : 'Absent'
        });
      }

      const response = await request(app)
        .get(`/api/staff/${staff.staffId}/weekly-stats`)
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.staff).toHaveProperty('staffId', staff.staffId);
      expect(response.body.staff).toHaveProperty('name', staff.name);
      expect(response.body).toHaveProperty('statistics');
      expect(response.body.records).toHaveLength(7);
    });

    it('should get weekly stats with MongoDB ObjectId', async () => {
      // Create some attendance records
      const today = new Date();
      for (let i = 0; i < 5; i++) {
        const date = new Date(today);
        date.setDate(date.getDate() - i);
        await Attendance.create({
          staffId: staff._id,
          date: date,
          shift: 'Morning',
          status: 'Present'
        });
      }

      const response = await request(app)
        .get(`/api/staff/${staff._id}/weekly-stats`)
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.staff).toHaveProperty('staffId', staff.staffId);
      expect(response.body.records.length).toBeGreaterThan(0);
    });

    it('should calculate statistics correctly', async () => {
      // Create specific attendance records
      const today = new Date();
      const dates = [];
      for (let i = 0; i < 7; i++) {
        const date = new Date(today);
        date.setDate(date.getDate() - i);
        dates.push(date);
      }

      await Attendance.create({ staffId: staff._id, date: dates[0], shift: 'Morning', status: 'Present' });
      await Attendance.create({ staffId: staff._id, date: dates[1], shift: 'Morning', status: 'Present' });
      await Attendance.create({ staffId: staff._id, date: dates[2], shift: 'Morning', status: 'Absent' });
      await Attendance.create({ staffId: staff._id, date: dates[3], shift: 'Morning', status: 'Leave' });
      await Attendance.create({ staffId: staff._id, date: dates[4], shift: 'Morning', status: 'Half-Day' });

      const response = await request(app)
        .get(`/api/staff/${staff.staffId}/weekly-stats`)
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(response.body.statistics.present).toBeGreaterThanOrEqual(2);
      expect(response.body.statistics.absent).toBeGreaterThanOrEqual(1);
      expect(response.body.statistics.leave).toBeGreaterThanOrEqual(1);
      expect(response.body.statistics.halfDay).toBeGreaterThanOrEqual(1);
    });

    it('should return 7 days of records', async () => {
      // Create attendance records for 7 days
      const today = new Date();
      for (let i = 0; i < 7; i++) {
        const date = new Date(today);
        date.setDate(date.getDate() - i);
        await Attendance.create({
          staffId: staff._id,
          date: date,
          shift: 'Morning',
          status: 'Present'
        });
      }

      const response = await request(app)
        .get(`/api/staff/${staff.staffId}/weekly-stats`)
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(response.body.records).toHaveLength(7);
    });

    it('should fail with invalid staffId', async () => {
      const response = await request(app)
        .get('/api/staff/INVALID999/weekly-stats')
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
    });

    it('should fail with invalid ObjectId format', async () => {
      const response = await request(app)
        .get('/api/staff/invalid-object-id/weekly-stats')
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
    });
  });
});
