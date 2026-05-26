'use strict';
const { Router } = require('express');
const ctrl = require('../controller/dealsController');
const { authMiddleware } = require('../middleware/authMiddleware');
const router = Router();

router.get('/', authMiddleware, ctrl.listDeals);
router.post('/', authMiddleware, ctrl.createDeal);
router.post('/convert-from-reply', authMiddleware, ctrl.convertFromReply);
router.patch('/:id', authMiddleware, ctrl.updateDeal);
router.post('/:id/notes', authMiddleware, ctrl.addNote);

module.exports = router;
