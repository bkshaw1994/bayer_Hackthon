const mongoose = require('mongoose');
const Staff = require('./models/Staff');
require('dotenv').config();

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI);

const staffData = [
  // Morning Shift - 1 Doctor, 2 Nurses, 1 Technician
  {
    name: 'Dr. Sarah Johnson',
    staffId: 'D001',
    role: 'Doctor',
    shift: 'Morning',
  },
  {
    name: 'Nurse Emily Davis',
    staffId: 'N001',
    role: 'Nurse',
    shift: 'Morning',
  },
  {
    name: 'Nurse Michael Brown',
    staffId: 'N002',
    role: 'Nurse',
    shift: 'Morning',
  },
  {
    name: 'Tech Robert Wilson',
    staffId: 'T001',
    role: 'Technician',
    shift: 'Morning',
  },

  // Evening Shift - 1 Doctor, 2 Nurses, 1 Technician
  {
    name: 'Dr. James Anderson',
    staffId: 'D002',
    role: 'Doctor',
    shift: 'Evening',
  },
  {
    name: 'Nurse Jessica Martinez',
    staffId: 'N003',
    role: 'Nurse',
    shift: 'Evening',
  },
  {
    name: 'Nurse David Taylor',
    staffId: 'N004',
    role: 'Nurse',
    shift: 'Evening',
  },
  {
    name: 'Tech Linda Garcia',
    staffId: 'T002',
    role: 'Technician',
    shift: 'Evening',
  },

  // Night Shift - 1 Doctor, 2 Nurses, 1 Technician
  {
    name: 'Dr. Patricia Thomas',
    staffId: 'D003',
    role: 'Doctor',
    shift: 'Night',
  },
  {
    name: 'Nurse Christopher Lee',
    staffId: 'N005',
    role: 'Nurse',
    shift: 'Night',
  },
  {
    name: 'Nurse Jennifer White',
    staffId: 'N006',
    role: 'Nurse',
    shift: 'Night',
  },
  {
    name: 'Tech Daniel Harris',
    staffId: 'T003',
    role: 'Technician',
    shift: 'Night',
  },
];

const seedStaff = async () => {
  try {
    // Clear existing staff data
    await Staff.deleteMany({});
    console.log('Existing staff data cleared');

    // Insert new staff data
    const staff = await Staff.insertMany(staffData);
    console.log(`${staff.length} staff members seeded successfully`);

    // Display seeded data
    console.log('\nSeeded Staff:');
    const shifts = ['Morning', 'Evening', 'Night'];
    for (const shift of shifts) {
      const shiftStaff = staff.filter(s => s.shift === shift);
      console.log(`\n${shift} Shift:`);
      shiftStaff.forEach(s => {
        console.log(`  - ${s.name} (${s.staffId}) - ${s.role}`);
      });
    }

    mongoose.connection.close();
  } catch (error) {
    console.error('Error seeding staff data:', error);
    mongoose.connection.close();
  }
};

seedStaff();
