const express = require('express');
const db = require('../models/db');
const { protect, adminOnly } = require('../middleware/auth');

const router = express.Router();

/**
 * @swagger
 * /api/lessons:
 *   get:
 *     summary: Get all lessons with optional filtering
 *     tags: [Lessons]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: category
 *         schema:
 *           type: string
 *       - in: query
 *         name: difficulty
 *         schema:
 *           type: string
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *     responses:
 *       200:
 *         description: List of lessons
 */
router.get('/', protect, (req, res) => {
  let results = [...db.lessons];
  
  const { category, difficulty, search, page = 1, limit = 10 } = req.query;

  if (category) {
    results = results.filter(l => l.category === category);
  }
  if (difficulty) {
    results = results.filter(l => l.difficulty === difficulty);
  }
  if (search) {
    const q = search.toLowerCase();
    results = results.filter(l => l.title.toLowerCase().includes(q) || l.description.toLowerCase().includes(q));
  }

  const startIndex = (page - 1) * limit;
  const endIndex = page * limit;
  const paginated = results.slice(startIndex, endIndex);

  res.json({
    success: true,
    data: paginated,
    meta: {
      total: results.length,
      page: Number(page),
      limit: Number(limit),
      pages: Math.ceil(results.length / limit)
    }
  });
});

/**
 * @swagger
 * /api/lessons/{id}:
 *   get:
 *     summary: Get lesson by ID
 *     tags: [Lessons]
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
 *         description: Lesson details
 *       404:
 *         description: Lesson not found
 */
router.get('/:id', protect, (req, res) => {
  const lesson = db.findById(db.lessons, req.params.id);
  if (!lesson) return res.status(404).json({ success: false, error: 'Lesson not found', code: 404 });
  res.json({ success: true, data: lesson });
});

/**
 * @swagger
 * /api/lessons:
 *   post:
 *     summary: Create a new lesson (Admin)
 *     tags: [Lessons]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Lesson'
 *     responses:
 *       201:
 *         description: Lesson created
 */
router.post('/', protect, adminOnly, (req, res) => {
  const newLesson = {
    id: db.generateId('l'),
    ...req.body,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };
  db.lessons.push(newLesson);
  res.status(201).json({ success: true, data: newLesson });
});

/**
 * @swagger
 * /api/lessons/{id}:
 *   put:
 *     summary: Update a lesson (Admin)
 *     tags: [Lessons]
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
 *     responses:
 *       200:
 *         description: Lesson updated
 */
router.put('/:id', protect, adminOnly, (req, res) => {
  const lesson = db.findById(db.lessons, req.params.id);
  if (!lesson) return res.status(404).json({ success: false, error: 'Lesson not found', code: 404 });

  Object.assign(lesson, req.body);
  lesson.updatedAt = new Date().toISOString();

  res.json({ success: true, data: lesson });
});

/**
 * @swagger
 * /api/lessons/{id}:
 *   delete:
 *     summary: Delete a lesson (Admin)
 *     tags: [Lessons]
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
 *         description: Lesson deleted
 */
router.delete('/:id', protect, adminOnly, (req, res) => {
  const index = db.lessons.findIndex(l => l.id === req.params.id);
  if (index === -1) return res.status(404).json({ success: false, error: 'Lesson not found', code: 404 });

  db.lessons.splice(index, 1);
  res.json({ success: true, message: 'Lesson deleted successfully' });
});

module.exports = router;
