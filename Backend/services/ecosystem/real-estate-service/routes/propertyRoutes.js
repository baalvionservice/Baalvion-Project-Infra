const router = require('express').Router();
const ctrl = require('../controller/realEstateController');
const { authMiddleware } = require('../middleware/authMiddleware');

router.get('/', ctrl.listProperties);
router.post('/', authMiddleware, ctrl.createProperty);
router.get('/:id', ctrl.getProperty);
router.patch('/:id', authMiddleware, ctrl.updateProperty);
router.delete('/:id', authMiddleware, ctrl.deleteProperty);
router.post('/:id/publish', authMiddleware, ctrl.publishProperty);
router.post('/:id/images', authMiddleware, ctrl.addImages);
router.post('/:id/documents', authMiddleware, ctrl.addDocument);

module.exports = router;
