const mongoose = require('mongoose');
const Attendance = require('../../models/Attendance');
const Staff = require('../../models/Staff');
const User = require('../../models/User');
const { connect, closeDatabase, clearDatabase } = require('../testSetup');

describe('Attendance Model', () => {
  let staffId, userId;

  beforeAll(async () => {
    await connect();
  });

  afterAll(async () => {
    await closeDatabase();
  });

  beforeEach(async () => {
    await clearDatabase();
    
    // Create a staff member and user for testing
    const staff = await Staff.create({
      name: 'Test Doctor',
      staffId: 'DOC001',
      role: 'Doctor',
      shift: 'Morning',
    });
    staffId = staff._id;

    const user = await User.create({
      name: 'Admin User',
      userName: 'admin',
      email: 'admin@test.com',
      password: 'password123',
    });
    userId = user._id;
  });

  describe('Attendance Creation', () => {
    it('should create attendance record with valid data', async () => {
      const attendance = await Attendance.create({
        staffId,
        date: new Date('2024-12-11'),
        shift: 'Morning',
        status: 'Present',
        markedBy: userId,
      });

      expect(attendance.staffId).toEqual(staffId);
      expect(attendance.shift).toBe('Morning');
      expect(attendance.status).toBe('Present');
      expect(attendance.markedBy).toEqual(userId);
    });

    it('should fail without required fields', async () => {
      const attendance = new Attendance({});
      
      let error;
      try {
        await attendance.save();
      } catch (err) {
        error = err;
      }

      expect(error).toBeDefined();
      expect(error.errors.staffId).toBeDefined();
      expect(error.errors.date).toBeDefined();
      expect(error.errors.shift).toBeDefined();
    });

    it('should default status to Absent if not provided', async () => {
      const attendance = await Attendance.create({
        staffId,
        date: new Date('2024-12-11'),
        shift: 'Morning',
      });

      expect(attendance.status).toBe('Absent');
    });

    it('should accept valid status values', async () => {
      const statuses = ['Present', 'Absent', 'Leave', 'Half-Day'];
      
      for (const status of statuses) {
        const attendance = await Attendance.create({
          staffId,
          date: new Date(`2024-12-${10 + statuses.indexOf(status)}`),
          shift: 'Morning',
          status,
          markedBy: userId,
        });
        
        expect(attendance.status).toBe(status);
      }
    });

    it('should fail with invalid status value', async () => {
      let error;
      try {
        await Attendance.create({
          staffId,
          date: new Date('2024-12-11'),
          shift: 'Morning',
          status: 'Invalid',
          markedBy: userId,
        });
      } catch (err) {
        error = err;
      }

      expect(error).toBeDefined();
      expect(error.errors.status).toBeDefined();
    });
  });

  describe('Attendance Unique Constraint', () => {
    it('should prevent duplicate attendance for same staff, date, and shift', async () => {
      await Attendance.create({
        staffId,
        date: new Date('2024-12-11'),
        shift: 'Morning',
        status: 'Present',
        markedBy: userId,
      });

      let error;
      try {
        await Attendance.create({
          staffId,
          date: new Date('2024-12-11'),
          shift: 'Morning',
          status: 'Absent',
          markedBy: userId,
        });
      } catch (err) {
        error = err;
      }

      expect(error).toBeDefined();
      expect(error.code).toBe(11000); // Duplicate key error
    });

    it('should allow same staff on different dates', async () => {
      const attendance1 = await Attendance.create({
        staffId,
        date: new Date('2024-12-11'),
        shift: 'Morning',
        status: 'Present',
        markedBy: userId,
      });

      const attendance2 = await Attendance.create({
        staffId,
        date: new Date('2024-12-12'),
        shift: 'Morning',
        status: 'Present',
        markedBy: userId,
      });

      expect(attendance1._id).not.toEqual(attendance2._id);
    });

    it('should allow same staff on different shifts same day', async () => {
      const attendance1 = await Attendance.create({
        staffId,
        date: new Date('2024-12-11'),
        shift: 'Morning',
        status: 'Present',
        markedBy: userId,
      });

      const attendance2 = await Attendance.create({
        staffId,
        date: new Date('2024-12-11'),
        shift: 'Evening',
        status: 'Present',
        markedBy: userId,
      });

      expect(attendance1._id).not.toEqual(attendance2._id);
    });
  });

  describe('Attendance Remarks', () => {
    it('should store remarks', async () => {
      const attendance = await Attendance.create({
        staffId,
        date: new Date('2024-12-11'),
        shift: 'Morning',
        status: 'Leave',
        remarks: 'Medical leave',
        markedBy: userId,
      });

      expect(attendance.remarks).toBe('Medical leave');
    });

    it('should trim remarks', async () => {
      const attendance = await Attendance.create({
        staffId,
        date: new Date('2024-12-11'),
        shift: 'Morning',
        status: 'Leave',
        remarks: '  Planned leave  ',
        markedBy: userId,
      });

      expect(attendance.remarks).toBe('Planned leave');
    });

    it('should reject remarks exceeding 200 characters', async () => {
      let error;
      try {
        await Attendance.create({
          staffId,
          date: new Date('2024-12-11'),
          shift: 'Morning',
          status: 'Leave',
          remarks: 'A'.repeat(201),
          markedBy: userId,
        });
      } catch (err) {
        error = err;
      }

      expect(error).toBeDefined();
      expect(error.errors.remarks).toBeDefined();
    });
  });

  describe('Attendance Timestamps', () => {
    it('should automatically set createdAt and updatedAt', async () => {
      const attendance = await Attendance.create({
        staffId,
        date: new Date('2024-12-11'),
        shift: 'Morning',
        status: 'Present',
        markedBy: userId,
      });

      expect(attendance.createdAt).toBeDefined();
      expect(attendance.updatedAt).toBeDefined();
    });

    it('should automatically set markedAt', async () => {
      const attendance = await Attendance.create({
        staffId,
        date: new Date('2024-12-11'),
        shift: 'Morning',
        status: 'Present',
        markedBy: userId,
      });

      expect(attendance.markedAt).toBeDefined();
    });
  });
});
