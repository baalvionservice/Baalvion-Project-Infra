'use strict';
const express = require('express');
const ctrl = require('../controllers/searchController');
const asyncHandler = require('../utils/asyncHandler');
const { authenticate, internalOrUser } = require('../middleware/authMiddleware');
const { tenantMiddleware } = require('@baalvion/tenancy');

const router = express.Router();

// Establish the tenant context (after auth) so searches are tenant-scoped; super_admin bypasses.
const tenantCtx = tenantMiddleware();

// ── Search (read) — tenant-scoped ───────────────────────────────────────────────
router.get('/search/:index',          authenticate, tenantCtx, asyncHandler(ctrl.search));
router.post('/search/:index',         authenticate, tenantCtx, asyncHandler(ctrl.searchPost));
router.post('/search/:index/facets',  authenticate, tenantCtx, asyncHandler(ctrl.facets));
router.get('/autocomplete/:index',    authenticate, tenantCtx, asyncHandler(ctrl.autocomplete));
router.get('/indices',                authenticate, asyncHandler(ctrl.listIndices));

// ── Indexing (write) — service producers via X-Internal-Key, or privileged user ──
router.post('/index/:index',          internalOrUser, tenantCtx, asyncHandler(ctrl.indexDoc));
router.post('/index/:index/bulk',     internalOrUser, tenantCtx, asyncHandler(ctrl.bulk));
router.patch('/index/:index/:id',     internalOrUser, tenantCtx, asyncHandler(ctrl.updateDoc));
router.delete('/index/:index/:id',    internalOrUser, tenantCtx, asyncHandler(ctrl.deleteDoc));

// ── Admin ────────────────────────────────────────────────────────────────────────
router.post('/admin/indices',         internalOrUser, asyncHandler(ctrl.ensureIndices));

module.exports = router;
