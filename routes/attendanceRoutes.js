const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const {
  markAttendance,
  markBulkAttendance,
  getAttendance,
  getAttendanceByStaff,
  updateAttendance,
  deleteAttendance,
} = require('../controllers/attendanceController');

// All routes require authentication
router.use(protect);

// Attendance routes
router.route('/')
  .get(getAttendance)
  .post(markAttendance);

router.post('/bulk', markBulkAttendance);

router.route('/:id')
  .put(updateAttendance)
  .delete(deleteAttendance);

router.get('/staff/:staffId', getAttendanceByStaff);

module.exports = router;
