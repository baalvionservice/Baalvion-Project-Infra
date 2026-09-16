'use strict';
// Duty settlement routes (Compression, Phase 5).
// Mounted at /v1/duty. Every movement endpoint demands an Idempotency-Key — the
// customs gateway retries, and a duplicated settle is real money.
const router = require('express').Router();
const { authMiddleware } = require('../middleware/authMiddleware');
const ctrl = require('../controller/dutyController');

router.get('/definition', ctrl.getDefinition);

router.get('/accounts',   authMiddleware, ctrl.listAccounts);
router.post('/accounts',  authMiddleware, ctrl.openAccount);

router.post('/fx_locks',             authMiddleware, ctrl.createFxLock);
router.post('/fx_locks/:id/convert', authMiddleware, ctrl.convert);

router.get('/accounts/:id',              authMiddleware, ctrl.getAccount);
router.get('/accounts/:id/audit',        authMiddleware, ctrl.audit);
router.post('/accounts/:id/sufficiency', authMiddleware, ctrl.sufficiency);
router.post('/accounts/:id/:movement',   authMiddleware, ctrl.move);

module.exports = router;
