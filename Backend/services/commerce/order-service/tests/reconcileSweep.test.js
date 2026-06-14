'use strict';
// Scheduled reconciliation sweep — per-store decision logic: alert on drift, alert on ledger
// unreachable, auto-backfill when enabled. reconciliationService + alerts are stubbed.
process.env.JWT_PUBLIC_KEY = process.env.JWT_PUBLIC_KEY || 'dummy';
process.env.CART_SESSION_SECRET = process.env.CART_SESSION_SECRET || 'test';

const { test, beforeEach } = require('node:test');
const assert = require('node:assert');

const config = require('../config/appConfig');
const reconciliationService = require('../service/reconciliationService');
const alerts = require('../service/alerts');
const { reconcileStore } = require('../queues/reconciliationQueue');

const STORE = 'store-1';
const range = { from: '2026-01-01T00:00:00Z', to: '2026-06-01T00:00:00Z' };

let alertCalls;
let backfillCalls;
beforeEach(() => {
    alertCalls = [];
    backfillCalls = [];
    alerts.reconciliationDrift = async (storeId, report) => { alertCalls.push({ type: 'drift', storeId, report }); };
    alerts.ledgerUnavailable = async (storeId, reason) => { alertCalls.push({ type: 'ledger_unavailable', storeId, reason }); };
    reconciliationService.backfill = async (storeId, r) => { backfillCalls.push({ storeId, r }); return { storeId, attempted: 1, posted: 1, failed: 0 }; };
    config.reconcile.autoBackfill = false;
});

test('balanced store: no alert, no backfill', async () => {
    reconciliationService.report = async () => ({ ledgerAvailable: true, balanced: true, counts: { missing: 0, mismatched: 0 }, totals: {} });
    const out = await reconcileStore(STORE, range);
    assert.equal(out.balanced, true);
    assert.equal(alertCalls.length, 0);
    assert.equal(backfillCalls.length, 0);
});

test('drift with auto-backfill OFF: drift alert fired, no backfill', async () => {
    reconciliationService.report = async () => ({ ledgerAvailable: true, balanced: false, counts: { missing: 2, mismatched: 1 }, totals: { netMinor: 5000 } });
    const out = await reconcileStore(STORE, range);
    assert.equal(out.drift, true);
    assert.equal(alertCalls.filter((c) => c.type === 'drift').length, 1);
    assert.equal(backfillCalls.length, 0);
});

test('drift with auto-backfill ON: drift alert + backfill executed', async () => {
    config.reconcile.autoBackfill = true;
    reconciliationService.report = async () => ({ ledgerAvailable: true, balanced: false, counts: { missing: 2, mismatched: 0 }, totals: { netMinor: 5000 } });
    const out = await reconcileStore(STORE, range);
    assert.equal(alertCalls.filter((c) => c.type === 'drift').length, 1);
    assert.equal(backfillCalls.length, 1, 'backfill ran');
    assert.equal(out.backfilled.posted, 1);
});

test('ledger unreachable: ledger-unavailable alert, no drift alert', async () => {
    reconciliationService.report = async () => ({ ledgerAvailable: false, reason: 'ledger_unreachable' });
    const out = await reconcileStore(STORE, range);
    assert.equal(out.ledgerAvailable, false);
    assert.equal(alertCalls.filter((c) => c.type === 'ledger_unavailable').length, 1);
    assert.equal(alertCalls.filter((c) => c.type === 'drift').length, 0);
});
