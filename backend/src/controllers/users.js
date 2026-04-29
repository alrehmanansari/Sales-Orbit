const User = require('../models/User');
const { ok, notFound, badRequest } = require('../utils/response');

// GET /api/v1/users
exports.list = async (req, res, next) => {
  try {
    const users = await User.find({ isActive: true }).sort({ createdAt: 1 }).lean();
    ok(res, { users, total: users.length });
  } catch (err) {
    next(err);
  }
};

// GET /api/v1/users/:id
exports.get = async (req, res, next) => {
  try {
    const user = await User.findOne({ userId: req.params.id }).lean();
    if (!user) return notFound(res, 'User not found');
    ok(res, { user });
  } catch (err) {
    next(err);
  }
};

// DELETE /api/v1/users/:id  (soft delete)
exports.remove = async (req, res, next) => {
  try {
    if (req.params.id === req.user.userId) {
      return badRequest(res, 'Cannot deactivate your own account');
    }
    const user = await User.findOneAndUpdate(
      { userId: req.params.id },
      { isActive: false },
      { new: true }
    );
    if (!user) return notFound(res, 'User not found');
    ok(res, {}, 'User deactivated');
  } catch (err) {
    next(err);
  }
};
