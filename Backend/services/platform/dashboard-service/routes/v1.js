'use strict';
const router = require('express').Router();

// ── Existing routes (DO NOT MODIFY) ─────────────────────────────────────────
router.use('/dashboards', require('./dashboards'));
router.use('/widgets', require('./widgets'));
router.use('/data-sources', require('./dataSources'));
router.use('/metrics', require('./metrics'));
router.use('/reports', require('./reports'));

// ── Company dashboard summary ────────────────────────────────────────────────
router.use('/', require('./company'));

// ── Domains / Businesses ─────────────────────────────────────────────────────
router.use('/domains', require('./domains'));

// ── Financials ───────────────────────────────────────────────────────────────
router.use('/financials', require('./financials'));
router.use('/profit', require('./profit'));

// ── Shareholders & Equity ────────────────────────────────────────────────────
router.use('/shareholders', require('./shareholders'));
router.use('/distribution', require('./distribution'));

// ── Employees ────────────────────────────────────────────────────────────────
router.use('/employees', require('./employees'));

// ── Tasks ────────────────────────────────────────────────────────────────────
router.use('/tasks', require('./tasks'));

// ── Transactions ─────────────────────────────────────────────────────────────
router.use('/transactions', require('./transactions'));

// ── KPIs ─────────────────────────────────────────────────────────────────────
router.use('/kpis', require('./kpis'));

// ── Compliance ───────────────────────────────────────────────────────────────
router.use('/compliance', require('./compliance'));

// ── Audit ────────────────────────────────────────────────────────────────────
router.use('/audit', require('./audit'));

// ── Permissions ──────────────────────────────────────────────────────────────
router.use('/permissions', require('./permissions'));

// ── Generated Reports ────────────────────────────────────────────────────────
router.use('/reports', require('./reportRoutes'));

// ── Shareholder Portal ───────────────────────────────────────────────────────
router.use('/portal', require('./portal'));

// ── Notifications ────────────────────────────────────────────────────────────
router.use('/notifications', require('./notifications'));

// ── Operations / Alerts ──────────────────────────────────────────────────────
router.use('/operations', require('./operations'));

// ── Analytics (aggregated) ───────────────────────────────────────────────────
router.use('/analytics', require('./analytics'));

// ── Reference panels (countries / corporate-actions / fx-rates) ──────────────
router.use('/', require('./extras'));

module.exports = router;
