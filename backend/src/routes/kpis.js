const router = require('express').Router();
const ctrl = require('../controllers/kpis');
const { protect, requireManager } = require('../middleware/auth');

router.use(protect);
router.get('/', ctrl.list);
router.put('/', requireManager, ctrl.upsert);
router.get('/:userId', ctrl.getByUser);

module.exports = router;
