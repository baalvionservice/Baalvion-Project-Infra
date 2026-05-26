'use strict';
const router = require('express').Router();
const { authMiddleware } = require('../middleware/authMiddleware');
const {
    listCases, getCase, createCase, updateCase, clearCase, escalateCase,
} = require('../controller/complianceController');

router.get('/',                 authMiddleware, listCases);
router.get('/:id',              authMiddleware, getCase);
router.post('/',                authMiddleware, createCase);
router.put('/:id',              authMiddleware, updateCase);
router.patch('/:id',            authMiddleware, updateCase);
router.patch('/:id/clear',      authMiddleware, clearCase);
router.patch('/:id/escalate',   authMiddleware, escalateCase);

module.exports = router;
