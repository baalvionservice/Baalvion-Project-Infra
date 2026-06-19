'use strict';
/**
 * Thin HTTP client to inventory-service — the AUTHORITATIVE, cross-service oversell guard for
 * unique luxury items (a single bag must never be reserved by two checkouts).
 *
 * Endpoints (see inventory-service routes/v1.js):
 *   reserve  POST   {apiPrefix}/inventory/stores/:storeId/locks                 → { lockId, ... }
 *   confirm  POST   {apiPrefix}/inventory/stores/:storeId/locks/:lockId/confirm  body { orderId }
 *   release  POST   {apiPrefix}/inventory/stores/:storeId/locks/:lockId/release
 *
 * Auth: X-Internal-Key (matches inventory-service INVENTORY_INTERNAL_KEY). The `confirm` endpoint is
 * internal-only there; reserve/release are guest-capable but we always send the key as the trusted
 * order-service caller.
 *
 * FAIL POLICY (mirrors the ledger client's posture, but with one hard-fail case):
 *   - reserve():
 *       • success            → { ok: true, lockId, status: 201 }
 *       • 409 CONFLICT        → { ok: false, conflict: true, status: 409 }  ← SKU is tracked AND out
 *                                of stock → the CALLER must hard-fail the order (do not place it).
 *       • disabled / network / timeout / any other status → { ok: false, failOpen: true, ... }
 *                                ← treat as "inventory unavailable", proceed with the order
 *                                (fail-open) and rely on reconciliation/alerts.
 *   - confirm() / release(): always fail-open (never throw into the payment/cancel path). They are
 *       idempotent server-side, so an at-least-once retry/backfill is safe.
 *
 * `variantId` is the inventory stock key (== sku in inventory-service). Callers pass the resolved
 * line `sku` as `variantId`/`sku` (either alias accepted).
 */
const config = require('../config/appConfig');

function baseHeaders() {
    return {
        'Content-Type': 'application/json',
        'X-Internal-Key': config.inventory.internalKey,
        'X-Service-Name': 'order-service',
    };
}

async function postJson(url, body) {
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), config.inventory.timeoutMs);
    try {
        const res = await fetch(url, {
            method: 'POST',
            headers: baseHeaders(),
            body: JSON.stringify(body || {}),
            signal: ctrl.signal,
        });
        let payload = null;
        try { payload = await res.json(); } catch { /* non-JSON body — leave null */ }
        return { res, payload };
    } finally {
        clearTimeout(timer);
    }
}

/**
 * Reserve `quantity` of a tracked variant/sku for `userId` (best-effort hold; oversell-safe server
 * side). Returns a discriminated result — see FAIL POLICY above. NEVER throws.
 */
async function reserve(storeId, { variantId, sku, quantity = 1, productId = null, userId = null } = {}) {
    const key = variantId || sku;
    if (!config.inventory.enabled) {
        console.info(JSON.stringify({ evt: 'inventory.reserve_skipped', reason: 'not_configured', storeId, sku: key }));
        return { ok: false, failOpen: true, skipped: true };
    }
    if (!key) {
        // No resolvable stock key → nothing to reserve. Best-effort: proceed (fail-open).
        return { ok: false, failOpen: true, reason: 'no_sku' };
    }
    const url = `${config.inventory.baseUrl}${config.inventory.apiPrefix}/inventory/stores/${encodeURIComponent(storeId)}/locks`;
    try {
        const { res, payload } = await postJson(url, { variantId: key, productId, userId, quantity });
        if (res.status === 201) {
            const lockId = payload && payload.data && payload.data.lockId;
            if (!lockId) {
                // 201 without a lockId is anomalous — treat as fail-open rather than blocking checkout.
                console.error(JSON.stringify({ evt: 'inventory.reserve_anomaly', storeId, sku: key, status: 201 }));
                return { ok: false, failOpen: true, reason: 'no_lock_id' };
            }
            return { ok: true, lockId, status: 201 };
        }
        if (res.status === 409) {
            // Tracked AND out of stock — the only HARD-FAIL case. Caller rejects the order + releases.
            const detail = payload && payload.error;
            console.warn(JSON.stringify({ evt: 'inventory.reserve_conflict', storeId, sku: key, detail }));
            return { ok: false, conflict: true, status: 409, detail };
        }
        // Any other status (404 untracked sku, 5xx, auth, etc.) → fail-open (proceed with the order).
        console.error(JSON.stringify({ evt: 'inventory.reserve_failopen', storeId, sku: key, status: res.status }));
        return { ok: false, failOpen: true, status: res.status };
    } catch (err) {
        // Network error / timeout / abort → inventory unreachable → fail-open.
        console.error(JSON.stringify({ evt: 'inventory.reserve_failopen', storeId, sku: key, error: err.message }));
        return { ok: false, failOpen: true, error: err.message };
    }
}

/** Confirm a hold into a committed decrement at payment capture. Idempotent; fail-open. */
async function confirm(storeId, lockId, orderId) {
    if (!config.inventory.enabled || !lockId) return { ok: false, skipped: true };
    const url = `${config.inventory.baseUrl}${config.inventory.apiPrefix}/inventory/stores/${encodeURIComponent(storeId)}/locks/${encodeURIComponent(lockId)}/confirm`;
    try {
        const { res } = await postJson(url, { orderId });
        if (res.ok) return { ok: true };
        console.error(JSON.stringify({ evt: 'inventory.confirm_failed', storeId, lockId, orderId, status: res.status }));
        return { ok: false, status: res.status };
    } catch (err) {
        console.error(JSON.stringify({ evt: 'inventory.confirm_failed', storeId, lockId, orderId, error: err.message }));
        return { ok: false, error: err.message };
    }
}

/** Release a hold (cancel / payment failure / compensating rollback of a partial order). Fail-open. */
async function release(storeId, lockId) {
    if (!config.inventory.enabled || !lockId) return { ok: false, skipped: true };
    const url = `${config.inventory.baseUrl}${config.inventory.apiPrefix}/inventory/stores/${encodeURIComponent(storeId)}/locks/${encodeURIComponent(lockId)}/release`;
    try {
        const { res } = await postJson(url, {});
        if (res.ok) return { ok: true };
        console.error(JSON.stringify({ evt: 'inventory.release_failed', storeId, lockId, status: res.status }));
        return { ok: false, status: res.status };
    } catch (err) {
        console.error(JSON.stringify({ evt: 'inventory.release_failed', storeId, lockId, error: err.message }));
        return { ok: false, error: err.message };
    }
}

module.exports = { reserve, confirm, release };
