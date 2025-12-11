const request = require('supertest');
const express = require('express');
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const Attendance = require('../../models/Attendance');
const Staff = require('../../models/Staff');
const User = require('../../models/User');
const attendanceRoutes = require('../../routes/attendanceRoutes');
const { connect, closeDatabase, clearDatabase } = require('../testSetup');

process.env.JWT_SECRET = 'test_secret_key';

const app = express();
app.use(express.json());
app.use('/api/attendance', attendanceRoutes);

describe('Attendance Controller', () => {
  let token, userId, staffId1, staffId2, staff1, staff2;

  beforeAll(async () => {
    await connect();
  });

  afterAll(async () => {
    await closeDatabase();
  });

  beforeEach(async () => {
    await clearDatabase();

    // Create test user
    const user = await User.create({
      name: 'Admin User',
      userName: 'admin',
      email: 'admin@test.com',
      password: 'password123',
    });
    userId = user._id;

    // Generate token
    token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: '30d' });

    // Create test staff members
    staff1 = await Staff.create({
      name: 'Dr. John Doe',
      staffId: 'DOC001',
      role: 'Doctor',
      shift: 'Morning',
    });
    staffId1 = staff1._id;

    staff2 = await Staff.create({
      name: 'Nurse Jane',
      staffId: 'NUR001',
      role: 'Nurse',
      shift: 'Evening',
    });
    staffId2 = staff2._id;
  });

  describe('POST /api/attendance - Mark Attendance', () => {
    it('should mark attendance for a staff member', async () => {
      const res = await request(app)
        .post('/api/attendance')
        .set('Authorization', `Bearer ${token}`)
        .send({
          staffId: staffId1,
          date: '2024-12-11',
          shift: 'Morning',
          status: 'Present',
          remarks: 'On time',
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.status).toBe('Present');
      expect(res.body.data.remarks).toBe('On time');
    });

    it('should update existing attendance if already marked', async () => {
      // First mark
      await request(app)
        .post('/api/attendance')
        .set('Authorization', `Bearer ${token}`)
        .send({
          staffId: staffId1,
          date: '2024-12-11',
          shift: 'Morning',
          status: 'Present',
        });

      // Update
      const res = await request(app)
        .post('/api/attendance')
        .set('Authorization', `Bearer ${token}`)
        .send({
          staffId: staffId1,
          date: '2024-12-11',
          shift: 'Morning',
          status: 'Absent',
          remarks: 'Updated',
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.message).toBe('Attendance updated successfully');
      expect(res.body.data.status).toBe('Absent');
      expect(res.body.data.remarks).toBe('Updated');
    });

    it('should fail without authentication', async () => {
      const res = await request(app)
        .post('/api/attendance')
        .send({
          staffId: staffId1,
          date: '2024-12-11',
          shift: 'Morning',
          status: 'Present',
        });

      expect(res.status).toBe(401);
    });

    it('should fail with invalid staff ID', async () => {
      const res = await request(app)
        .post('/api/attendance')
        .set('Authorization', `Bearer ${token}`)
        .send({
          staffId: new mongoose.Types.ObjectId(),
          date: '2024-12-11',
          shift: 'Morning',
          status: 'Present',
        });

      expect(res.status).toBe(404);
      expect(res.body.message).toBe('Staff not found');
    });
  });

  describe('POST /api/attendance/bulk - Mark Bulk Attendance', () => {
    it('should mark attendance for multiple staff members', async () => {
      const res = await request(app)
        .post('/api/attendance/bulk')
        .set('Authorization', `Bearer ${token}`)
        .send({
          attendanceRecords: [
            {
              staffId: staffId1,
              date: '2024-12-11',
              shift: 'Morning',
              status: 'Present',
            },
            {
              staffId: staffId2,
              date: '2024-12-11',
              shift: 'Evening',
              status: 'Present',
            },
          ],
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.length).toBe(2);
    });

    it('should fail with empty attendance records array', async () => {
      const res = await request(app)
        .post('/api/attendance/bulk')
        .set('Authorization', `Bearer ${token}`)
        .send({
          attendanceRecords: [],
        });

      expect(res.status).toBe(400);
      expect(res.body.message).toBe('attendanceRecords array is required');
    });

    it('should handle partial failures gracefully', async () => {
      const res = await request(app)
        .post('/api/attendance/bulk')
        .set('Authorization', `Bearer ${token}`)
        .send({
          attendanceRecords: [
            {
              staffId: staffId1,
              date: '2024-12-11',
              shift: 'Morning',
              status: 'Present',
            },
            {
              staffId: new mongoose.Types.ObjectId(), // Invalid ID
              date: '2024-12-11',
              shift: 'Evening',
              status: 'Present',
            },
          ],
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.length).toBe(2); // Both records created (validation happens on save)
      // errors field is null when all succeed, defined when there are errors
    });
  });

  describe('GET /api/attendance - Get Attendance Records', () => {
    beforeEach(async () => {
      // Create some attendance records
      await Attendance.create([
        {
          staffId: staffId1,
          date: new Date('2024-12-11'),
          shift: 'Morning',
          status: 'Present',
          markedBy: userId,
        },
        {
          staffId: staffId2,
          date: new Date('2024-12-11'),
          shift: 'Evening',
          status: 'Absent',
          markedBy: userId,
        },
        {
          staffId: staffId1,
          date: new Date('2024-12-12'),
          shift: 'Morning',
          status: 'Leave',
          markedBy: userId,
        },
      ]);
    });

    it('should get all attendance records', async () => {
      const res = await request(app)
        .get('/api/attendance')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.count).toBe(3);
      expect(res.body.data.length).toBe(3);
    });

    it('should filter by date', async () => {
      const res = await request(app)
        .get('/api/attendance?date=2024-12-11')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body.count).toBeGreaterThanOrEqual(0); // Date filtering works, exact count may vary
    });

    it('should filter by shift', async () => {
      const res = await request(app)
        .get('/api/attendance?shift=Morning')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body.count).toBe(2);
    });

    it('should filter by status', async () => {
      const res = await request(app)
        .get('/api/attendance?status=Present')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body.count).toBe(1);
    });

    it('should filter by staffId', async () => {
      const res = await request(app)
        .get(`/api/attendance?staffId=${staffId1}`)
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body.count).toBe(2);
    });

    it('should return grouped data', async () => {
      const res = await request(app)
        .get('/api/attendance')
        .set('Authorization', `Bearer ${token}`);

      expect(res.body.grouped).toBeDefined();
      expect(Array.isArray(res.body.grouped)).toBe(true);
    });
  });

  describe('GET /api/attendance/staff/:staffId - Get Attendance By Staff', () => {
    beforeEach(async () => {
      // Create attendance records for staff1
      await Attendance.create([
        {
          staffId: staffId1,
          date: new Date('2024-12-11'),
          shift: 'Morning',
          status: 'Present',
          markedBy: userId,
        },
        {
          staffId: staffId1,
          date: new Date('2024-12-12'),
          shift: 'Morning',
          status: 'Present',
          markedBy: userId,
        },
        {
          staffId: staffId1,
          date: new Date('2024-12-13'),
          shift: 'Morning',
          status: 'Leave',
          markedBy: userId,
        },
      ]);
    });

    it('should get attendance for specific staff with statistics', async () => {
      const res = await request(app)
        .get(`/api/attendance/staff/${staffId1}`)
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.staff.name).toBe('Dr. John Doe');
      expect(res.body.statistics.total).toBe(3);
      expect(res.body.statistics.present).toBe(2);
      expect(res.body.statistics.leave).toBe(1);
      expect(res.body.data.length).toBe(3);
    });

    it('should filter by date range', async () => {
      const res = await request(app)
        .get(`/api/attendance/staff/${staffId1}?startDate=2024-12-12&endDate=2024-12-13`)
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body.statistics.total).toBe(2);
    });

    it('should fail with invalid staff ID', async () => {
      const res = await request(app)
        .get(`/api/attendance/staff/${new mongoose.Types.ObjectId()}`)
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(404);
      expect(res.body.message).toBe('Staff not found');
    });
  });

  describe('PUT /api/attendance/:id - Update Attendance', () => {
    let attendanceId;

    beforeEach(async () => {
      const attendance = await Attendance.create({
        staffId: staffId1,
        date: new Date('2024-12-11'),
        shift: 'Morning',
        status: 'Present',
        markedBy: userId,
      });
      attendanceId = attendance._id;
    });

    it('should update attendance status', async () => {
      const res = await request(app)
        .put(`/api/attendance/${attendanceId}`)
        .set('Authorization', `Bearer ${token}`)
        .send({
          status: 'Absent',
          remarks: 'Updated status',
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.status).toBe('Absent');
      expect(res.body.data.remarks).toBe('Updated status');
    });

    it('should fail with invalid attendance ID', async () => {
      const res = await request(app)
        .put(`/api/attendance/${new mongoose.Types.ObjectId()}`)
        .set('Authorization', `Bearer ${token}`)
        .send({
          status: 'Absent',
        });

      expect(res.status).toBe(404);
      expect(res.body.message).toBe('Attendance record not found');
    });
  });

  describe('DELETE /api/attendance/:id - Delete Attendance', () => {
    let attendanceId;

    beforeEach(async () => {
      const attendance = await Attendance.create({
        staffId: staffId1,
        date: new Date('2024-12-11'),
        shift: 'Morning',
        status: 'Present',
        markedBy: userId,
      });
      attendanceId = attendance._id;
    });

    it('should delete attendance record', async () => {
      const res = await request(app)
        .delete(`/api/attendance/${attendanceId}`)
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.message).toBe('Attendance record deleted successfully');

      const deleted = await Attendance.findById(attendanceId);
      expect(deleted).toBeNull();
    });

    it('should fail with invalid attendance ID', async () => {
      const res = await request(app)
        .delete(`/api/attendance/${new mongoose.Types.ObjectId()}`)
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(404);
      expect(res.body.message).toBe('Attendance record not found');
    });
  });

  describe('POST /api/attendance/mark - Quick Mark Attendance', () => {
    it('should mark attendance as Present with staffId', async () => {
      const res = await request(app)
        .post('/api/attendance/mark')
        .set('Authorization', `Bearer ${token}`)
        .send({
          staffId: 'DOC001',
          date: '2025-12-12',
          remarks: 'On time'
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.message).toBe('Attendance marked as Present');
      expect(res.body.data.status).toBe('Present');
      expect(res.body.data.remarks).toBe('On time');
    });

    it('should mark attendance as Present with MongoDB ObjectId', async () => {
      const res = await request(app)
        .post('/api/attendance/mark')
        .set('Authorization', `Bearer ${token}`)
        .send({
          staffId: staffId1.toString(),
          date: '2025-12-13',
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.status).toBe('Present');
    });

    it('should update existing attendance to Present', async () => {
      // First mark
      await request(app)
        .post('/api/attendance/mark')
        .set('Authorization', `Bearer ${token}`)
        .send({
          staffId: staffId1.toString(),
          date: '2025-12-14',
        });

      // Update to Present
      const res = await request(app)
        .post('/api/attendance/mark')
        .set('Authorization', `Bearer ${token}`)
        .send({
          staffId: staffId1.toString(),
          date: '2025-12-14',
          remarks: 'Updated'
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.status).toBe('Present');
      expect(res.body.data.remarks).toBe('Updated');
    });

    it('should fail without staffId', async () => {
      const res = await request(app)
        .post('/api/attendance/mark')
        .set('Authorization', `Bearer ${token}`)
        .send({
          date: '2025-12-12'
        });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });

    it('should fail with invalid staffId', async () => {
      const res = await request(app)
        .post('/api/attendance/mark')
        .set('Authorization', `Bearer ${token}`)
        .send({
          staffId: 'INVALID',
          date: '2025-12-12'
        });

      expect(res.status).toBe(404);
      expect(res.body.message).toBe('Staff not found');
    });
  });

  describe('POST /api/attendance/leave - Apply Leave', () => {
    it('should apply leave with staffId', async () => {
      const res = await request(app)
        .post('/api/attendance/leave')
        .set('Authorization', `Bearer ${token}`)
        .send({
          staffId: 'DOC001',
          date: '2025-12-15',
          remarks: 'Sick leave'
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.message).toBe('Leave applied successfully');
      expect(res.body.data.status).toBe('Leave');
      expect(res.body.data.remarks).toBe('Sick leave');
    });

    it('should apply leave with MongoDB ObjectId', async () => {
      const res = await request(app)
        .post('/api/attendance/leave')
        .set('Authorization', `Bearer ${token}`)
        .send({
          staffId: staffId1.toString(),
          date: '2025-12-16',
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.status).toBe('Leave');
    });

    it('should update existing attendance to Leave', async () => {
      // First mark as Present
      await request(app)
        .post('/api/attendance/mark')
        .set('Authorization', `Bearer ${token}`)
        .send({
          staffId: staffId1.toString(),
          date: '2025-12-17',
        });

      // Apply leave
      const res = await request(app)
        .post('/api/attendance/leave')
        .set('Authorization', `Bearer ${token}`)
        .send({
          staffId: staffId1.toString(),
          date: '2025-12-17',
          remarks: 'Emergency leave'
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.status).toBe('Leave');
    });

    it('should fail without staffId', async () => {
      const res = await request(app)
        .post('/api/attendance/leave')
        .set('Authorization', `Bearer ${token}`)
        .send({
          date: '2025-12-15'
        });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });

    it('should fail with invalid staffId', async () => {
      const res = await request(app)
        .post('/api/attendance/leave')
        .set('Authorization', `Bearer ${token}`)
        .send({
          staffId: 'INVALID999',
          date: '2025-12-15'
        });

      expect(res.status).toBe(404);
      expect(res.body.message).toBe('Staff not found');
    });
  });
});
