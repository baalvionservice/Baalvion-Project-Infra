'use strict';
const router = require('express').Router();
const { authMiddleware } = require('../middleware/authMiddleware');
const ctrl = require('../controller/contactController');

router.get('/', ctrl.listContacts);
router.post('/', authMiddleware, ctrl.createContact);
router.patch('/:id', authMiddleware, ctrl.updateContact);
router.delete('/:id', authMiddleware, ctrl.deleteContact);

module.exports = router;
