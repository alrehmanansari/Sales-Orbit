const router = require('express').Router();
const ctrl = require('../controllers/auth');
const { protect } = require('../middleware/auth');

router.post('/signup', ctrl.signup);
router.post('/login', ctrl.login);
router.post('/verify-otp', ctrl.verifyOtp);
router.get('/me', protect, ctrl.getMe);
router.put('/me', protect, ctrl.updateMe);

module.exports = router;
