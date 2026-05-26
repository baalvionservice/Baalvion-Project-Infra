'use strict';
const { Router } = require('express');
const ctrl = require('../controller/crmController');
const { authMiddleware } = require('../middleware/authMiddleware');
const router = Router();

router.get('/', authMiddleware, ctrl.listLeads);
router.post('/', authMiddleware, ctrl.createLead);
router.get('/:id', authMiddleware, ctrl.getLead);
router.patch('/:id', authMiddleware, ctrl.updateLead);
router.post('/:id/notes', authMiddleware, ctrl.addNote);
router.post('/:id/convert', authMiddleware, ctrl.convertLead);

module.exports = router;
