'use strict';
/**
 * Operational alerting for finance/reconciliation health.
 *
 * Alerts are delivered to ops via notification-service (POST /v1/notifications/dispatch,
 * authenticated with the shared internal key). Every alert is ALSO written to stdout as a
 * structured log line so it is captured even when notification-service is down or unconfigured.
 *
 * Fire-and-forget + fail-open: an alert must never throw into the caller (a reconciliation
 * sweep or a ledger post). If notifications are not configured, the structured log is the
 * guaranteed sink and the function is a no-op delivery.
 */
const config = require('../config/appConfig');

const SEVERITY = { INFO: 'info', WARN: 'warning', CRITICAL: 'critical' };

async function dispatch({ severity, title, body, data = {}, idempotencyKey }) {
    // Always log — the durable record of the alert.
    const line = { evt: 'ops.alert', severity, title, ...data };
    if (severity === SEVERITY.CRITICAL || severity === SEVERITY.WARN) console.error(JSON.stringify(line));
    else console.info(JSON.stringify(line));

    if (!config.notifications.enabled) return { delivered: false, reason: 'notifications_not_configured' };

    const url = `${config.notifications.baseUrl}${config.notifications.apiPrefix}/notifications/dispatch`;
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), config.notifications.timeoutMs);
    try {
        const payload = {
            channels: ['inapp', ...(config.notifications.opsEmail ? ['email'] : [])],
            idempotencyKey,
            inapp: { title, body, type: 'ops_alert', data },
        };
        if (config.notifications.opsUserId) payload.userId = config.notifications.opsUserId;
        if (config.notifications.opsEmail) {
            payload.recipients = { email: config.notifications.opsEmail };
            payload.email = { rawSubject: title, rawHtml: `<p>${body}</p>`, priority: 'high', data };
        }
        const res = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'X-Internal-Key': config.notifications.internalKey, 'X-Service-Name': 'order-service' },
            body: JSON.stringify(payload),
            signal: ctrl.signal,
        });
        return { delivered: res.ok, status: res.status };
    } catch (err) {
        console.error(JSON.stringify({ evt: 'ops.alert_delivery_failed', title, error: err.message }));
        return { delivered: false, error: err.message };
    } finally {
        clearTimeout(timer);
    }
}

/** Reconciliation found unmatched/mismatched money movements for a store. */
async function reconciliationDrift(storeId, report) {
    const { counts = {}, totals = {} } = report || {};
    return dispatch({
        severity: SEVERITY.CRITICAL,
        title: `Reconciliation drift: store ${storeId}`,
        body: `${counts.missing || 0} missing and ${counts.mismatched || 0} mismatched ledger entries (net ${(totals.netMinor || 0) / 100}).`,
        data: { storeId, missing: counts.missing || 0, mismatched: counts.mismatched || 0, netMinor: totals.netMinor || 0 },
        idempotencyKey: `recon-drift:${storeId}:${counts.missing || 0}:${counts.mismatched || 0}`,
    });
}

/** The ledger could not be reached during a reconciliation sweep (posting is likely failing too). */
async function ledgerUnavailable(storeId, reason) {
    return dispatch({
        severity: SEVERITY.CRITICAL,
        title: `Ledger unavailable for store ${storeId}`,
        body: `Reconciliation could not reach the ledger (${reason}). Payment journal entries are not being recorded — investigate ledger-service.`,
        data: { storeId, reason },
        idempotencyKey: `ledger-unavailable:${storeId}:${reason}`,
    });
}

module.exports = { dispatch, reconciliationDrift, ledgerUnavailable, SEVERITY };
