const router = require('express').Router();
const ctrl = require('../controller/imperialpediaController');
const { authMiddleware } = require('../middleware/authMiddleware');

router.get('/', ctrl.listCreators);
router.post('/me', authMiddleware, ctrl.upsertCreatorProfile);
router.get('/:id', ctrl.getCreator);
router.get('/:id/articles', ctrl.getCreatorArticles);

module.exports = router;
