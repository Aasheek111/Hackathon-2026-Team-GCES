const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../models/db');
const { protect } = require('../middleware/auth');

const router = express.Router();

/**
 * @swagger
 * /api/auth/login:
 *   post:
 *     summary: Authenticate a user and get a token
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/LoginRequest'
 *     responses:
 *       200:
 *         description: Login successful
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/AuthResponse'
 *       401:
 *         description: Invalid credentials
 */
router.post('/login', (req, res) => {
  const { email, password } = req.body;
  const user = db.findByField(db.users, 'email', email);

  if (!user || !bcrypt.compareSync(password, user.passwordHash)) {
    return res.status(401).json({ success: false, error: 'Invalid credentials', code: 401 });
  }

  const token = jwt.sign({ id: user.id, role: user.role }, process.env.JWT_SECRET || 'brightmind-secret', {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d'
  });

  const { passwordHash, ...safeUser } = user;
  res.json({ success: true, token, user: safeUser });
});

/**
 * @swagger
 * /api/auth/register:
 *   post:
 *     summary: Register a new user
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/RegisterRequest'
 *     responses:
 *       201:
 *         description: User registered successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/AuthResponse'
 *       400:
 *         description: Email already exists
 */
router.post('/register', (req, res) => {
  const { name, email, password } = req.body;

  if (db.findByField(db.users, 'email', email)) {
    return res.status(400).json({ success: false, error: 'Email already exists', code: 400 });
  }

  const newUser = {
    id: db.generateId('u'),
    name,
    email,
    passwordHash: bcrypt.hashSync(password, 10),
    role: 'learner',
    profile: {
      avatar: '🧑‍🎓',
      level: 1,
      xp: 0,
      streak: 0,
      accessibility: {
        ttsEnabled: true,
        highContrast: false,
        fontSize: 'normal',
        voiceCommands: false,
        eyeTracking: false,
        clickMode: 'blink'
      }
    },
    createdAt: new Date().toISOString()
  };

  db.users.push(newUser);

  const token = jwt.sign({ id: newUser.id, role: newUser.role }, process.env.JWT_SECRET || 'brightmind-secret', {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d'
  });

  const { passwordHash, ...safeUser } = newUser;
  res.status(201).json({ success: true, token, user: safeUser });
});

/**
 * @swagger
 * /api/auth/logout:
 *   post:
 *     summary: Logout a user (client-side token removal)
 *     tags: [Auth]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Logged out successfully
 */
router.post('/logout', protect, (req, res) => {
  res.json({ success: true, message: 'Logged out successfully. Please remove token on client.' });
});

/**
 * @swagger
 * /api/auth/me:
 *   get:
 *     summary: Get current authenticated user
 *     tags: [Auth]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Current user profile
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 user:
 *                   $ref: '#/components/schemas/UserPublic'
 */
router.get('/me', protect, (req, res) => {
  res.json({ success: true, user: req.user });
});

module.exports = router;
