const mongoose = require('mongoose');
const Staff = require('../../models/Staff');
const db = require('../testSetup');

beforeAll(async () => await db.connect());
afterEach(async () => await db.clearDatabase());
afterAll(async () => await db.closeDatabase());

describe('Staff Model Test', () => {
  it('should create & save staff successfully with auto-generated staffId', async () => {
    const validStaff = new Staff({
      name: 'Dr. Test',
      email: 'dr.test@hospital.com',
      role: 'Doctor',
      shift: 'Morning (8:00 AM - 4:00 PM)',
      date: new Date('2025-12-12'),
    });
    const savedStaff = await validStaff.save();
    
    expect(savedStaff._id).toBeDefined();
    expect(savedStaff.name).toBe('Dr. Test');
    expect(savedStaff.staffId).toBe('D001');
    expect(savedStaff.email).toBe('dr.test@hospital.com');
    expect(savedStaff.role).toBe('Doctor');
    expect(savedStaff.shift).toBe('Morning (8:00 AM - 4:00 PM)');
    expect(savedStaff.date).toBeDefined();
  });

  it('should fail to create staff without required fields', async () => {
    const staffWithoutRequired = new Staff({ name: 'Test' });
    let err;
    try {
      await staffWithoutRequired.save();
    } catch (error) {
      err = error;
    }
    expect(err).toBeInstanceOf(mongoose.Error.ValidationError);
    expect(err.errors.role).toBeDefined();
    expect(err.errors.shift).toBeDefined();
  });

  it('should auto-generate sequential staffIds for same role', async () => {
    const firstNurse = await Staff.create({
      name: 'First Nurse',
      role: 'Nurse',
      shift: 'Morning (8:00 AM - 4:00 PM)',
    });
    
    const secondNurse = await Staff.create({
      name: 'Second Nurse',
      role: 'Nurse',
      shift: 'Evening (4:00 PM - 12:00 AM)',
    });
    
    expect(firstNurse.staffId).toBe('N001');
    expect(secondNurse.staffId).toBe('N002');
  });

  it('should trim whitespace from fields and lowercase email', async () => {
    const staff = new Staff({
      name: '  Dr. Space  ',
      email: '  DR.SPACE@HOSPITAL.COM  ',
      role: '  Doctor  ',
      shift: '  Morning (8:00 AM - 4:00 PM)  ',
    });
    await staff.save();
    
    expect(staff.name).toBe('Dr. Space');
    expect(staff.email).toBe('dr.space@hospital.com');
    expect(staff.role).toBe('Doctor');
    expect(staff.shift).toBe('Morning (8:00 AM - 4:00 PM)');
  });

  it('should have createdAt timestamp', async () => {
    const staff = new Staff({
      name: 'Dr. Time',
      role: 'Doctor',
      shift: 'Morning (8:00 AM - 4:00 PM)',
    });
    const savedStaff = await staff.save();
    
    expect(savedStaff.createdAt).toBeDefined();
    expect(savedStaff.createdAt).toBeInstanceOf(Date);
  });

  it('should validate role field exists', async () => {
    const staffNoRole = new Staff({
      name: 'No Role',
      shift: 'Morning (8:00 AM - 4:00 PM)',
    });
    
    let err;
    try {
      await staffNoRole.save();
    } catch (error) {
      err = error;
    }
    expect(err).toBeInstanceOf(mongoose.Error.ValidationError);
    expect(err.errors.role).toBeDefined();
  });
});
