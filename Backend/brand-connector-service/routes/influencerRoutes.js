const router = require('express').Router();
const ctrl = require('../controller/brandConnectorController');
const { authMiddleware } = require('../middleware/authMiddleware');

router.get('/', ctrl.listInfluencers);
router.post('/', authMiddleware, ctrl.createInfluencer);
router.get('/:id', ctrl.getInfluencer);
router.patch('/:id', authMiddleware, ctrl.updateInfluencer);

module.exports = router;
