const router = require('express').Router();
const ctrl = require('../controllers/leads');
const { protect } = require('../middleware/auth');

router.use(protect);
router.get('/export', ctrl.exportCSV);
router.get('/', ctrl.list);
router.post('/', ctrl.create);
router.post('/bulk', ctrl.bulkImport);
router.get('/:id', ctrl.get);
router.put('/:id', ctrl.update);
router.delete('/:id', ctrl.remove);
router.post('/:id/convert', ctrl.convert);

module.exports = router;
