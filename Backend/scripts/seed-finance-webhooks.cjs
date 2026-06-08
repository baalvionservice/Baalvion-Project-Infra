#!/usr/bin/env node
'use strict';
/**
 * Idempotent seed for the money-spine payment-completion webhook cascade.
 *
 * Registers the audit-service -> order-execution-service (oes) webhook subscription so that
 * `payments.transaction.completed` events fan out as HMAC-signed webhooks to oes, which then
 * cascades the order to payment_confirmed.
 *
 * This subscription is otherwise only created MANUALLY at runtime and is lost on a fresh start,
 * so this script must be run after every fresh bring-up of the `baalvion-financial` stack.
 *
 *   node Backend/scripts/seed-finance-webhooks.cjs
 *
 * Config (env, with verified-live defaults):
 *   AUDIT_URL                 audit-service base url        (default http://127.0.0.1:13020)
 *   OES_FINANCE_WEBHOOK_URL   oes finance-events sink       (default http://host.docker.internal:3052/v1/internal/finance-events)
 *   FINANCE_WEBHOOK_SECRET    shared HMAC secret (>=32 ch)  (default dev_finance_webhook_secret_change_me_min32)
 *   TENANT_ID                 X-Tenant-ID for the sub       (default 11111111-1111-1111-1111-111111111111)
 *   EVENT_PATTERN             Java regex (dots UNESCAPED)   (default payments.transaction.completed)
 *
 * Idempotent: GETs existing subscriptions first and skips if one already targets the same
 * url + eventPattern; otherwise POSTs to create. Exits non-zero on any failure.
 */

const AUDIT_URL = (process.env.AUDIT_URL || 'http://127.0.0.1:13020').replace(/\/+$/, '');
const OES_FINANCE_WEBHOOK_URL =
    process.env.OES_FINANCE_WEBHOOK_URL || 'http://host.docker.internal:3052/v1/internal/finance-events';
const FINANCE_WEBHOOK_SECRET =
    process.env.FINANCE_WEBHOOK_SECRET || 'dev_finance_webhook_secret_change_me_min32';
const TENANT_ID = process.env.TENANT_ID || '11111111-1111-1111-1111-111111111111';
const EVENT_PATTERN = process.env.EVENT_PATTERN || 'payments.transaction.completed';

const WEBHOOKS_PATH = '/api/v1/audit/webhooks';

function log(msg) {
    console.log(`[seed-finance-webhooks] ${msg}`);
}

async function readBody(res) {
    const text = await res.text();
    if (!text) return null;
    try {
        return JSON.parse(text);
    } catch {
        return text;
    }
}

// The audit GET returns a Spring Page ({ content: [...] }); tolerate a bare array too.
function extractSubscriptions(body) {
    if (Array.isArray(body)) return body;
    if (body && Array.isArray(body.content)) return body.content;
    return [];
}

async function listSubscriptions() {
    const url = `${AUDIT_URL}${WEBHOOKS_PATH}`;
    let res;
    try {
        res = await fetch(url, { headers: { 'X-Tenant-ID': TENANT_ID } });
    } catch (err) {
        throw new Error(`GET ${url} failed (is audit-service up at ${AUDIT_URL}?): ${err.message}`);
    }
    const body = await readBody(res);
    if (!res.ok) {
        throw new Error(`GET ${url} returned ${res.status}: ${JSON.stringify(body)}`);
    }
    return extractSubscriptions(body);
}

async function createSubscription() {
    const url = `${AUDIT_URL}${WEBHOOKS_PATH}`;
    const payload = {
        url: OES_FINANCE_WEBHOOK_URL,
        secret: FINANCE_WEBHOOK_SECRET,
        eventPattern: EVENT_PATTERN,
    };
    let res;
    try {
        res = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'X-Tenant-ID': TENANT_ID },
            body: JSON.stringify(payload),
        });
    } catch (err) {
        throw new Error(`POST ${url} failed: ${err.message}`);
    }
    const body = await readBody(res);
    if (!res.ok) {
        throw new Error(`POST ${url} returned ${res.status}: ${JSON.stringify(body)}`);
    }
    return body;
}

async function main() {
    if (!FINANCE_WEBHOOK_SECRET || FINANCE_WEBHOOK_SECRET.length < 32) {
        throw new Error('FINANCE_WEBHOOK_SECRET must be at least 32 characters.');
    }

    log(`audit-service : ${AUDIT_URL}`);
    log(`tenant        : ${TENANT_ID}`);
    log(`target url    : ${OES_FINANCE_WEBHOOK_URL}`);
    log(`event pattern : ${EVENT_PATTERN}`);

    const existing = await listSubscriptions();
    // Treat only ACTIVE subscriptions as a match: a soft-deleted (active:false) row still appears
    // in the list but no longer delivers, so we must re-create it.
    const match = existing.find(
        (s) =>
            s &&
            s.url === OES_FINANCE_WEBHOOK_URL &&
            s.eventPattern === EVENT_PATTERN &&
            s.active !== false,
    );

    if (match) {
        log(
            `SKIP: subscription already exists (id=${match.id || 'unknown'}, active=${match.active}). Nothing to do.`,
        );
        return;
    }

    log('No matching subscription found — creating it...');
    const created = await createSubscription();
    log(`CREATED: subscription id=${created && created.id ? created.id : 'unknown'}, active=${created ? created.active : 'unknown'}.`);
}

main()
    .then(() => {
        log('done.');
        process.exit(0);
    })
    .catch((err) => {
        console.error(`[seed-finance-webhooks] ERROR: ${err.message}`);
        process.exit(1);
    });
