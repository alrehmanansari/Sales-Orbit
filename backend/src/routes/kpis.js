const router = require('express').Router();
const ctrl = require('../controllers/kpis');
const { protect } = require('../middleware/auth');

router.use(protect);
router.get('/', ctrl.list);
router.put('/', ctrl.upsert);
router.get('/:userId', ctrl.getByUser);

module.exports = router;
