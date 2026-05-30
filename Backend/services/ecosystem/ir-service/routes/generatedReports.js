'use strict';
const router = require('express').Router();
const { authMiddleware } = require('../middleware/authMiddleware');
const db = require('../models');
const { makeCrud } = require('../controller/engagementController');

const ctrl = makeCrud(db.IrGeneratedReport);

router.get('/', ctrl.list);
router.get('/:id', ctrl.get);
router.post('/', authMiddleware, ctrl.create);
router.patch('/:id', authMiddleware, ctrl.update);
router.delete('/:id', authMiddleware, ctrl.remove);

module.exports = router;
