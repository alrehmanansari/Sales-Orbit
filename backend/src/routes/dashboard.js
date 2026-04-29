const router = require('express').Router();
const ctrl = require('../controllers/dashboard');
const { protect } = require('../middleware/auth');

router.use(protect);
router.get('/stats', ctrl.stats);
router.get('/pipeline', ctrl.pipeline);
router.get('/leaderboard', ctrl.leaderboard);
router.get('/activity-breakdown', ctrl.activityBreakdown);

module.exports = router;
