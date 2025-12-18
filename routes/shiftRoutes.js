const express = require('express');
const router = express.Router();
const {
  addShift,
  getAllShifts,
  getShiftById,
  getStaffShifts,
  updateShift,
  deleteShift,
  getShiftsSchedule,
  getShiftStats,
} = require('../controllers/shiftController');
const { protect } = require('../middleware/auth');

/**
 * @swagger
 * /api/shift:
 *   get:
 *     summary: Get all shifts with filtering
 *     tags: [Shift]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: staffId
 *         schema:
 *           type: string
 *         description: Filter by staff ID
 *       - in: query
 *         name: shiftType
 *         schema:
 *           type: string
 *           enum: [Morning, Evening, Night]
 *         description: Filter by shift type
 *       - in: query
 *         name: shiftDate
 *         schema:
 *           type: string
 *           format: date
 *         description: Filter by specific date (YYYY-MM-DD)
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date
 *         description: Filter from start date (YYYY-MM-DD)
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date
 *         description: Filter to end date (YYYY-MM-DD)
 *     responses:
 *       200:
 *         description: List of shifts
 */
router.get('/', protect, getAllShifts);

/**
 * @swagger
 * /api/shift/schedule/daily:
 *   get:
 *     summary: Get daily shift schedule
 *     tags: [Shift]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: date
 *         required: true
 *         schema:
 *           type: string
 *           format: date
 *         description: Date for schedule (YYYY-MM-DD)
 *       - in: query
 *         name: shiftType
 *         schema:
 *           type: string
 *           enum: [Morning, Evening, Night]
 *         description: Filter by shift type
 *     responses:
 *       200:
 *         description: Daily shift schedule
 */
router.get('/schedule/daily', protect, getShiftsSchedule);

/**
 * @swagger
 * /api/shift/stats/summary:
 *   get:
 *     summary: Get shift statistics summary
 *     tags: [Shift]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: staffId
 *         schema:
 *           type: string
 *         description: Filter by staff ID
 *       - in: query
 *         name: month
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 12
 *         description: Month (1-12)
 *       - in: query
 *         name: year
 *         schema:
 *           type: integer
 *         description: Year (YYYY)
 *       - in: query
 *         name: shiftType
 *         schema:
 *           type: string
 *           enum: [Morning, Evening, Night]
 *         description: Filter by shift type
 *     responses:
 *       200:
 *         description: Shift statistics
 */
router.get('/stats/summary', protect, getShiftStats);

/**
 * @swagger
 * /api/shift:
 *   post:
 *     summary: Add a new shift for a staff member
 *     tags: [Shift]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [staffId, shiftDate, shiftType, startTime, endTime]
 *             properties:
 *               staffId:
 *                 type: string
 *                 description: Staff member ID
 *               shiftDate:
 *                 type: string
 *                 format: date
 *                 description: Shift date (YYYY-MM-DD)
 *               shiftType:
 *                 type: string
 *                 enum: [Morning, Evening, Night]
 *               startTime:
 *                 type: string
 *                 description: Start time (HH:mm format, e.g., 06:00)
 *               endTime:
 *                 type: string
 *                 description: End time (HH:mm format, e.g., 14:00)
 *               notes:
 *                 type: string
 *                 description: Additional notes (max 300 characters)
 *     responses:
 *       201:
 *         description: Shift assigned successfully
 */
router.post('/', protect, addShift);

/**
 * @swagger
 * /api/shift/{id}:
 *   get:
 *     summary: Get shift by ID
 *     tags: [Shift]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Shift ID
 *     responses:
 *       200:
 *         description: Shift details
 */
router.get('/:id', protect, getShiftById);

/**
 * @swagger
 * /api/shift/staff/{staffId}:
 *   get:
 *     summary: Get all shifts for a specific staff member
 *     tags: [Shift]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: staffId
 *         required: true
 *         schema:
 *           type: string
 *         description: Staff member ID
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date
 *         description: Filter from start date (YYYY-MM-DD)
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date
 *         description: Filter to end date (YYYY-MM-DD)
 *     responses:
 *       200:
 *         description: List of shifts for staff member
 */
router.get('/staff/:staffId', protect, getStaffShifts);

/**
 * @swagger
 * /api/shift/{id}:
 *   put:
 *     summary: Update a shift
 *     tags: [Shift]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Shift ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               shiftType:
 *                 type: string
 *                 enum: [Morning, Evening, Night]
 *               startTime:
 *                 type: string
 *                 description: Start time (HH:mm format)
 *               endTime:
 *                 type: string
 *                 description: End time (HH:mm format)
 *               notes:
 *                 type: string
 *                 description: Additional notes
 *     responses:
 *       200:
 *         description: Shift updated successfully
 */
router.put('/:id', protect, updateShift);

/**
 * @swagger
 * /api/shift/{id}:
 *   delete:
 *     summary: Delete a shift
 *     tags: [Shift]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Shift ID
 *     responses:
 *       200:
 *         description: Shift deleted successfully
 */
router.delete('/:id', protect, deleteShift);

module.exports = router;
