'use strict';
const router = require('express').Router();
const { authMiddleware, requireRole } = require('../middleware/authMiddleware');
const db = require('../models');
const { makeCrud } = require('../controller/engagementController');

const ctrl = makeCrud(db.IrBoardMaterial);

// Board materials are board-only / MNPI — unlike filings they have no "published/public"
// notion. The list/get routes previously had NO auth, so an anonymous caller could read every
// board deck for the default org. Reads now require authentication + a senior role; the
// controller scopes by the authenticated org. requireRole is hierarchical (manager and above).
router.get('/', authMiddleware, requireRole('manager'), ctrl.list);
router.get('/:id', authMiddleware, requireRole('manager'), ctrl.get);
router.post('/', authMiddleware, requireRole('admin'), ctrl.create);
router.patch('/:id', authMiddleware, requireRole('admin'), ctrl.update);
router.delete('/:id', authMiddleware, requireRole('admin'), ctrl.remove);

module.exports = router;
