'use strict';
const { Router } = require('express');
const ctrl = require('../controller/financialController');
const { authMiddleware } = require('../middleware/authMiddleware');
const router = Router();

router.get('/', authMiddleware, ctrl.listFinancials);
router.post('/', authMiddleware, ctrl.createFinancial);
router.get('/domain/:domain_id', authMiddleware, ctrl.getFinancialsByDomain);
router.get('/:id', authMiddleware, ctrl.getFinancial);

module.exports = router;
