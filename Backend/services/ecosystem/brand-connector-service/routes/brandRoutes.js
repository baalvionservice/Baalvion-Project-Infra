const router = require('express').Router();
const ctrl = require('../controller/brandConnectorController');
const { authMiddleware } = require('../middleware/authMiddleware');

router.get('/', ctrl.listBrands);
router.post('/', authMiddleware, ctrl.createBrand);
router.get('/:id', ctrl.getBrand);
router.patch('/:id', authMiddleware, ctrl.updateBrand);

module.exports = router;
