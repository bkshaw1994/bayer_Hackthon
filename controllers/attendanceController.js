const Attendance = require('../models/Attendance');
const Staff = require('../models/Staff');

const markAttendance = async (req, res) => {
  try {
    const { staffId, date, shift, status, remarks } = req.body;

    // Validate staff exists
    const staff = await Staff.findById(staffId);
    if (!staff) {
      return res.status(404).json({ 
        success: false, 
        message: 'Staff not found' 
      });
    }

    // Check if attendance already marked for this date and shift
    const existingAttendance = await Attendance.findOne({ 
      staffId, 
      date: new Date(date).setHours(0, 0, 0, 0), 
      shift 
    });

    if (existingAttendance) {
      // Update existing attendance
      existingAttendance.status = status;
      existingAttendance.remarks = remarks;
      existingAttendance.markedBy = req.user.id;
      existingAttendance.markedAt = Date.now();
      
      await existingAttendance.save();
      
      return res.json({ 
        success: true, 
        message: 'Attendance updated successfully',
        data: existingAttendance 
      });
    }

    // Create new attendance record
    const attendance = await Attendance.create({
      staffId,
      date: new Date(date).setHours(0, 0, 0, 0),
      shift,
      status,
      remarks,
      markedBy: req.user.id,
    });

    res.status(201).json({ 
      success: true, 
      message: 'Attendance marked successfully',
      data: attendance 
    });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      message: error.message 
    });
  }
};

const markBulkAttendance = async (req, res) => {
  try {
    const { attendanceRecords } = req.body; // Array of { staffId, date, shift, status, remarks }

    if (!Array.isArray(attendanceRecords) || attendanceRecords.length === 0) {
      return res.status(400).json({ 
        success: false, 
        message: 'attendanceRecords array is required' 
      });
    }

    const results = [];
    const errors = [];

    for (const record of attendanceRecords) {
      try {
        const { staffId, date, shift, status, remarks } = record;

        // Check if already exists
        const existing = await Attendance.findOne({ 
          staffId, 
          date: new Date(date).setHours(0, 0, 0, 0), 
          shift 
        });

        if (existing) {
          existing.status = status;
          existing.remarks = remarks;
          existing.markedBy = req.user.id;
          existing.markedAt = Date.now();
          await existing.save();
          results.push(existing);
        } else {
          const attendance = await Attendance.create({
            staffId,
            date: new Date(date).setHours(0, 0, 0, 0),
            shift,
            status,
            remarks,
            markedBy: req.user.id,
          });
          results.push(attendance);
        }
      } catch (error) {
        errors.push({ 
          staffId: record.staffId, 
          error: error.message 
        });
      }
    }

    res.status(201).json({ 
      success: true, 
      message: `Attendance marked for ${results.length} staff members`,
      data: results,
      errors: errors.length > 0 ? errors : null,
    });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      message: error.message 
    });
  }
};

const getAttendance = async (req, res) => {
  try {
    const { date, shift, staffId, status } = req.query;

    // Build filter
    const filter = {};
    
    if (date) {
      filter.date = new Date(date).setHours(0, 0, 0, 0);
    }
    
    if (shift) {
      filter.shift = shift;
    }
    
    if (staffId) {
      filter.staffId = staffId;
    }
    
    if (status) {
      filter.status = status;
    }

    const attendance = await Attendance.find(filter)
      .populate('staffId', 'name staffId role shift')
      .populate('markedBy', 'name userName')
      .sort({ date: -1, shift: 1 });

    // Group by date and shift for better FE consumption
    const groupedData = {};
    attendance.forEach(record => {
      const dateKey = record.date.toISOString().split('T')[0];
      const shiftKey = record.shift;
      const key = `${dateKey}_${shiftKey}`;
      
      if (!groupedData[key]) {
        groupedData[key] = {
          date: dateKey,
          shift: shiftKey,
          records: [],
          summary: {
            total: 0,
            present: 0,
            absent: 0,
            leave: 0,
            halfDay: 0,
          },
        };
      }
      
      groupedData[key].records.push(record);
      groupedData[key].summary.total++;
      groupedData[key].summary[record.status.toLowerCase().replace('-', '')] = 
        (groupedData[key].summary[record.status.toLowerCase().replace('-', '')] || 0) + 1;
    });

    res.json({ 
      success: true, 
      count: attendance.length,
      filter: { date, shift, staffId, status },
      data: attendance,
      grouped: Object.values(groupedData),
    });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      message: error.message 
    });
  }
};

const getAttendanceByStaff = async (req, res) => {
  try {
    const { staffId } = req.params;
    const { startDate, endDate } = req.query;

    // Validate staff exists
    const staff = await Staff.findById(staffId);
    if (!staff) {
      return res.status(404).json({ 
        success: false, 
        message: 'Staff not found' 
      });
    }

    const filter = { staffId };
    
    if (startDate || endDate) {
      filter.date = {};
      if (startDate) {
        filter.date.$gte = new Date(startDate).setHours(0, 0, 0, 0);
      }
      if (endDate) {
        filter.date.$lte = new Date(endDate).setHours(23, 59, 59, 999);
      }
    }

    const attendance = await Attendance.find(filter)
      .populate('markedBy', 'name userName')
      .sort({ date: -1 });

    // Calculate statistics
    const stats = {
      total: attendance.length,
      present: attendance.filter(a => a.status === 'Present').length,
      absent: attendance.filter(a => a.status === 'Absent').length,
      leave: attendance.filter(a => a.status === 'Leave').length,
      halfDay: attendance.filter(a => a.status === 'Half-Day').length,
    };

    res.json({ 
      success: true, 
      staff: {
        id: staff._id,
        name: staff.name,
        staffId: staff.staffId,
        role: staff.role,
        shift: staff.shift,
      },
      statistics: stats,
      data: attendance,
    });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      message: error.message 
    });
  }
};

const updateAttendance = async (req, res) => {
  try {
    const { status, remarks } = req.body;

    const attendance = await Attendance.findById(req.params.id);
    
    if (!attendance) {
      return res.status(404).json({ 
        success: false, 
        message: 'Attendance record not found' 
      });
    }

    if (status) attendance.status = status;
    if (remarks !== undefined) attendance.remarks = remarks;
    attendance.markedBy = req.user.id;
    attendance.markedAt = Date.now();

    await attendance.save();

    res.json({ 
      success: true, 
      message: 'Attendance updated successfully',
      data: attendance 
    });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      message: error.message 
    });
  }
};

const deleteAttendance = async (req, res) => {
  try {
    const attendance = await Attendance.findById(req.params.id);
    
    if (!attendance) {
      return res.status(404).json({ 
        success: false, 
        message: 'Attendance record not found' 
      });
    }

    await attendance.deleteOne();

    res.json({ 
      success: true, 
      message: 'Attendance record deleted successfully' 
    });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      message: error.message 
    });
  }
};

const quickMarkAttendance = async (req, res) => {
  try {
    const { staffId, date } = req.body;

    if (!staffId || !date) {
      return res.status(400).json({
        success: false,
        message: 'staffId and date are required'
      });
    }

    // Support lookup by both _id and staffId
    let staff;
    if (staffId.match(/^[0-9a-fA-F]{24}$/)) {
      staff = await Staff.findById(staffId);
    } else {
      staff = await Staff.findOne({ staffId: staffId });
    }

    if (!staff) {
      return res.status(404).json({
        success: false,
        message: 'Staff not found'
      });
    }

    const attendanceDate = new Date(date);
    attendanceDate.setHours(0, 0, 0, 0);

    // Check if attendance already exists
    const existingAttendance = await Attendance.findOne({
      staffId: staff._id,
      date: attendanceDate,
      shift: staff.shift
    });

    if (existingAttendance) {
      existingAttendance.status = 'Present';
      existingAttendance.remarks = req.body.remarks || '';
      existingAttendance.markedBy = req.user.id;
      existingAttendance.markedAt = Date.now();
      await existingAttendance.save();

      return res.json({
        success: true,
        message: 'Attendance marked as Present',
        data: existingAttendance
      });
    }

    // Create new attendance record
    const attendance = await Attendance.create({
      staffId: staff._id,
      date: attendanceDate,
      shift: staff.shift,
      status: 'Present',
      remarks: req.body.remarks || '',
      markedBy: req.user.id,
    });

    res.status(201).json({
      success: true,
      message: 'Attendance marked as Present',
      data: attendance
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

const applyLeave = async (req, res) => {
  try {
    const { staffId, date, remarks } = req.body;

    if (!staffId || !date) {
      return res.status(400).json({
        success: false,
        message: 'staffId and date are required'
      });
    }

    // Support lookup by both _id and staffId
    let staff;
    if (staffId.match(/^[0-9a-fA-F]{24}$/)) {
      staff = await Staff.findById(staffId);
    } else {
      staff = await Staff.findOne({ staffId: staffId });
    }

    if (!staff) {
      return res.status(404).json({
        success: false,
        message: 'Staff not found'
      });
    }

    const attendanceDate = new Date(date);
    attendanceDate.setHours(0, 0, 0, 0);

    // Check if attendance already exists
    const existingAttendance = await Attendance.findOne({
      staffId: staff._id,
      date: attendanceDate,
      shift: staff.shift
    });

    if (existingAttendance) {
      existingAttendance.status = 'Leave';
      existingAttendance.remarks = remarks || 'Leave applied';
      existingAttendance.markedBy = req.user.id;
      existingAttendance.markedAt = Date.now();
      await existingAttendance.save();

      return res.json({
        success: true,
        message: 'Leave applied successfully',
        data: existingAttendance
      });
    }

    // Create new attendance record with Leave status
    const attendance = await Attendance.create({
      staffId: staff._id,
      date: attendanceDate,
      shift: staff.shift,
      status: 'Leave',
      remarks: remarks || 'Leave applied',
      markedBy: req.user.id,
    });

    res.status(201).json({
      success: true,
      message: 'Leave applied successfully',
      data: attendance
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

module.exports = {
  markAttendance,
  markBulkAttendance,
  getAttendance,
  getAttendanceByStaff,
  updateAttendance,
  deleteAttendance,
  quickMarkAttendance,
  applyLeave,
};
