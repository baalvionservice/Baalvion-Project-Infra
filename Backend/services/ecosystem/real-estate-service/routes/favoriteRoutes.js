const router = require('express').Router();
const ctrl = require('../controller/realEstateController');
const { authMiddleware } = require('../middleware/authMiddleware');

router.get('/', authMiddleware, ctrl.listFavorites);
router.post('/:propertyId', authMiddleware, ctrl.toggleFavorite);

module.exports = router;
