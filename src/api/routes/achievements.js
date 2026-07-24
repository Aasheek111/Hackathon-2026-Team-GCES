const express = require('express');
const db = require('../models/db');
const { protect } = require('../middleware/auth');

const router = express.Router();

/**
 * @swagger
 * /api/achievements/me:
 *   get:
 *     summary: Get achievements unlocked by current user
 *     tags: [Achievements]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of user's achievements
 */
router.get('/me', protect, (req, res) => {
  const userAchievements = db.filterBy(db.achievements, 'userId', req.user.id);
  res.json({ success: true, data: userAchievements });
});

/**
 * @swagger
 * /api/achievements:
 *   get:
 *     summary: Get all available achievement types
 *     tags: [Achievements]
 *     responses:
 *       200:
 *         description: List of all achievement types in the system
 */
router.get('/', (req, res) => {
  // Return unique achievement types
  const uniqueAchievements = [];
  const map = new Map();
  for (const item of db.achievements) {
    if (!map.has(item.type)) {
      map.set(item.type, true);
      uniqueAchievements.push({
        type: item.type,
        title: item.title,
        description: item.description,
        icon: item.icon
      });
    }
  }
  res.json({ success: true, data: uniqueAchievements });
});

module.exports = router;
