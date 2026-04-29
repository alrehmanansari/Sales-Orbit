const router = require('express').Router();
const ctrl = require('../controllers/opportunities');
const { protect } = require('../middleware/auth');

router.use(protect);
router.get('/export', ctrl.exportCSV);
router.get('/', ctrl.list);
router.post('/', ctrl.create);
router.get('/:id', ctrl.get);
router.put('/:id', ctrl.update);
router.delete('/:id', ctrl.remove);
router.patch('/:id/stage', ctrl.moveStage);

module.exports = router;
