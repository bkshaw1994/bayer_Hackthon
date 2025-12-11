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
  quickMarkAttendance,
  applyLeave,
} = require('../controllers/attendanceController');

router.use(protect);

/**
 * @swagger
 * /api/attendance:
 *   get:
 *     summary: Get attendance records with filters
 *     tags: [Attendance]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: date
 *         schema:
 *           type: string
 *           format: date
 *         description: Filter by date (YYYY-MM-DD)
 *       - in: query
 *         name: shift
 *         schema:
 *           type: string
 *         description: Filter by shift
 *       - in: query
 *         name: staffId
 *         schema:
 *           type: string
 *         description: Filter by staff ID
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [Present, Absent, Leave, Half-Day]
 *         description: Filter by attendance status
 *     responses:
 *       200:
 *         description: List of attendance records with grouped data
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 count:
 *                   type: integer
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Attendance'
 *             example:
 *               success: true
 *               count: 4
 *               groupedData:
 *                 "2025-12-11":
 *                   Morning:
 *                     - staffId:
 *                         name: "Dr. Sarah Johnson"
 *                         staffId: "D001"
 *                         role: "Doctor"
 *                       status: "Present"
 *                       remarks: ""
 *                       markedAt: "2025-12-11T08:30:00.000Z"
 *               data:
 *                 - staffId:
 *                     name: "Dr. Sarah Johnson"
 *                     staffId: "D001"
 *                   date: "2025-12-11"
 *                   shift: "Morning"
 *                   status: "Present"
 *       401:
 *         description: Not authorized
 *   post:
 *     summary: Mark attendance for a staff member
 *     tags: [Attendance]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Attendance'
 *     responses:
 *       201:
 *         description: Attendance marked successfully
 *         content:
 *           application/json:
 *             example:
 *               success: true
 *               message: "Attendance marked successfully"
 *               data:
 *                 _id: "674b1234567890abcdef1234"
 *                 staffId: "674b1234567890abcdef5678"
 *                 date: "2025-12-11"
 *                 shift: "Morning"
 *                 status: "Present"
 *                 remarks: "On time"
 *       200:
 *         description: Attendance updated (if already exists)
 *         content:
 *           application/json:
 *             example:
 *               success: true
 *               message: "Attendance updated successfully"
 *       404:
 *         description: Staff not found
 *
 * /api/attendance/bulk:
 *   post:
 *     summary: Mark bulk attendance for multiple staff members
 *     tags: [Attendance]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               attendanceRecords:
 *                 type: array
 *                 items:
 *                   $ref: '#/components/schemas/Attendance'
 *     responses:
 *       201:
 *         description: Bulk attendance marked successfully
 *         content:
 *           application/json:
 *             example:
 *               success: true
 *               message: "Bulk attendance marked successfully"
 *               created: 5
 *               updated: 2
 *               failed: 0
 *       400:
 *         description: Invalid request
 *
 * /api/attendance/staff/{staffId}:
 *   get:
 *     summary: Get attendance history for specific staff
 *     tags: [Attendance]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: staffId
 *         required: true
 *         schema:
 *           type: string
 *         description: Staff ID
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date
 *         description: Start date for range
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date
 *         description: End date for range
 *     responses:
 *       200:
 *         description: Staff attendance history with statistics
 *         content:
 *           application/json:
 *             example:
 *               success: true
 *               staff:
 *                 name: "Dr. Sarah Johnson"
 *                 staffId: "D001"
 *                 role: "Doctor"
 *                 shift: "Morning"
 *               statistics:
 *                 totalDays: 7
 *                 present: 6
 *                 absent: 0
 *                 leave: 1
 *                 halfDay: 0
 *                 attendanceRate: "85.7%"
 *               data:
 *                 - date: "2025-12-11"
 *                   shift: "Morning"
 *                   status: "Present"
 *                   remarks: ""
 *       404:
 *         description: Staff not found
 *
 * /api/attendance/{id}:
 *   put:
 *     summary: Update attendance record
 *     tags: [Attendance]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Attendance record ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               status:
 *                 type: string
 *                 enum: [Present, Absent, Leave, Half-Day]
 *               remarks:
 *                 type: string
 *     responses:
 *       200:
 *         description: Attendance updated successfully
 *         content:
 *           application/json:
 *             example:
 *               success: true
 *               message: "Attendance updated successfully"
 *               data:
 *                 _id: "674b1234567890abcdef1234"
 *                 status: "Leave"
 *                 remarks: "Sick leave"
 *       404:
 *         description: Attendance record not found
 *   delete:
 *     summary: Delete attendance record
 *     tags: [Attendance]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Attendance record ID
 *     responses:
 *       200:
 *         description: Attendance deleted successfully
 *         content:
 *           application/json:
 *             example:
 *               success: true
 *               message: "Attendance record deleted"
 *       404:
 *         description: Attendance record not found
 */

/**
 * @swagger
 * /api/attendance/mark:
 *   post:
 *     summary: Quick mark attendance as Present
 *     description: Marks a staff member's attendance as Present for a specific date. Supports both MongoDB ObjectId and staffId.
 *     tags: [Attendance]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - staffId
 *               - date
 *             properties:
 *               staffId:
 *                 type: string
 *                 description: Staff MongoDB _id or staffId (e.g., "D001")
 *               date:
 *                 type: string
 *                 format: date
 *                 description: Date for attendance (YYYY-MM-DD)
 *               remarks:
 *                 type: string
 *                 description: Optional remarks
 *           example:
 *             staffId: "D001"
 *             date: "2025-12-12"
 *             remarks: "On time"
 *     responses:
 *       201:
 *         description: Attendance marked successfully
 *         content:
 *           application/json:
 *             example:
 *               success: true
 *               message: "Attendance marked as Present"
 *               data:
 *                 _id: "674b1234567890abcdef1234"
 *                 staffId: "674b1234567890abcdef5678"
 *                 date: "2025-12-12"
 *                 shift: "Morning"
 *                 status: "Present"
 *                 remarks: "On time"
 *       404:
 *         description: Staff not found
 *
 * /api/attendance/leave:
 *   post:
 *     summary: Apply leave for a staff member
 *     description: Marks a staff member's attendance as Leave for a specific date. Supports both MongoDB ObjectId and staffId.
 *     tags: [Attendance]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - staffId
 *               - date
 *             properties:
 *               staffId:
 *                 type: string
 *                 description: Staff MongoDB _id or staffId (e.g., "D001")
 *               date:
 *                 type: string
 *                 format: date
 *                 description: Date for leave (YYYY-MM-DD)
 *               remarks:
 *                 type: string
 *                 description: Reason for leave
 *           example:
 *             staffId: "D001"
 *             date: "2025-12-12"
 *             remarks: "Sick leave"
 *     responses:
 *       201:
 *         description: Leave applied successfully
 *         content:
 *           application/json:
 *             example:
 *               success: true
 *               message: "Leave applied successfully"
 *               data:
 *                 _id: "674b1234567890abcdef1234"
 *                 staffId: "674b1234567890abcdef5678"
 *                 date: "2025-12-12"
 *                 shift: "Morning"
 *                 status: "Leave"
 *                 remarks: "Sick leave"
 *       404:
 *         description: Staff not found
 */

router.get('/', getAttendance);
router.post('/', markAttendance);

router.post('/bulk', markBulkAttendance);
router.post('/mark', quickMarkAttendance);
router.post('/leave', applyLeave);

router.put('/:id', updateAttendance);
router.delete('/:id', deleteAttendance);

router.get('/staff/:staffId', getAttendanceByStaff);

module.exports = router;
