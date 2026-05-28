'use strict';
const router = require('express').Router();
const { authMiddleware } = require('../middleware/authMiddleware');
const ctrl = require('../controller/caseController');

router.get('/',                  authMiddleware, ctrl.listCases);
router.post('/',                 authMiddleware, ctrl.createCase);
router.get('/:id',               authMiddleware, ctrl.getCase);
router.patch('/:id',             authMiddleware, ctrl.updateCase);
router.patch('/:id/status',      authMiddleware, ctrl.updateCaseStatus);
router.post('/:id/assign',       authMiddleware, ctrl.assignLawyer);

module.exports = router;
