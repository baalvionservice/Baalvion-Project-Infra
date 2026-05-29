'use strict';
// Outbound webhook event bus. emit() finds active webhooks subscribed to an event
// (company-scoped or global) and delivers an HMAC-SHA256 signed POST, logging every
// attempt. Fully functional with no third-party account. Fire-and-forget for callers.
const crypto = require('crypto');
const db = require('../models');

const TIMEOUT_MS = 5000;
const MAX_ATTEMPTS = 2;

function sign(secret, body) {
    return 'sha256=' + crypto.createHmac('sha256', secret).update(body).digest('hex');
}

async function postOnce(webhook, event, body, attempt) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
    let response_status = null, response_body = '', ok = false;
    try {
        const res = await fetch(webhook.url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'User-Agent': 'Baalvion-CTM-Webhooks/1',
                'X-Baalvion-Event': event,
                'X-Baalvion-Delivery': crypto.randomUUID(),
                'X-Baalvion-Signature': sign(webhook.secret, body),
            },
            body,
            signal: controller.signal,
        });
        response_status = res.status;
        response_body = (await res.text().catch(() => '')).slice(0, 2000);
        ok = res.status >= 200 && res.status < 300;
    } catch (e) {
        response_body = String(e.message || e).slice(0, 2000);
    } finally {
        clearTimeout(timer);
    }
    await db.webhook_deliveries.create({
        webhook_id: webhook.id, event, status: ok ? 'Success' : 'Failed',
        request_payload: JSON.parse(body), response_status, response_body, attempt,
    }).catch(() => {});
    return ok;
}

async function deliver(webhook, event, envelope) {
    const body = JSON.stringify(envelope);
    let ok = false;
    for (let attempt = 1; attempt <= MAX_ATTEMPTS && !ok; attempt++) {
        ok = await postOnce(webhook, event, body, attempt);
    }
    try {
        webhook.last_triggered_at = new Date();
        webhook.failure_count = ok ? 0 : (webhook.failure_count || 0) + 1;
        if (!ok && webhook.failure_count >= 10) webhook.status = 'Error';
        await webhook.save();
    } catch { /* */ }
    return ok;
}

async function emit(event, data, opts = {}) {
    try {
        const { Op } = require('sequelize');
        const where = {
            status: 'Active',
            events: { [Op.contains]: [event] },
        };
        if (opts.companyId) where[Op.or] = [{ company_id: opts.companyId }, { company_id: null }];
        const hooks = await db.webhooks.findAll({ where });
        const envelope = { id: crypto.randomUUID(), event, created_at: new Date().toISOString(), data };
        // Fire-and-forget; never block the request that triggered the event.
        for (const h of hooks) deliver(h, event, envelope);
        await db.integration_logs.create({
            source: 'Webhook', event_type: event, status: 'Success',
            description: `Dispatched '${event}' to ${hooks.length} webhook(s)`,
            related_entity: opts.related || {},
        }).catch(() => {});
    } catch { /* telemetry must never break the caller */ }
}

module.exports = { emit, deliver, sign, newSecret: () => 'whsec_' + crypto.randomBytes(24).toString('hex') };
