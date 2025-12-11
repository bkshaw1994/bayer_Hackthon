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
