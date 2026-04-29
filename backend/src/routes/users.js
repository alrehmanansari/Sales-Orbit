const router = require('express').Router();
const ctrl = require('../controllers/users');
const { protect, requireManager } = require('../middleware/auth');

router.use(protect);
router.get('/', ctrl.list);
router.get('/:id', ctrl.get);
router.delete('/:id', requireManager, ctrl.remove);

module.exports = router;
