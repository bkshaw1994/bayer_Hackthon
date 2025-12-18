const Leave = require('../models/Leave');
const Staff = require('../models/Staff');
const Attendance = require('../models/Attendance');

// @desc Apply for leave
// @route POST /api/leave/apply
// @access Protected
const applyLeave = async (req, res) => {
  try {
    const { staffId, leaveType, startDate, endDate, reason } = req.body;

    // Validation
    if (!staffId || !leaveType || !startDate || !endDate || !reason) {
      return res.status(400).json({
        success: false,
        error: 'Please provide all required fields: staffId, leaveType, startDate, endDate, reason',
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

    // Validate dates
    const start = new Date(startDate);
    const end = new Date(endDate);

    if (start > end) {
      return res.status(400).json({
        success: false,
        error: 'Start date cannot be after end date',
      });
    }

    if (start < new Date(new Date().setHours(0, 0, 0, 0))) {
      return res.status(400).json({
        success: false,
        error: 'Cannot apply leave for past dates',
      });
    }

    // Check for overlapping leaves
    const overlappingLeave = await Leave.findOne({
      staffId,
      status: { $in: ['Pending', 'Approved'] },
      $or: [
        { startDate: { $lte: end }, endDate: { $gte: start } },
      ],
    });

    if (overlappingLeave) {
      return res.status(400).json({
        success: false,
        error: 'Leave application overlaps with existing leave request',
      });
    }

    // Create new leave record
    const leave = new Leave({
      staffId,
      leaveType,
      startDate: start,
      endDate: end,
      reason,
      status: 'Pending',
    });

    await leave.save();

    const populatedLeave = await Leave.findById(leave._id)
      .populate('staffId', 'name staffId role')
      .populate('approvedBy', 'name email');

    res.status(201).json({
      success: true,
      message: 'Leave application submitted successfully',
      data: populatedLeave,
    });
  } catch (error) {
    console.error('Error applying leave:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Error applying leave',
    });
  }
};

// @desc Get all leave applications
// @route GET /api/leave
// @access Protected
const getAllLeaves = async (req, res) => {
  try {
    const { staffId, status, leaveType, startDate, endDate } = req.query;
    const filter = {};

    if (staffId) {
      filter.staffId = staffId;
    }
    if (status) {
      filter.status = status;
    }
    if (leaveType) {
      filter.leaveType = leaveType;
    }

    // Date range filter
    if (startDate || endDate) {
      filter.startDate = {};
      if (startDate) {
        filter.startDate.$gte = new Date(startDate);
      }
      if (endDate) {
        filter.endDate = filter.endDate || {};
        filter.endDate.$lte = new Date(endDate);
      }
    }

    const leaves = await Leave.find(filter)
      .populate('staffId', 'name staffId role email')
      .populate('approvedBy', 'name email')
      .sort('-createdAt');

    res.status(200).json({
      success: true,
      count: leaves.length,
      data: leaves,
    });
  } catch (error) {
    console.error('Error fetching leaves:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Error fetching leave applications',
    });
  }
};

// @desc Get leave by ID
// @route GET /api/leave/:id
// @access Protected
const getLeaveById = async (req, res) => {
  try {
    const leave = await Leave.findById(req.params.id)
      .populate('staffId', 'name staffId role email')
      .populate('approvedBy', 'name email');

    if (!leave) {
      return res.status(404).json({
        success: false,
        error: 'Leave record not found',
      });
    }

    res.status(200).json({
      success: true,
      data: leave,
    });
  } catch (error) {
    console.error('Error fetching leave:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Error fetching leave record',
    });
  }
};

// @desc Get leaves for a specific staff member
// @route GET /api/leave/staff/:staffId
// @access Protected
const getStaffLeaves = async (req, res) => {
  try {
    const { staffId } = req.params;

    // Check if staff exists
    const staff = await Staff.findById(staffId);
    if (!staff) {
      return res.status(404).json({
        success: false,
        error: 'Staff member not found',
      });
    }

    const leaves = await Leave.find({ staffId })
      .populate('staffId', 'name staffId role email')
      .populate('approvedBy', 'name email')
      .sort('-createdAt');

    res.status(200).json({
      success: true,
      count: leaves.length,
      data: leaves,
    });
  } catch (error) {
    console.error('Error fetching staff leaves:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Error fetching leave records',
    });
  }
};

// @desc Approve leave
// @route PUT /api/leave/:id/approve
// @access Protected (Admin/Manager only)
const approveLeave = async (req, res) => {
  try {
    const { id } = req.params;
    const { remarks } = req.body;
    const userId = req.user.id; // From auth middleware

    const leave = await Leave.findById(id);

    if (!leave) {
      return res.status(404).json({
        success: false,
        error: 'Leave record not found',
      });
    }

    if (leave.status !== 'Pending') {
      return res.status(400).json({
        success: false,
        error: `Cannot approve a ${leave.status.toLowerCase()} leave request`,
      });
    }

    leave.status = 'Approved';
    leave.approvedBy = userId;
    leave.approvalDate = new Date();
    if (remarks) leave.remarks = remarks;

    await leave.save();

    const updatedLeave = await Leave.findById(id)
      .populate('staffId', 'name staffId role email')
      .populate('approvedBy', 'name email');

    res.status(200).json({
      success: true,
      message: 'Leave approved successfully',
      data: updatedLeave,
    });
  } catch (error) {
    console.error('Error approving leave:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Error approving leave',
    });
  }
};

// @desc Reject leave
// @route PUT /api/leave/:id/reject
// @access Protected (Admin/Manager only)
const rejectLeave = async (req, res) => {
  try {
    const { id } = req.params;
    const { remarks } = req.body;
    const userId = req.user.id; // From auth middleware

    const leave = await Leave.findById(id);

    if (!leave) {
      return res.status(404).json({
        success: false,
        error: 'Leave record not found',
      });
    }

    if (leave.status !== 'Pending') {
      return res.status(400).json({
        success: false,
        error: `Cannot reject a ${leave.status.toLowerCase()} leave request`,
      });
    }

    leave.status = 'Rejected';
    leave.approvedBy = userId;
    leave.approvalDate = new Date();
    if (remarks) leave.remarks = remarks;

    await leave.save();

    const updatedLeave = await Leave.findById(id)
      .populate('staffId', 'name staffId role email')
      .populate('approvedBy', 'name email');

    res.status(200).json({
      success: true,
      message: 'Leave rejected successfully',
      data: updatedLeave,
    });
  } catch (error) {
    console.error('Error rejecting leave:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Error rejecting leave',
    });
  }
};

// @desc Cancel leave
// @route PUT /api/leave/:id/cancel
// @access Protected
const cancelLeave = async (req, res) => {
  try {
    const { id } = req.params;
    const leave = await Leave.findById(id);

    if (!leave) {
      return res.status(404).json({
        success: false,
        error: 'Leave record not found',
      });
    }

    if (leave.status === 'Cancelled') {
      return res.status(400).json({
        success: false,
        error: 'Leave is already cancelled',
      });
    }

    if (leave.startDate < new Date()) {
      return res.status(400).json({
        success: false,
        error: 'Cannot cancel leave that has already started',
      });
    }

    leave.status = 'Cancelled';
    await leave.save();

    const updatedLeave = await Leave.findById(id)
      .populate('staffId', 'name staffId role email')
      .populate('approvedBy', 'name email');

    res.status(200).json({
      success: true,
      message: 'Leave cancelled successfully',
      data: updatedLeave,
    });
  } catch (error) {
    console.error('Error cancelling leave:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Error cancelling leave',
    });
  }
};

// @desc Get leave statistics
// @route GET /api/leave/stats/summary
// @access Protected
const getLeaveStats = async (req, res) => {
  try {
    const { staffId, month, year } = req.query;
    const filter = {};

    if (staffId) {
      filter.staffId = staffId;
    }

    if (month && year) {
      const startDate = new Date(year, month - 1, 1);
      const endDate = new Date(year, month, 0);
      filter.startDate = { $gte: startDate };
      filter.endDate = { $lte: endDate };
    }

    const totalLeaves = await Leave.countDocuments(filter);
    const approvedLeaves = await Leave.countDocuments({ ...filter, status: 'Approved' });
    const pendingLeaves = await Leave.countDocuments({ ...filter, status: 'Pending' });
    const rejectedLeaves = await Leave.countDocuments({ ...filter, status: 'Rejected' });

    const totalDays = await Leave.aggregate([
      { $match: { ...filter, status: 'Approved' } },
      { $group: { _id: null, totalDays: { $sum: '$numberOfDays' } } },
    ]);

    res.status(200).json({
      success: true,
      data: {
        totalLeaves,
        approvedLeaves,
        pendingLeaves,
        rejectedLeaves,
        totalApprovedDays: totalDays[0]?.totalDays || 0,
      },
    });
  } catch (error) {
    console.error('Error fetching leave stats:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Error fetching leave statistics',
    });
  }
};

module.exports = {
  applyLeave,
  getAllLeaves,
  getLeaveById,
  getStaffLeaves,
  approveLeave,
  rejectLeave,
  cancelLeave,
  getLeaveStats,
};
