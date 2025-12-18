const Shift = require('../models/Shift');
const Staff = require('../models/Staff');
const Leave = require('../models/Leave');

// @desc Add a new shift for a staff member on a specific date
// @route POST /api/shift
// @access Protected
const addShift = async (req, res) => {
  try {
    const { staffId, shiftDate, shiftType, startTime, endTime, notes } = req.body;
    const userId = req.user.id; // From auth middleware

    // Validation
    if (!staffId || !shiftDate || !shiftType || !startTime || !endTime) {
      return res.status(400).json({
        success: false,
        error: 'Please provide all required fields: staffId, shiftDate, shiftType, startTime, endTime',
      });
    }

    // Check if staff exists
    const staff = await Staff.findById(staffId);
    if (!staff) {
      return res.status(404).json({
        success: false,
        error: 'Staff member not found',
      });
    }

    // Validate shift type
    const validShiftTypes = ['Morning', 'Evening', 'Night'];
    if (!validShiftTypes.includes(shiftType)) {
      return res.status(400).json({
        success: false,
        error: `Shift type must be one of: ${validShiftTypes.join(', ')}`,
      });
    }

    // Validate time format (HH:mm)
    const timeRegex = /^([0-1][0-9]|2[0-3]):[0-5][0-9]$/;
    if (!timeRegex.test(startTime) || !timeRegex.test(endTime)) {
      return res.status(400).json({
        success: false,
        error: 'Time must be in HH:mm format (e.g., 06:00)',
      });
    }

    // Validate start time is before end time
    const [startHour, startMin] = startTime.split(':').map(Number);
    const [endHour, endMin] = endTime.split(':').map(Number);
    const startMinutes = startHour * 60 + startMin;
    const endMinutes = endHour * 60 + endMin;

    if (startMinutes >= endMinutes) {
      return res.status(400).json({
        success: false,
        error: 'Start time must be before end time',
      });
    }

    const shiftDateObj = new Date(shiftDate);

    // Check if staff has approved leave on this date
    const hasLeave = await Leave.findOne({
      staffId,
      status: 'Approved',
      startDate: { $lte: shiftDateObj },
      endDate: { $gte: shiftDateObj },
    });

    // Check for duplicate shift on same date (unique constraint)
    const existingShift = await Shift.findOne({
      staffId,
      shiftDate: {
        $gte: new Date(shiftDateObj.setHours(0, 0, 0, 0)),
        $lt: new Date(shiftDateObj.setHours(24, 0, 0, 0)),
      },
    });

    if (existingShift) {
      return res.status(400).json({
        success: false,
        error: 'A shift is already assigned to this staff member on this date',
      });
    }

    // Create new shift
    const shift = new Shift({
      staffId,
      shiftDate: shiftDateObj,
      shiftType,
      startTime,
      endTime,
      assignedBy: userId,
      notes,
      isLeaveDay: !!hasLeave,
    });

    await shift.save();

    const populatedShift = await Shift.findById(shift._id)
      .populate('staffId', 'name staffId role email')
      .populate('assignedBy', 'name email');

    res.status(201).json({
      success: true,
      message: 'Shift assigned successfully',
      data: populatedShift,
    });
  } catch (error) {
    console.error('Error adding shift:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Error adding shift',
    });
  }
};

// @desc Get all shifts with filtering
// @route GET /api/shift
// @access Protected
const getAllShifts = async (req, res) => {
  try {
    const { staffId, shiftDate, shiftType, startDate, endDate } = req.query;
    const filter = {};

    if (staffId) {
      filter.staffId = staffId;
    }
    if (shiftType) {
      filter.shiftType = shiftType;
    }

    // Single date filter
    if (shiftDate) {
      const dateObj = new Date(shiftDate);
      filter.shiftDate = {
        $gte: new Date(dateObj.setHours(0, 0, 0, 0)),
        $lt: new Date(dateObj.setHours(24, 0, 0, 0)),
      };
    }

    // Date range filter
    if (startDate || endDate) {
      filter.shiftDate = {};
      if (startDate) {
        filter.shiftDate.$gte = new Date(startDate);
      }
      if (endDate) {
        const endDateObj = new Date(endDate);
        filter.shiftDate.$lt = new Date(endDateObj.setHours(24, 0, 0, 0));
      }
    }

    const shifts = await Shift.find(filter)
      .populate('staffId', 'name staffId role email')
      .populate('assignedBy', 'name email')
      .sort({ shiftDate: 1, shiftType: 1 });

    res.status(200).json({
      success: true,
      count: shifts.length,
      data: shifts,
    });
  } catch (error) {
    console.error('Error fetching shifts:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Error fetching shifts',
    });
  }
};

// @desc Get shift by ID
// @route GET /api/shift/:id
// @access Protected
const getShiftById = async (req, res) => {
  try {
    const shift = await Shift.findById(req.params.id)
      .populate('staffId', 'name staffId role email')
      .populate('assignedBy', 'name email');

    if (!shift) {
      return res.status(404).json({
        success: false,
        error: 'Shift not found',
      });
    }

    res.status(200).json({
      success: true,
      data: shift,
    });
  } catch (error) {
    console.error('Error fetching shift:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Error fetching shift',
    });
  }
};

// @desc Get shifts for a specific staff member
// @route GET /api/shift/staff/:staffId
// @access Protected
const getStaffShifts = async (req, res) => {
  try {
    const { staffId } = req.params;
    const { startDate, endDate } = req.query;

    // Check if staff exists
    const staff = await Staff.findById(staffId);
    if (!staff) {
      return res.status(404).json({
        success: false,
        error: 'Staff member not found',
      });
    }

    const filter = { staffId };

    if (startDate || endDate) {
      filter.shiftDate = {};
      if (startDate) {
        filter.shiftDate.$gte = new Date(startDate);
      }
      if (endDate) {
        const endDateObj = new Date(endDate);
        filter.shiftDate.$lt = new Date(endDateObj.setHours(24, 0, 0, 0));
      }
    }

    const shifts = await Shift.find(filter)
      .populate('staffId', 'name staffId role email')
      .populate('assignedBy', 'name email')
      .sort({ shiftDate: 1 });

    res.status(200).json({
      success: true,
      count: shifts.length,
      data: shifts,
    });
  } catch (error) {
    console.error('Error fetching staff shifts:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Error fetching staff shifts',
    });
  }
};

// @desc Update a shift
// @route PUT /api/shift/:id
// @access Protected
const updateShift = async (req, res) => {
  try {
    const { id } = req.params;
    const { shiftType, startTime, endTime, notes } = req.body;

    const shift = await Shift.findById(id);

    if (!shift) {
      return res.status(404).json({
        success: false,
        error: 'Shift not found',
      });
    }

    // Validate shift type if provided
    if (shiftType) {
      const validShiftTypes = ['Morning', 'Evening', 'Night'];
      if (!validShiftTypes.includes(shiftType)) {
        return res.status(400).json({
          success: false,
          error: `Shift type must be one of: ${validShiftTypes.join(', ')}`,
        });
      }
      shift.shiftType = shiftType;
    }

    // Validate and update times if provided
    if (startTime || endTime) {
      const timeRegex = /^([0-1][0-9]|2[0-3]):[0-5][0-9]$/;
      if (startTime && !timeRegex.test(startTime)) {
        return res.status(400).json({
          success: false,
          error: 'Start time must be in HH:mm format',
        });
      }
      if (endTime && !timeRegex.test(endTime)) {
        return res.status(400).json({
          success: false,
          error: 'End time must be in HH:mm format',
        });
      }

      if (startTime && endTime) {
        const [startHour, startMin] = startTime.split(':').map(Number);
        const [endHour, endMin] = endTime.split(':').map(Number);
        const startMinutes = startHour * 60 + startMin;
        const endMinutes = endHour * 60 + endMin;

        if (startMinutes >= endMinutes) {
          return res.status(400).json({
            success: false,
            error: 'Start time must be before end time',
          });
        }
      }

      if (startTime) shift.startTime = startTime;
      if (endTime) shift.endTime = endTime;
    }

    if (notes) shift.notes = notes;

    await shift.save();

    const updatedShift = await Shift.findById(id)
      .populate('staffId', 'name staffId role email')
      .populate('assignedBy', 'name email');

    res.status(200).json({
      success: true,
      message: 'Shift updated successfully',
      data: updatedShift,
    });
  } catch (error) {
    console.error('Error updating shift:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Error updating shift',
    });
  }
};

// @desc Delete a shift
// @route DELETE /api/shift/:id
// @access Protected
const deleteShift = async (req, res) => {
  try {
    const { id } = req.params;

    const shift = await Shift.findById(id);

    if (!shift) {
      return res.status(404).json({
        success: false,
        error: 'Shift not found',
      });
    }

    // Check if shift date is in the past
    const shiftDateObj = new Date(shift.shiftDate);
    if (shiftDateObj < new Date(new Date().setHours(0, 0, 0, 0))) {
      return res.status(400).json({
        success: false,
        error: 'Cannot delete shifts for past dates',
      });
    }

    await Shift.findByIdAndDelete(id);

    res.status(200).json({
      success: true,
      message: 'Shift deleted successfully',
    });
  } catch (error) {
    console.error('Error deleting shift:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Error deleting shift',
    });
  }
};

// @desc Get shifts by date and type
// @route GET /api/shift/schedule/daily
// @access Protected
const getShiftsSchedule = async (req, res) => {
  try {
    const { date, shiftType } = req.query;
    const filter = {};

    if (!date) {
      return res.status(400).json({
        success: false,
        error: 'Date parameter is required',
      });
    }

    const dateObj = new Date(date);
    filter.shiftDate = {
      $gte: new Date(dateObj.setHours(0, 0, 0, 0)),
      $lt: new Date(dateObj.setHours(24, 0, 0, 0)),
    };

    if (shiftType) {
      filter.shiftType = shiftType;
    }

    const shifts = await Shift.find(filter)
      .populate('staffId', 'name staffId role email')
      .populate('assignedBy', 'name email')
      .sort({ shiftType: 1 });

    const groupedByShiftType = shifts.reduce((acc, shift) => {
      if (!acc[shift.shiftType]) {
        acc[shift.shiftType] = [];
      }
      acc[shift.shiftType].push(shift);
      return acc;
    }, {});

    res.status(200).json({
      success: true,
      date: date,
      totalStaffAssigned: shifts.length,
      schedule: groupedByShiftType,
    });
  } catch (error) {
    console.error('Error fetching shift schedule:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Error fetching shift schedule',
    });
  }
};

// @desc Get shift statistics
// @route GET /api/shift/stats/summary
// @access Protected
const getShiftStats = async (req, res) => {
  try {
    const { staffId, month, year, shiftType } = req.query;
    const filter = {};

    if (staffId) {
      filter.staffId = staffId;
    }
    if (shiftType) {
      filter.shiftType = shiftType;
    }

    if (month && year) {
      const startDate = new Date(year, month - 1, 1);
      const endDate = new Date(year, month, 0);
      filter.shiftDate = {
        $gte: startDate,
        $lte: endDate,
      };
    }

    const totalShifts = await Shift.countDocuments(filter);
    
    const shiftsByType = await Shift.aggregate([
      { $match: filter },
      { $group: { _id: '$shiftType', count: { $sum: 1 } } },
    ]);

    const onLeave = await Shift.countDocuments({ ...filter, isLeaveDay: true });

    res.status(200).json({
      success: true,
      data: {
        totalShifts,
        shiftsByType: shiftsByType.reduce((acc, item) => {
          acc[item._id] = item.count;
          return acc;
        }, {}),
        staffOnLeave: onLeave,
      },
    });
  } catch (error) {
    console.error('Error fetching shift stats:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Error fetching shift statistics',
    });
  }
};

module.exports = {
  addShift,
  getAllShifts,
  getShiftById,
  getStaffShifts,
  updateShift,
  deleteShift,
  getShiftsSchedule,
  getShiftStats,
};
