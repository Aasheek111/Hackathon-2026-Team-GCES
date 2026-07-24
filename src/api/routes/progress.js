const express = require('express');
const db = require('../models/db');
const { protect } = require('../middleware/auth');

const router = express.Router();

/**
 * @swagger
 * /api/progress/me:
 *   get:
 *     summary: Get current user's progress
 *     tags: [Progress]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of progress records for current user
 */
router.get('/me', protect, (req, res) => {
  const userProgress = db.filterBy(db.progress, 'userId', req.user.id);
  res.json({ success: true, data: userProgress });
});

/**
 * @swagger
 * /api/progress/summary:
 *   get:
 *     summary: Get a summary of user's overall progress
 *     tags: [Progress]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: User's progress summary
 */
router.get('/summary', protect, (req, res) => {
  const userProgress = db.filterBy(db.progress, 'userId', req.user.id);
  const completed = userProgress.filter(p => p.status === 'completed').length;
  const inProgress = userProgress.filter(p => p.status === 'in-progress').length;
  
  const totalTimeSpent = userProgress.reduce((acc, curr) => acc + (curr.timeSpentSec || 0), 0);

  res.json({
    success: true,
    data: {
      completedLessons: completed,
      inProgressLessons: inProgress,
      totalLessonsStarted: userProgress.length,
      totalTimeSpentSec: totalTimeSpent
    }
  });
});

/**
 * @swagger
 * /api/progress:
 *   post:
 *     summary: Upsert progress for a lesson
 *     tags: [Progress]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/ProgressUpdate'
 *     responses:
 *       200:
 *         description: Progress updated successfully
 */
router.post('/', protect, (req, res) => {
  const { lessonId, percentComplete, timeSpentSec } = req.body;

  if (!lessonId) {
    return res.status(400).json({ success: false, error: 'lessonId is required', code: 400 });
  }

  let progressRecord = db.progress.find(p => p.userId === req.user.id && p.lessonId === lessonId);

  const status = percentComplete >= 100 ? 'completed' : 'in-progress';
  const now = new Date().toISOString();

  if (progressRecord) {
    progressRecord.percentComplete = percentComplete;
    progressRecord.timeSpentSec += (timeSpentSec || 0);
    progressRecord.status = status;
    progressRecord.lastAccessedAt = now;
    if (status === 'completed' && !progressRecord.completedAt) {
      progressRecord.completedAt = now;
      // Award XP
      const lesson = db.findById(db.lessons, lessonId);
      const user = db.findById(db.users, req.user.id);
      if (lesson && user) {
        user.profile.xp += lesson.xpReward || 0;
      }
    }
  } else {
    progressRecord = {
      id: db.generateId('p'),
      userId: req.user.id,
      lessonId,
      status,
      percentComplete: percentComplete || 0,
      timeSpentSec: timeSpentSec || 0,
      lastAccessedAt: now,
      completedAt: status === 'completed' ? now : null
    };
    db.progress.push(progressRecord);
    
    if (status === 'completed') {
      const lesson = db.findById(db.lessons, lessonId);
      const user = db.findById(db.users, req.user.id);
      if (lesson && user) {
        user.profile.xp += lesson.xpReward || 0;
      }
    }
  }

  res.json({ success: true, data: progressRecord });
});

module.exports = router;
