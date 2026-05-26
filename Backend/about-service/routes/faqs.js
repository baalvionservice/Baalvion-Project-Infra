'use strict';
const router = require('express').Router();
const { authMiddleware } = require('../middleware/authMiddleware');
const ctrl = require('../controller/faqController');

router.get('/', ctrl.listFaqs);
router.post('/', authMiddleware, ctrl.createFaq);
router.get('/:id', ctrl.getFaq);
router.patch('/:id', authMiddleware, ctrl.updateFaq);
router.delete('/:id', authMiddleware, ctrl.deleteFaq);
router.post('/:id/helpful', ctrl.markHelpful);

module.exports = router;
