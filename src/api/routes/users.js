const express = require('express');
const db = require('../models/db');
const { protect, adminOnly } = require('../middleware/auth');

const router = express.Router();

/**
 * @swagger
 * /api/users:
 *   get:
 *     summary: Get all users (Admin only)
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of users
 *       403:
 *         description: Admin access required
 */
router.get('/', protect, adminOnly, (req, res) => {
  const safeUsers = db.users.map(({ passwordHash, ...user }) => user);
  res.json({ success: true, data: safeUsers });
});

/**
 * @swagger
 * /api/users/{id}:
 *   get:
 *     summary: Get user by ID
 *     tags: [Users]
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
 *         description: User details
 *       404:
 *         description: User not found
 */
router.get('/:id', protect, (req, res) => {
  const user = db.findById(db.users, req.params.id);
  if (!user) return res.status(404).json({ success: false, error: 'User not found', code: 404 });
  const { passwordHash, ...safeUser } = user;
  res.json({ success: true, data: safeUser });
});

/**
 * @swagger
 * /api/users/{id}/profile:
 *   put:
 *     summary: Update user profile
 *     tags: [Users]
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
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               avatar:
 *                 type: string
 *     responses:
 *       200:
 *         description: Profile updated
 */
router.put('/:id/profile', protect, (req, res) => {
  if (req.user.id !== req.params.id && req.user.role !== 'admin') {
    return res.status(403).json({ success: false, error: 'Unauthorized', code: 403 });
  }

  const user = db.findById(db.users, req.params.id);
  if (!user) return res.status(404).json({ success: false, error: 'User not found', code: 404 });

  if (req.body.name) user.name = req.body.name;
  if (req.body.avatar) user.profile.avatar = req.body.avatar;

  const { passwordHash, ...safeUser } = user;
  res.json({ success: true, data: safeUser });
});

/**
 * @swagger
 * /api/users/{id}/accessibility:
 *   put:
 *     summary: Update accessibility settings
 *     tags: [Users]
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
 *             $ref: '#/components/schemas/AccessibilitySettings'
 *     responses:
 *       200:
 *         description: Accessibility settings updated
 */
router.put('/:id/accessibility', protect, (req, res) => {
  if (req.user.id !== req.params.id && req.user.role !== 'admin') {
    return res.status(403).json({ success: false, error: 'Unauthorized', code: 403 });
  }

  const user = db.findById(db.users, req.params.id);
  if (!user) return res.status(404).json({ success: false, error: 'User not found', code: 404 });

  user.profile.accessibility = { ...user.profile.accessibility, ...req.body };

  const { passwordHash, ...safeUser } = user;
  res.json({ success: true, data: safeUser });
});

/**
 * @swagger
 * /api/users/{id}:
 *   delete:
 *     summary: Delete a user (Admin only)
 *     tags: [Users]
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
 *         description: User deleted
 */
router.delete('/:id', protect, adminOnly, (req, res) => {
  const index = db.users.findIndex(u => u.id === req.params.id);
  if (index === -1) return res.status(404).json({ success: false, error: 'User not found', code: 404 });
  
  db.users.splice(index, 1);
  res.json({ success: true, message: 'User deleted successfully' });
});

module.exports = router;
