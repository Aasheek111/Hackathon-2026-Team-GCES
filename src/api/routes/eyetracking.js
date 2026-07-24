const express = require('express');
const db = require('../models/db');
const { protect } = require('../middleware/auth');

const router = express.Router();

/**
 * @swagger
 * /api/eyetracking/sessions/me:
 *   get:
 *     summary: Get current user's eye tracking sessions
 *     tags: [Eye Tracking]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of eye tracking sessions
 */
router.get('/sessions/me', protect, (req, res) => {
  const sessions = db.filterBy(db.eyeTrackingSessions, 'userId', req.user.id);
  res.json({ success: true, data: sessions });
});

/**
 * @swagger
 * /api/eyetracking/sessions/{id}:
 *   get:
 *     summary: Get an eye tracking session by ID
 *     tags: [Eye Tracking]
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
 *         description: Eye tracking session details
 *       404:
 *         description: Session not found
 */
router.get('/sessions/:id', protect, (req, res) => {
  const session = db.findById(db.eyeTrackingSessions, req.params.id);
  if (!session) return res.status(404).json({ success: false, error: 'Session not found', code: 404 });
  
  if (session.userId !== req.user.id && req.user.role !== 'admin') {
    return res.status(403).json({ success: false, error: 'Unauthorized', code: 403 });
  }

  res.json({ success: true, data: session });
});

/**
 * @swagger
 * /api/eyetracking/sessions:
 *   post:
 *     summary: Log a new eye tracking session (e.g. after calibration or usage)
 *     tags: [Eye Tracking]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/EyeTrackingSessionCreate'
 *     responses:
 *       201:
 *         description: Eye tracking session logged
 */
router.post('/sessions', protect, (req, res) => {
  const { calibrationPoints, accuracy, clickMode, durationSec, clickCount } = req.body;

  const newSession = {
    id: db.generateId('ets'),
    userId: req.user.id,
    calibrationPoints: calibrationPoints || 5,
    accuracy: accuracy || 0,
    clickMode: clickMode || 'blink',
    durationSec: durationSec || 0,
    clickCount: clickCount || 0,
    createdAt: new Date().toISOString()
  };

  db.eyeTrackingSessions.push(newSession);
  res.status(201).json({ success: true, data: newSession });
});

module.exports = router;
