'use strict';
const router = require('express').Router();
const { authMiddleware } = require('../middleware/authMiddleware');
const ctrl = require('../controller/documentController');

router.get('/', ctrl.listDocuments);
router.post('/', authMiddleware, ctrl.createDocument);
router.get('/:id', ctrl.getDocument);
router.patch('/:id', authMiddleware, ctrl.updateDocument);
router.delete('/:id', authMiddleware, ctrl.deleteDocument);

module.exports = router;
