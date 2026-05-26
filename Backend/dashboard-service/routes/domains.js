'use strict';
const { Router } = require('express');
const ctrl = require('../controller/domainController');
const { authMiddleware } = require('../middleware/authMiddleware');
const router = Router();

router.get('/', authMiddleware, ctrl.listDomains);
router.post('/', authMiddleware, ctrl.createDomain);
router.get('/:id', authMiddleware, ctrl.getDomain);
router.patch('/:id', authMiddleware, ctrl.updateDomain);
router.delete('/:id', authMiddleware, ctrl.deleteDomain);

module.exports = router;
