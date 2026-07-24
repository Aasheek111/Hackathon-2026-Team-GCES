const express = require('express');
const db = require('../models/db');
const { protect } = require('../middleware/auth');

const router = express.Router();

/**
 * @swagger
 * /api/activities:
 *   get:
 *     summary: Get all activities
 *     tags: [Activities]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of activities
 */
router.get('/', protect, (req, res) => {
  res.json({ success: true, data: db.activities });
});

/**
 * @swagger
 * /api/activities/{id}:
 *   get:
 *     summary: Get activity by ID
 *     tags: [Activities]
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
 *         description: Activity details
 *       404:
 *         description: Activity not found
 */
router.get('/:id', protect, (req, res) => {
  const activity = db.findById(db.activities, req.params.id);
  if (!activity) return res.status(404).json({ success: false, error: 'Activity not found', code: 404 });
  res.json({ success: true, data: activity });
});

/**
 * @swagger
 * /api/activities/sessions/me:
 *   get:
 *     summary: Get current user's activity sessions
 *     tags: [Activities]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of user's activity sessions
 */
router.get('/sessions/me', protect, (req, res) => {
  const sessions = db.filterBy(db.activitySessions, 'userId', req.user.id);
  res.json({ success: true, data: sessions });
});

/**
 * @swagger
 * /api/activities/sessions:
 *   post:
 *     summary: Submit a completed activity session
 *     tags: [Activities]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/ActivitySessionCreate'
 *     responses:
 *       201:
 *         description: Activity session recorded
 */
router.post('/sessions', protect, (req, res) => {
  const { activityId, score, maxScore, rounds, duration } = req.body;
  
  const activity = db.findById(db.activities, activityId);
  if (!activity) return res.status(404).json({ success: false, error: 'Activity not found', code: 404 });

  const accuracy = (score / maxScore) * 100;
  
  const newSession = {
    id: db.generateId('s'),
    userId: req.user.id,
    activityId,
    score,
    maxScore,
    accuracy,
    rounds,
    duration,
    completedAt: new Date().toISOString()
  };

  db.activitySessions.push(newSession);

  // Update user XP
  const user = db.findById(db.users, req.user.id);
  if (user) {
    user.profile.xp += activity.xpReward || 10;
    // Check for level up logic could go here
  }

  res.status(201).json({ success: true, data: newSession });
});

module.exports = router;
