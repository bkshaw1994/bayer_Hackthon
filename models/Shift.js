const mongoose = require('mongoose');

const shiftSchema = new mongoose.Schema({
  staffId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Staff',
    required: [true, 'Staff ID is required'],
  },
  shiftDate: {
    type: Date,
    required: [true, 'Shift date is required'],
  },
  shiftType: {
    type: String,
    enum: ['Morning', 'Evening', 'Night'],
    required: [true, 'Shift type is required'],
  },
  startTime: {
    type: String,
    required: [true, 'Start time is required'],
    // Format: HH:mm (e.g., "06:00")
  },
  endTime: {
    type: String,
    required: [true, 'End time is required'],
    // Format: HH:mm (e.g., "14:00")
  },
  assignedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Assigned by user is required'],
  },
  notes: {
    type: String,
    maxlength: [300, 'Notes cannot exceed 300 characters'],
  },
  isLeaveDay: {
    type: Boolean,
    default: false,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
}, {
  timestamps: true,
});

// Index for efficient queries
shiftSchema.index({ staffId: 1, shiftDate: 1 }, { unique: true });
shiftSchema.index({ shiftDate: 1, shiftType: 1 });
shiftSchema.index({ staffId: 1, shiftDate: 1, shiftType: 1 });

module.exports = mongoose.model('Shift', shiftSchema);
