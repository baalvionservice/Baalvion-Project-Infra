const router = require('express').Router();
const ctrl = require('../controller/realEstateController');
const { authMiddleware } = require('../middleware/authMiddleware');

router.post('/', authMiddleware, ctrl.requestViewing);
router.get('/', authMiddleware, ctrl.listViewings);
router.get('/:id', authMiddleware, ctrl.getViewing);
router.patch('/:id', authMiddleware, ctrl.updateViewing);

module.exports = router;
