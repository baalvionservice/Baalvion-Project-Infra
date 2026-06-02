'use strict';
const express = require('express');
const ctrl = require('../controllers/auditController');
const asyncHandler = require('../utils/asyncHandler');
const { authenticate, internalOrUser } = require('../middleware/authMiddleware');
const { requireAuditReader } = require('../middleware/guards');

const router = express.Router();

// ── Write (services via X-Internal-Key, or a privileged user) ──────────────────
router.post('/audit',       internalOrUser, requireAuditReader, asyncHandler(ctrl.write));
router.post('/audit/batch', internalOrUser, requireAuditReader, asyncHandler(ctrl.writeBatch));

// ── Read / compliance (audit-reader role or audit:read) ────────────────────────
// NOTE: static segments declared before the :seq param so they match first.
router.get('/audit/verify', authenticate, requireAuditReader, asyncHandler(ctrl.verify));
router.get('/audit/export', authenticate, requireAuditReader, asyncHandler(ctrl.exportCsv));
router.get('/audit',        authenticate, requireAuditReader, asyncHandler(ctrl.list));
router.get('/audit/:seq',   authenticate, requireAuditReader, asyncHandler(ctrl.getOne));

module.exports = router;
