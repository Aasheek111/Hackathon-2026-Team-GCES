const express = require('express');
const router = express.Router();

/**
 * @swagger
 * /api/health:
 *   get:
 *     summary: Basic health check
 *     tags: [Health]
 *     responses:
 *       200:
 *         description: API is healthy
 */
router.get('/', (req, res) => {
  res.json({ success: true, status: 'OK', timestamp: new Date().toISOString() });
});

/**
 * @swagger
 * /api/health/ready:
 *   get:
 *     summary: Detailed readiness probe
 *     tags: [Health]
 *     responses:
 *       200:
 *         description: API is ready
 */
router.get('/ready', (req, res) => {
  res.json({
    success: true,
    status: 'READY',
    uptime: process.uptime(),
    memory: process.memoryUsage(),
    timestamp: new Date().toISOString()
  });
});

module.exports = router;
