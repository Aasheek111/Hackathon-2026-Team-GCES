const jwt = require('jsonwebtoken');
const db  = require('../models/db');

const protect = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({
      success: false,
      error: 'Access denied. No token provided.',
      code: 401
    });
  }
  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'brightmind-secret');
    const user = db.findById(db.users, decoded.id);
    if (!user) return res.status(401).json({ success: false, error: 'User not found.', code: 401 });
    const { passwordHash, ...safeUser } = user;
    req.user = safeUser;
    next();
  } catch (err) {
    res.status(401).json({ success: false, error: 'Invalid or expired token.', code: 401 });
  }
};

const adminOnly = (req, res, next) => {
  if (req.user?.role !== 'admin') {
    return res.status(403).json({ success: false, error: 'Admin access required.', code: 403 });
  }
  next();
};

module.exports = { protect, adminOnly };
