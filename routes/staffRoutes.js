const express = require('express');
const router = express.Router();
const {
  getStaffs,
  getStaff,
  createStaff,
  updateStaff,
  deleteStaff,
  getWeeklyStats,
} = require('../controllers/staffController');
const { protect } = require('../middleware/auth');

/**
 * @swagger
 * /api/staff:
 *   get:
 *     summary: Get all staff with shift requirements check
 *     tags: [Staff]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: shift
 *         schema:
 *           type: string
 *         description: Filter by shift (Morning, Evening, Night)
 *       - in: query
 *         name: date
 *         schema:
 *           type: string
 *           format: date
 *         description: Get attendance status for specific date (YYYY-MM-DD)
 *     responses:
 *       200:
 *         description: List of staff with shift status and optional attendance
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 count:
 *                   type: integer
 *                 staffing:
 *                   type: object
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Staff'
 *             examples:
 *               withAttendance:
 *                 summary: With date parameter - includes attendance status
 *                 value:
 *                   success: true
 *                   count: 4
 *                   staffing:
 *                     Morning:
 *                       isFullyStaffed: true
 *                       staffCount: { Doctor: 1, Nurse: 2, Technician: 1 }
 *                       requirements: { Doctor: 1, Nurse: 2, Technician: 1 }
 *                       shortages: null
 *                       missingStaff: null
 *                       message: "Fully staffed"
 *                   data:
 *                     - name: "Dr. Smith"
 *                       staffId: "D001"
 *                       email: "dr.smith@hospital.com"
 *                       role: "Doctor"
 *                       shift: "Morning"
 *                       date: "2025-12-12"
 *                       attendanceStatus: "Present"
 *                       attendanceRemarks: "On time"
 *                     - name: "Nurse Johnson"
 *                       staffId: "N001"
 *                       email: "nurse.johnson@hospital.com"
 *                       role: "Nurse"
 *                       shift: "Morning"
 *                       date: "2025-12-12"
 *                       attendanceStatus: "Not Marked"
 *               shortStaffed:
 *                 summary: Short staffed shift with missing staff count
 *                 value:
 *                   success: true
 *                   count: 2
 *                   staffing:
 *                     Evening:
 *                       isFullyStaffed: false
 *                       staffCount: { Doctor: 0, Nurse: 1, Technician: 1 }
 *                       requirements: { Doctor: 1, Nurse: 2, Technician: 1 }
 *                       shortages:
 *                         - role: "Doctor"
 *                           required: 1
 *                           current: 0
 *                           needed: 1
 *                         - role: "Nurse"
 *                           required: 2
 *                           current: 1
 *                           needed: 1
 *                       missingStaff: { Doctor: 1, Nurse: 1 }
 *                       message: "Short staffed"
 *                   data:
 *                     - name: "Nurse Johnson"
 *                       staffId: "N003"
 *                       email: "nurse.johnson@hospital.com"
 *                       role: "Nurse"
 *                       shift: "Evening"
 *                       date: "2025-12-12"
 *                     - name: "Tech Wilson"
 *                       staffId: "T002"
 *                       email: "tech.wilson@hospital.com"
 *                       role: "Technician"
 *                       shift: "Evening"
 *                       date: "2025-12-12"
 *               withoutDate:
 *                 summary: Without date parameter - no attendance data
 *                 value:
 *                   success: true
 *                   count: 4
 *                   staffing:
 *                     Morning:
 *                       isFullyStaffed: true
 *                       staffCount: { Doctor: 1, Nurse: 2, Technician: 1 }
 *                       requirements: { Doctor: 1, Nurse: 2, Technician: 1 }
 *                       shortages: null
 *                       missingStaff: null
 *                       message: "Fully staffed"
 *                   data:
 *                     - name: "Dr. Smith"
 *                       staffId: "D001"
 *                       email: "dr.smith@hospital.com"
 *                       role: "Doctor"
 *                       shift: "Morning"
 *                       date: "2025-12-12"
 *       401:
 *         description: Not authorized
 *   post:
 *     summary: Create new staff member
 *     description: Creates a new staff member with auto-generated staffId and automatically generates attendance records with "Not Marked" status for the next 7 days with their assigned shift. StaffId format - Doctor:D001, Nurse:N001, Technician:T001
 *     tags: [Staff]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - role
 *               - shift
 *             properties:
 *               name:
 *                 type: string
 *               email:
 *                 type: string
 *               role:
 *                 type: string
 *               shift:
 *                 type: string
 *               date:
 *                 type: string
 *                 format: date
 *           example:
 *             name: \"Bishal\"
 *             email: \"bishal@example.com\"
 *             role: \"Technician\"
 *             shift: \"Afternoon\"
 *             date: \"2025-12-12\"
 *     responses:
 *       201:
 *         description: Staff created successfully
 *         content:
 *           application/json:
 *             example:
 *               success: true
 *               data:
 *                 _id: \"674b1234567890abcdef9999\"
 *                 name: "Bishal"
 *                 staffId: "T001"
 *                 email: "bishal@example.com"
 *                 role: "Technician"
 *                 shift: "Afternoon"
 *                 date: "2025-12-12"
 *       400:
 *         description: Validation error
 *         content:
 *           application/json:
 *             example:
 *               success: false
 *               error: \"Staff with this ID already exists\"
 */
router.get('/', protect, getStaffs);
router.post('/', protect, createStaff);

/**
 * @swagger
 * /api/staff/{id}:
 *   get:
 *     summary: Get staff by ID
 *     tags: [Staff]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Staff ID
 *       - in: query
 *         name: date
 *         schema:
 *           type: string
 *           format: date
 *         description: Get attendance status for specific date (YYYY-MM-DD)
 *     responses:
 *       200:
 *         description: Staff details with optional attendance
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/Staff'
 *             examples:
 *               withAttendance:
 *                 summary: With date parameter - includes attendance object
 *                 value:
 *                   success: true
 *                   data:
 *                     name: "Dr. Smith"
 *                     staffId: "D001"
 *                     email: "dr.smith@hospital.com"
 *                     role: "Doctor"
 *                     shift: "Morning"
 *                     date: "2025-12-12"
 *                     attendance:
 *                       status: "Present"
 *                       remarks: "On time"
 *                       markedAt: "2024-12-11T08:30:00.000Z"
 *               notMarked:
 *                 summary: With date parameter - attendance not marked
 *                 value:
 *                   success: true
 *                   data:
 *                     name: "Dr. Smith"
 *                     staffId: "D001"
 *                     email: "dr.smith@hospital.com"
 *                     role: "Doctor"
 *                     shift: "Morning"
 *                     date: "2025-12-12"
 *                     attendance:
 *                       status: "Not Marked"
 *       404:
 *         description: Staff not found
 *   put:
 *     summary: Update staff member
 *     description: Update staff member details. If shift is changed, all future attendance records will be automatically updated with the new shift.
 *     tags: [Staff]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Staff'
 *           example:
 *             name: "Dr. John Smith Updated"
 *             email: "john.updated@hospital.com"
 *             role: "Doctor"
 *             shift: "Evening"
 *             date: "2025-12-13"
 *     responses:
 *       200:
 *         description: Staff updated successfully
 *         content:
 *           application/json:
 *             example:
 *               success: true
 *               data:
 *                 _id: "674b1234567890abcdef1234"
 *                 name: "Dr. John Smith Updated"
 *                 staffId: "D001"
 *                 email: "john.updated@hospital.com"
 *                 role: "Doctor"
 *                 shift: "Evening"
 *                 date: "2025-12-13"
 *       404:
 *         description: Staff not found
 *   delete:
 *     summary: Delete staff member
 *     tags: [Staff]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Staff deleted successfully
 *         content:
 *           application/json:
 *             example:
 *               success: true
 *               message: "Staff removed"
 *       404:
 *         description: Staff not found
 *         content:
 *           application/json:
 *             example:
 *               success: false
 *               error: "Staff not found"
 */
router.get('/:id', protect, getStaff);
router.put('/:id', protect, updateStaff);
router.delete('/:id', protect, deleteStaff);

/**
 * @swagger
 * /api/staff/{staffId}/weekly-stats:
 *   get:
 *     summary: Get weekly attendance statistics for a staff member
 *     description: Returns attendance statistics for the last 7 days including present, absent, leave, half-day counts and attendance rate
 *     tags: [Staff]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: staffId
 *         required: true
 *         schema:
 *           type: string
 *         description: Staff MongoDB _id (ObjectId) or staffId (e.g., "D001")
 *         examples:
 *           objectId:
 *             value: "674b1234567890abcdef1234"
 *           staffId:
 *             value: "D001"
 *     responses:
 *       200:
 *         description: Weekly attendance statistics
 *         content:
 *           application/json:
 *             example:
 *               success: true
 *               staff:
 *                 _id: "674b1234567890abcdef1234"
 *                 name: "Dr. Sarah Johnson"
 *                 staffId: "D001"
 *                 email: "sarah.johnson@hospital.com"
 *                 role: "Doctor"
 *                 shift: "Morning"
 *                 date: "2025-12-12"
 *               period:
 *                 startDate: "2025-12-05"
 *                 endDate: "2025-12-11"
 *               statistics:
 *                 totalDays: 7
 *                 present: 5
 *                 absent: 1
 *                 leave: 1
 *                 halfDay: 0
 *                 notMarked: 0
 *                 attendanceRate: "83.3%"
 *               records:
 *                 - date: "2025-12-05"
 *                   shift: "Morning"
 *                   status: "Present"
 *                   remarks: ""
 *                 - date: "2025-12-06"
 *                   shift: "Morning"
 *                   status: "Present"
 *                   remarks: ""
 *       404:
 *         description: Staff not found
 *         content:
 *           application/json:
 *             example:
 *               success: false
 *               error: "Staff not found"
 */
router.get('/:staffId/weekly-stats', protect, getWeeklyStats);

module.exports = router;
