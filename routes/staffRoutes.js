const express = require('express');
const router = express.Router();
const {
  getStaffs,
  getStaff,
  createStaff,
  updateStaff,
  deleteStaff,
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
 *                       required: { Doctor: 1, Nurse: 2, Technician: 1 }
 *                       current: { Doctor: 1, Nurse: 2, Technician: 1 }
 *                       isFullyStaffed: true
 *                       shortages: []
 *                   data:
 *                     - name: "Dr. Smith"
 *                       staffId: "D001"
 *                       role: "Doctor"
 *                       shift: "Morning"
 *                       attendanceStatus: "Present"
 *                       attendanceRemarks: "On time"
 *                     - name: "Nurse Johnson"
 *                       staffId: "N001"
 *                       role: "Nurse"
 *                       shift: "Morning"
 *                       attendanceStatus: "Not Marked"
 *               withoutDate:
 *                 summary: Without date parameter - no attendance data
 *                 value:
 *                   success: true
 *                   count: 4
 *                   staffing:
 *                     Morning:
 *                       required: { Doctor: 1, Nurse: 2, Technician: 1 }
 *                       current: { Doctor: 1, Nurse: 2, Technician: 1 }
 *                       isFullyStaffed: true
 *                   data:
 *                     - name: "Dr. Smith"
 *                       staffId: "D001"
 *                       role: "Doctor"
 *                       shift: "Morning"
 *       401:
 *         description: Not authorized
 *   post:
 *     summary: Create new staff member
 *     tags: [Staff]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Staff'
 *     responses:
 *       201:
 *         description: Staff created successfully
 *       400:
 *         description: Validation error
 */
router.route('/').get(protect, getStaffs).post(protect, createStaff);

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
 *                     role: "Doctor"
 *                     shift: "Morning"
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
 *                     role: "Doctor"
 *                     shift: "Morning"
 *                     attendance:
 *                       status: "Not Marked"
 *       404:
 *         description: Staff not found
 *   put:
 *     summary: Update staff member
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
 *     responses:
 *       200:
 *         description: Staff updated successfully
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
 *       404:
 *         description: Staff not found
 */
router.route('/:id').get(protect, getStaff).put(protect, updateStaff).delete(protect, deleteStaff);

module.exports = router;
