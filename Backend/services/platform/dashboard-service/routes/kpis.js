'use strict';
const { Router } = require('express');
const ctrl = require('../controller/kpiController');
const { authMiddleware } = require('../middleware/authMiddleware');
const router = Router();

router.get('/', authMiddleware, ctrl.listKPIs);
router.post('/', authMiddleware, ctrl.createKPI);
router.patch('/:id', authMiddleware, ctrl.updateKPI);

module.exports = router;
