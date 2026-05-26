const router = require('express').Router();
const ctrl = require('../controller/realEstateController');
const { authMiddleware } = require('../middleware/authMiddleware');

// Public submit — optional auth to capture user_id when logged in
router.post('/', ctrl.submitInquiry);
router.get('/', authMiddleware, ctrl.listInquiries);
router.get('/:id', authMiddleware, ctrl.getInquiry);
router.patch('/:id', authMiddleware, ctrl.updateInquiry);

module.exports = router;
