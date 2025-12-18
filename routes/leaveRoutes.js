const express = require('express');
const router = express.Router();
const {
  applyLeave,
  getAllLeaves,
  getLeaveById,
  getStaffLeaves,
  approveLeave,
  rejectLeave,
  cancelLeave,
  getLeaveStats,
} = require('../controllers/leaveController');
const { protect } = require('../middleware/auth');

/**
 * @swagger
 * /api/leave:
 *   get:
 *     summary: Get all leave applications
 *     tags: [Leave]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: staffId
 *         schema:
 *           type: string
 *         description: Filter by staff ID
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [Pending, Approved, Rejected, Cancelled]
 *         description: Filter by status
 *       - in: query
 *         name: leaveType
 *         schema:
 *           type: string
 *           enum: [Sick Leave, Casual Leave, Annual Leave, Maternity Leave, Other]
 *         description: Filter by leave type
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
 *         description: List of leave applications
 */
router.get('/', protect, getAllLeaves);

/**
 * @swagger
 * /api/leave/stats/summary:
 *   get:
 *     summary: Get leave statistics summary
 *     tags: [Leave]
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
 *     responses:
 *       200:
 *         description: Leave statistics
 */
router.get('/stats/summary', protect, getLeaveStats);

/**
 * @swagger
 * /api/leave/apply:
 *   post:
 *     summary: Apply for leave
 *     tags: [Leave]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [staffId, leaveType, startDate, endDate, reason]
 *             properties:
 *               staffId:
 *                 type: string
 *                 description: Staff member ID
 *               leaveType:
 *                 type: string
 *                 enum: [Sick Leave, Casual Leave, Annual Leave, Maternity Leave, Other]
 *               startDate:
 *                 type: string
 *                 format: date
 *                 description: Start date (YYYY-MM-DD)
 *               endDate:
 *                 type: string
 *                 format: date
 *                 description: End date (YYYY-MM-DD)
 *               reason:
 *                 type: string
 *                 description: Reason for leave (max 500 characters)
 *     responses:
 *       201:
 *         description: Leave application submitted
 */
router.post('/apply', protect, applyLeave);

/**
 * @swagger
 * /api/leave/{id}:
 *   get:
 *     summary: Get leave by ID
 *     tags: [Leave]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Leave ID
 *     responses:
 *       200:
 *         description: Leave details
 */
router.get('/:id', protect, getLeaveById);

/**
 * @swagger
 * /api/leave/staff/{staffId}:
 *   get:
 *     summary: Get leaves for a specific staff member
 *     tags: [Leave]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: staffId
 *         required: true
 *         schema:
 *           type: string
 *         description: Staff member ID
 *     responses:
 *       200:
 *         description: List of leaves for the staff member
 */
router.get('/staff/:staffId', protect, getStaffLeaves);

/**
 * @swagger
 * /api/leave/{id}/approve:
 *   put:
 *     summary: Approve leave request
 *     tags: [Leave]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Leave ID
 *     requestBody:
 *       required: false
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               remarks:
 *                 type: string
 *                 description: Approval remarks (max 200 characters)
 *     responses:
 *       200:
 *         description: Leave approved
 */
router.put('/:id/approve', protect, approveLeave);

/**
 * @swagger
 * /api/leave/{id}/reject:
 *   put:
 *     summary: Reject leave request
 *     tags: [Leave]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Leave ID
 *     requestBody:
 *       required: false
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               remarks:
 *                 type: string
 *                 description: Rejection remarks (max 200 characters)
 *     responses:
 *       200:
 *         description: Leave rejected
 */
router.put('/:id/reject', protect, rejectLeave);

/**
 * @swagger
 * /api/leave/{id}/cancel:
 *   put:
 *     summary: Cancel leave request
 *     tags: [Leave]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Leave ID
 *     responses:
 *       200:
 *         description: Leave cancelled
 */
router.put('/:id/cancel', protect, cancelLeave);

module.exports = router;
