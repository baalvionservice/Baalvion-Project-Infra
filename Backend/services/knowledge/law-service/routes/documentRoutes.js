'use strict';
const router = require('express').Router();
const { authMiddleware } = require('../middleware/authMiddleware');
const ctrl = require('../controller/documentController');

router.get('/',       authMiddleware, ctrl.listDocuments);
router.post('/',      authMiddleware, ctrl.uploadDocument);
router.get('/:id',    authMiddleware, ctrl.getDocument);
router.delete('/:id', authMiddleware, ctrl.deleteDocument);

module.exports = router;
