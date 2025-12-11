const mongoose = require('mongoose');
const Attendance = require('./models/Attendance');
const Staff = require('./models/Staff');
const User = require('./models/User');
require('dotenv').config();

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI);

const getRandomStatus = () => {
  const statuses = ['Present', 'Absent', 'Leave', 'Half-Day'];
  const weights = [0.9, 0.05, 0.03, 0.02]; // 90% Present, 5% Absent, 3% Leave, 2% Half-Day
  const random = Math.random();
  let sum = 0;
  
  for (let i = 0; i < weights.length; i++) {
    sum += weights[i];
    if (random <= sum) return statuses[i];
  }
  return 'Present';
};

const seedAttendance = async () => {
  try {
    // Get all staff and at least one user for markedBy
    const staff = await Staff.find({});
    const users = await User.find({});
    
    if (staff.length === 0) {
      console.log('No staff found. Please run seedStaff.js first.');
      mongoose.connection.close();
      return;
    }

    if (users.length === 0) {
      console.log('No users found. Please run seedUsers.js first.');
      mongoose.connection.close();
      return;
    }

    const markedBy = users[0]._id;

    // Clear existing attendance
    await Attendance.deleteMany({});
    console.log('Existing attendance data cleared');

    // Get current date and seed for the current week (7 days)
    const today = new Date();
    const startDate = new Date(today);
    startDate.setDate(today.getDate() - 6); // Start 6 days ago for a full week including today

    const attendanceRecords = [];

    // Generate attendance for each day for each staff member
    for (let i = 0; i < 7; i++) {
      const date = new Date(startDate);
      date.setDate(startDate.getDate() + i);
      date.setHours(0, 0, 0, 0); // Normalize to midnight

      for (const staffMember of staff) {
        attendanceRecords.push({
          staffId: staffMember._id,
          date: date,
          shift: staffMember.shift,
          status: getRandomStatus(),
          remarks: '',
          markedBy: markedBy,
        });
      }
    }

    // Insert attendance records
    const attendance = await Attendance.insertMany(attendanceRecords);
    console.log(`${attendance.length} attendance records seeded successfully`);

    // Display summary
    console.log('\nAttendance Summary:');
    console.log(`Date Range: ${startDate.toLocaleDateString()} to ${today.toLocaleDateString()}`);
    console.log(`Total Records: ${attendance.length}`);
    console.log(`Staff Members: ${staff.length}`);
    console.log(`Days: 7`);

    const statusCounts = attendance.reduce((acc, record) => {
      acc[record.status] = (acc[record.status] || 0) + 1;
      return acc;
    }, {});

    console.log('\nStatus Distribution:');
    Object.entries(statusCounts).forEach(([status, count]) => {
      console.log(`  ${status}: ${count} (${((count/attendance.length)*100).toFixed(1)}%)`);
    });

    mongoose.connection.close();
  } catch (error) {
    console.error('Error seeding attendance data:', error);
    mongoose.connection.close();
  }
};

seedAttendance();
