const router = require('express').Router();
const ctrl = require('../controller/realEstateController');
const { authMiddleware } = require('../middleware/authMiddleware');

router.get('/', ctrl.listAgents);
router.post('/', authMiddleware, ctrl.createAgent);
router.get('/:id', ctrl.getAgent);
router.patch('/:id', authMiddleware, ctrl.updateAgent);
router.get('/:id/properties', ctrl.getAgentProperties);

module.exports = router;
