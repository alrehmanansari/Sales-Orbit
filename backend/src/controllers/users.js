const pool = require('../config/db');
const { ok, notFound, badRequest } = require('../utils/response');
const { transformUser } = require('../utils/transform');

// GET /api/v1/users
exports.list = async (req, res, next) => {
  try {
    const [rows] = await pool.query(
      'SELECT * FROM users WHERE is_active = 1 ORDER BY created_at ASC'
    );
    ok(res, { users: rows.map(transformUser), total: rows.length });
  } catch (err) { next(err); }
};

// GET /api/v1/users/:id
exports.get = async (req, res, next) => {
  try {
    const [rows] = await pool.query('SELECT * FROM users WHERE user_id = ?', [req.params.id]);
    if (!rows.length) return notFound(res, 'User not found');
    ok(res, { user: transformUser(rows[0]) });
  } catch (err) { next(err); }
};

// DELETE /api/v1/users/:id  (soft delete)
exports.remove = async (req, res, next) => {
  try {
    if (req.params.id === req.user.userId) {
      return badRequest(res, 'Cannot deactivate your own account');
    }
    const [result] = await pool.query(
      'UPDATE users SET is_active = 0 WHERE user_id = ?', [req.params.id]
    );
    if (!result.affectedRows) return notFound(res, 'User not found');
    ok(res, {}, 'User deactivated');
  } catch (err) { next(err); }
};
