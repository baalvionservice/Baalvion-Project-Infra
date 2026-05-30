'use strict';
const router = require('express').Router();
const ctrl = require('../controller/creatorsController');
const { authMiddleware } = require('../middleware/authMiddleware');

router.get('/', ctrl.listCreators);
// Static verification routes MUST precede '/:id' so they aren't captured as an id.
router.get('/verifications/pending', authMiddleware, ctrl.listPendingVerifications);
router.post('/me/verification/request', authMiddleware, ctrl.requestVerification);
router.get('/:id', ctrl.getCreator);
router.patch('/:id', authMiddleware, ctrl.updateCreator);
router.get('/:id/articles', ctrl.getCreatorArticles);
router.get('/:userId/verification', ctrl.getVerificationStatus);
router.post('/:userId/verification/decide', authMiddleware, ctrl.decideVerification);

module.exports = router;
