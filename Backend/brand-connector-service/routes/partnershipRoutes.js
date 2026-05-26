const router = require('express').Router();
const ctrl = require('../controller/brandConnectorController');
const { authMiddleware } = require('../middleware/authMiddleware');

router.get('/', authMiddleware, ctrl.listPartnerships);
router.post('/', authMiddleware, ctrl.createPartnership);
router.get('/:id', authMiddleware, ctrl.getPartnership);
router.patch('/:id', authMiddleware, ctrl.updatePartnership);
router.get('/:id/deliverables', authMiddleware, ctrl.listDeliverables);
router.post('/:id/deliverables', authMiddleware, ctrl.createDeliverable);

module.exports = router;
