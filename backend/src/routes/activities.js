const router = require('express').Router();
const ctrl = require('../controllers/activities');
const { protect } = require('../middleware/auth');

router.use(protect);
router.get('/', ctrl.list);
router.post('/', ctrl.create);
router.get('/entity/:type/:id', ctrl.byEntity);
router.get('/:id', ctrl.get);

module.exports = router;
