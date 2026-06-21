const router = require('express').Router();
const ctrl = require('../controller/imperialpediaController');
const { authMiddleware } = require('../middleware/authMiddleware');

router.post('/', authMiddleware, ctrl.createSummary);
router.get('/:id', ctrl.getSummary);
router.patch('/:id', authMiddleware, ctrl.updateSummary);

module.exports = router;
