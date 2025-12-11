const Staff = require('../models/Staff');
const Attendance = require('../models/Attendance');

// Helper function to check shift requirements
const checkShiftRequirements = (staffByShift) => {
  const requirements = {
    'Doctor': 1,
    'Nurse': 2,
    'Technician': 1,
  };

  const shiftStatus = {};

  for (const [shift, staffList] of Object.entries(staffByShift)) {
    const roleCounts = {};
    
    // Count staff by role for this shift
    staffList.forEach(staff => {
      const role = staff.role;
      roleCounts[role] = (roleCounts[role] || 0) + 1;
    });

    // Check requirements
    const doctorCount = roleCounts['Doctor'] || 0;
    const nurseCount = roleCounts['Nurse'] || 0;
    const technicianCount = roleCounts['Technician'] || roleCounts['Lab Technician'] || 0;

    const isFullyStaffed = 
      doctorCount >= requirements['Doctor'] &&
      nurseCount >= requirements['Nurse'] &&
      technicianCount >= requirements['Technician'];

    const shortages = [];
    const missingStaff = {};
    
    if (doctorCount < requirements['Doctor']) {
      const needed = requirements['Doctor'] - doctorCount;
      shortages.push({
        role: 'Doctor',
        required: requirements['Doctor'],
        current: doctorCount,
        needed: needed,
      });
      missingStaff['Doctor'] = needed;
    }
    if (nurseCount < requirements['Nurse']) {
      const needed = requirements['Nurse'] - nurseCount;
      shortages.push({
        role: 'Nurse',
        required: requirements['Nurse'],
        current: nurseCount,
        needed: needed,
      });
      missingStaff['Nurse'] = needed;
    }
    if (technicianCount < requirements['Technician']) {
      const needed = requirements['Technician'] - technicianCount;
      shortages.push({
        role: 'Technician',
        required: requirements['Technician'],
        current: technicianCount,
        needed: needed,
      });
      missingStaff['Technician'] = needed;
    }

    shiftStatus[shift] = {
      isFullyStaffed,
      staffCount: {
        Doctor: doctorCount,
        Nurse: nurseCount,
        Technician: technicianCount,
      },
      requirements: {
        Doctor: requirements['Doctor'],
        Nurse: requirements['Nurse'],
        Technician: requirements['Technician'],
      },
      shortages: shortages.length > 0 ? shortages : null,
      missingStaff: Object.keys(missingStaff).length > 0 ? missingStaff : null,
      message: isFullyStaffed ? 'Fully staffed' : 'Short staffed',
    };
  }

  return shiftStatus;
};

// @desc    Get all staff with shift requirements check
// @route   GET /api/staff?shift=Morning&date=2024-12-11 (shift and date filters are optional)
const getStaffs = async (req, res) => {
  try {
    // Build query filter
    const filter = {};
    if (req.query.shift) {
      filter.shift = req.query.shift;
    }
    
    const staff = await Staff.find(filter).select('name staffId role shift');
    
    // If date is provided, fetch attendance for that date
    let staffWithAttendance = staff;
    if (req.query.date) {
      const queryDate = new Date(req.query.date).setHours(0, 0, 0, 0);
      
      // Get attendance records for all staff for the specified date
      const staffIds = staff.map(s => s._id);
      const attendanceRecords = await Attendance.find({
        staffId: { $in: staffIds },
        date: queryDate,
      }).select('staffId status remarks');
      
      // Create a map of staffId to attendance
      const attendanceMap = {};
      attendanceRecords.forEach(record => {
        attendanceMap[record.staffId.toString()] = {
          status: record.status,
          remarks: record.remarks,
        };
      });
      
      // Attach attendance to staff
      staffWithAttendance = staff.map(member => {
        const staffObj = member.toObject();
        const attendance = attendanceMap[member._id.toString()];
        return {
          ...staffObj,
          attendanceStatus: attendance ? attendance.status : 'Not Marked',
          attendanceRemarks: attendance ? attendance.remarks : null,
        };
      });
    }
    
    // Group staff by shift
    const staffByShift = {};
    staff.forEach(member => {
      const shift = member.shift;
      if (!staffByShift[shift]) {
        staffByShift[shift] = [];
      }
      staffByShift[shift].push(member);
    });

    // Check requirements for each shift
    const shiftStatus = checkShiftRequirements(staffByShift);

    res.json({ 
      success: true, 
      count: staff.length,
      filter: { 
        shift: req.query.shift || null,
        date: req.query.date || null,
      },
      data: staffWithAttendance,
      shiftStatus,
    });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
};

// @desc    Get single staff member
// @route   GET /api/staff/:id?date=2024-12-11 (date filter is optional)
const getStaff = async (req, res) => {
  try {
    const staff = await Staff.findById(req.params.id);
    if (!staff) {
      return res.status(404).json({ 
        success: false, 
        error: 'Staff not found' 
      });
    }
    
    let staffData = staff.toObject();
    
    // If date is provided, fetch attendance for that date
    if (req.query.date) {
      const queryDate = new Date(req.query.date).setHours(0, 0, 0, 0);
      
      const attendance = await Attendance.findOne({
        staffId: staff._id,
        date: queryDate,
      }).select('status remarks markedAt markedBy');
      
      staffData.attendance = attendance ? {
        status: attendance.status,
        remarks: attendance.remarks,
        markedAt: attendance.markedAt,
      } : {
        status: 'Not Marked',
        remarks: null,
        markedAt: null,
      };
    }
    
    res.json({ 
      success: true, 
      data: staffData 
    });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
};

// @desc    Create new staff member
// @route   POST /api/staff
const createStaff = async (req, res) => {
  try {
    const staff = await Staff.create(req.body);
    res.status(201).json({ 
      success: true, 
      data: staff 
    });
  } catch (error) {
    res.status(400).json({ 
      success: false, 
      error: error.message 
    });
  }
};

// @desc    Update staff member
// @route   PUT /api/staff/:id
const updateStaff = async (req, res) => {
  try {
    const staff = await Staff.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });
    if (!staff) {
      return res.status(404).json({ 
        success: false, 
        error: 'Staff not found' 
      });
    }
    res.json({ 
      success: true, 
      data: staff 
    });
  } catch (error) {
    res.status(400).json({ 
      success: false, 
      error: error.message 
    });
  }
};

// @desc    Delete staff member
// @route   DELETE /api/staff/:id
const deleteStaff = async (req, res) => {
  try {
    const staff = await Staff.findByIdAndDelete(req.params.id);
    if (!staff) {
      return res.status(404).json({ 
        success: false, 
        error: 'Staff not found' 
      });
    }
    res.json({ 
      success: true, 
      data: {} 
    });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
};

module.exports = {
  getStaffs,
  getStaff,
  createStaff,
  updateStaff,
  deleteStaff,
};
