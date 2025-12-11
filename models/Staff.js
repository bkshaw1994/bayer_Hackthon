const mongoose = require('mongoose');

const staffSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Please add a name'],
    trim: true,
  },
  staffId: {
    type: String,
    unique: true,
    trim: true,
  },
  email: {
    type: String,
    trim: true,
    lowercase: true,
  },
  role: {
    type: String,
    required: [true, 'Please add a role'],
    trim: true,
  },
  shift: {
    type: String,
    required: [true, 'Please add shift details'],
    trim: true,
  },
  date: {
    type: Date,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

staffSchema.pre('save', async function(next) {
  if (!this.staffId) {
    const rolePrefix = {
      'Doctor': 'D',
      'Nurse': 'N',
      'Technician': 'T',
      'Lab Technician': 'T'
    };

    const prefix = rolePrefix[this.role] || this.role.charAt(0).toUpperCase();
    
    const lastStaff = await this.constructor.findOne({
      staffId: new RegExp(`^${prefix}\\d+$`)
    }).sort({ staffId: -1 });

    let nextNumber = 1;
    if (lastStaff && lastStaff.staffId) {
      const lastNumber = parseInt(lastStaff.staffId.substring(prefix.length));
      nextNumber = lastNumber + 1;
    }

    this.staffId = `${prefix}${String(nextNumber).padStart(3, '0')}`;
  }
});

module.exports = mongoose.model('Staff', staffSchema);
