const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { unauthorized } = require('../utils/response');

async function protect(req, res, next) {
  const header = req.headers.authorization;
  if (!header || !header.startsWith('Bearer ')) {
    return unauthorized(res, 'No token provided');
  }

  try {
    const token = header.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findOne({ userId: decoded.userId, isActive: true }).lean();
    if (!user) return unauthorized(res, 'User not found or deactivated');
    req.user = user;
    next();
  } catch {
    return unauthorized(res, 'Invalid or expired token');
  }
}

function requireManager(req, res, next) {
  if (req.user.role !== 'Manager') {
    return res.status(403).json({ success: false, message: 'Manager access required' });
  }
  next();
}

module.exports = { protect, requireManager };
