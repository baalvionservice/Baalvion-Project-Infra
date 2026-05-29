'use strict';
const router = require('express').Router();
const { authMiddleware } = require('../middleware/authMiddleware');
const ctrl = require('../controller/lawyerController');

router.get('/',              ctrl.listLawyers);
router.get('/countries',     ctrl.countriesSummary);
router.get('/search',        ctrl.searchLawyers);
router.get('/me',            authMiddleware, ctrl.getMyProfile);
router.post('/',             authMiddleware, ctrl.createLawyer);
router.get('/:id',           ctrl.getLawyer);
router.patch('/:id',         authMiddleware, ctrl.updateLawyer);
router.delete('/:id',        authMiddleware, ctrl.deleteLawyer);
router.get('/:id/availability',    ctrl.getAvailability);
router.patch('/:id/availability',  authMiddleware, ctrl.updateAvailability);
router.post('/:id/verify',         authMiddleware, ctrl.verifyLawyer);

module.exports = router;
