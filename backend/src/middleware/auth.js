const jwt = require('jsonwebtoken');
const pool = require('../config/db');
const { unauthorized } = require('../utils/response');

async function protect(req, res, next) {
  const header = req.headers.authorization;
  if (!header || !header.startsWith('Bearer ')) {
    return unauthorized(res, 'No token provided');
  }

  try {
    const token = header.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const [rows] = await pool.query(
      'SELECT * FROM users WHERE user_id = ? AND is_active = 1',
      [decoded.userId]
    );
    if (!rows.length) return unauthorized(res, 'User not found or deactivated');

    const u = rows[0];
    req.user = {
      userId:      u.user_id,
      firstName:   u.first_name,
      lastName:    u.last_name,
      name:        `${u.first_name} ${u.last_name}`,
      email:       u.email,
      designation: u.designation,
      role:        u.role,
    };
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
