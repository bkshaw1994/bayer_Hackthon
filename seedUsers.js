const mongoose = require('mongoose');
const User = require('./models/User');
require('dotenv').config();

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI);

const users = [
  {
    name: 'John Doe',
    userName: 'john_doe',
    email: 'john@example.com',
    password: 'password123',
  },
  {
    name: 'Jane Smith',
    userName: 'jane_smith',
    email: 'jane@example.com',
    password: 'demo1234',
  },
];

const seedUsers = async () => {
  try {
    // Clear existing users
    await User.deleteMany({});
    console.log('Existing users cleared');

    // Insert new users (passwords will be hashed by the pre-save hook)
    const createdUsers = await User.create(users);
    console.log(`${createdUsers.length} users seeded successfully`);

    console.log('\nSeeded Users:');
    createdUsers.forEach(user => {
      console.log(`  - ${user.name} (${user.userName})`);
    });

    mongoose.connection.close();
  } catch (error) {
    console.error('Error seeding users:', error);
    mongoose.connection.close();
  }
};

seedUsers();
