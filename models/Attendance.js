const mongoose = require('mongoose');

const attendanceSchema = new mongoose.Schema({
  staffId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Staff',
    required: [true, 'Staff ID is required'],
  },
  date: {
    type: Date,
    required: [true, 'Date is required'],
  },
  shift: {
    type: String,
    required: [true, 'Shift is required'],
    trim: true,
  },
  status: {
    type: String,
    required: [true, 'Status is required'],
    enum: ['Present', 'Absent', 'Leave', 'Half-Day'],
    default: 'Absent',
  },
  remarks: {
    type: String,
    trim: true,
    maxlength: [200, 'Remarks cannot exceed 200 characters'],
  },
  markedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },
  markedAt: {
    type: Date,
    default: Date.now,
  },
}, {
  timestamps: true,
});

attendanceSchema.index({ staffId: 1, date: 1, shift: 1 }, { unique: true });

module.exports = mongoose.model('Attendance', attendanceSchema);
