const Staff = require('../models/Staff');
const Attendance = require('../models/Attendance');

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

const createStaff = async (req, res) => {
  try {
    const { staffId, ...staffData } = req.body;
    const staff = await Staff.create(staffData);
    
    // Create attendance records for upcoming 7 days if user is authenticated
    if (req.user && req.user.id) {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      const attendanceRecords = [];
      for (let i = 0; i < 7; i++) {
        const date = new Date(today);
        date.setDate(today.getDate() + i);
        
        attendanceRecords.push({
          staffId: staff._id,
          date: date,
          shift: staff.shift,
          status: 'Absent',
          remarks: '',
          markedBy: req.user.id,
        });
      }
      
      // Insert attendance records for next 7 days
      await Attendance.insertMany(attendanceRecords);
    }
    
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

const updateStaff = async (req, res) => {
  try {
    const oldStaff = await Staff.findById(req.params.id);
    if (!oldStaff) {
      return res.status(404).json({ 
        success: false, 
        error: 'Staff not found' 
      });
    }

    const staff = await Staff.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });

    // If shift is being updated, update all future attendance records
    if (req.body.shift && req.body.shift !== oldStaff.shift) {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      await Attendance.updateMany(
        {
          staffId: staff._id,
          date: { $gte: today }
        },
        {
          shift: req.body.shift
        }
      );
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

const getWeeklyStats = async (req, res) => {
  try {
    // Support lookup by both _id and staffId
    let staff;
    if (req.params.staffId.match(/^[0-9a-fA-F]{24}$/)) {
      staff = await Staff.findById(req.params.staffId);
    } else {
      staff = await Staff.findOne({ staffId: req.params.staffId });
    }

    if (!staff) {
      return res.status(404).json({
        success: false,
        error: 'Staff not found'
      });
    }

    // Get current week (last 7 days)
    const endDate = new Date();
    endDate.setHours(23, 59, 59, 999);
    
    const startDate = new Date();
    startDate.setDate(endDate.getDate() - 6);
    startDate.setHours(0, 0, 0, 0);

    // Fetch attendance records for the week
    const attendanceRecords = await Attendance.find({
      staffId: staff._id,
      date: {
        $gte: startDate,
        $lte: endDate
      }
    }).sort({ date: 1 });

    // Calculate statistics
    const stats = {
      totalDays: 7,
      present: 0,
      absent: 0,
      leave: 0,
      halfDay: 0,
      notMarked: 0
    };

    attendanceRecords.forEach(record => {
      if (record.status === 'Present') stats.present++;
      else if (record.status === 'Absent') stats.absent++;
      else if (record.status === 'Leave') stats.leave++;
      else if (record.status === 'Half-Day') stats.halfDay++;
      else if (record.status === 'Not Marked') stats.notMarked++;
    });

    // Calculate attendance rate
    const markedDays = stats.present + stats.absent + stats.leave + stats.halfDay;
    const attendanceRate = markedDays > 0 ? ((stats.present / markedDays) * 100).toFixed(1) : '0.0';

    res.json({
      success: true,
      staff: {
        _id: staff._id,
        name: staff.name,
        staffId: staff.staffId,
        role: staff.role,
        shift: staff.shift
      },
      period: {
        startDate: startDate.toISOString().split('T')[0],
        endDate: endDate.toISOString().split('T')[0]
      },
      statistics: {
        ...stats,
        attendanceRate: `${attendanceRate}%`
      },
      records: attendanceRecords.map(record => ({
        date: record.date.toISOString().split('T')[0],
        shift: record.shift,
        status: record.status,
        remarks: record.remarks
      }))
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
  getWeeklyStats,
};
