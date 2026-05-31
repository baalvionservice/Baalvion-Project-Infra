'use strict';

/**
 * Webhook subscriptions + delivery. Endpoints subscribe to event types ('*' = all);
 * dispatch() fans an event out to every matching endpoint as a queued delivery; the
 * delivery worker signs and POSTs each, retrying with exponential backoff up to
 * max_attempts. Signatures use the Stripe-style scheme in signing.js.
 */

const { Op } = require('sequelize');
const db = require('../models');
const config = require('../config/appConfig');
const { randomToken, signWebhook } = require('./signing');
const { Errors } = require('../utils/errors');
const logger = require('../utils/logger');

// ── endpoints ─────────────────────────────────────────────────────────────────

async function createEndpoint({ orgId, url, description, events = ['*'], mode = 'live', actorId }) {
    if (!/^https?:\/\//i.test(url)) throw Errors.badRequest('url must be http(s)');
    const ep = await db.WebhookEndpoint.create({
        org_id: orgId ?? null, url, description: description ?? null,
        secret: `whsec_${randomToken(24)}`, events: Array.isArray(events) && events.length ? events : ['*'],
        mode: mode === 'test' ? 'test' : 'live', created_by: actorId ?? null,
    });
    return ep.toJSON();
}

async function listEndpoints(orgScope, { status } = {}) {
    const where = {};
    if (orgScope) where.org_id = orgScope;
    if (status) where.status = status;
    const rows = await db.WebhookEndpoint.findAll({ where, order: [['created_at', 'DESC']] });
    return rows.map((r) => r.toJSON());
}

async function getEndpoint(id, orgScope) {
    const ep = await db.WebhookEndpoint.findByPk(id);
    if (!ep) throw Errors.notFound('Webhook endpoint not found');
    if (orgScope && ep.org_id && ep.org_id !== orgScope) throw Errors.forbidden('Endpoint belongs to another organization');
    return ep;
}

async function updateEndpoint(id, data, orgScope) {
    const ep = await getEndpoint(id, orgScope);
    const patch = {};
    for (const k of ['url', 'description', 'events', 'status', 'mode']) if (data[k] !== undefined) patch[k] = data[k];
    if (patch.url && !/^https?:\/\//i.test(patch.url)) throw Errors.badRequest('url must be http(s)');
    patch.updated_at = new Date();
    await ep.update(patch);
    return ep.toJSON();
}

async function rollSecret(id, orgScope) {
    const ep = await getEndpoint(id, orgScope);
    await ep.update({ secret: `whsec_${randomToken(24)}`, updated_at: new Date() });
    return ep.toJSON();
}

async function deleteEndpoint(id, orgScope) {
    const ep = await getEndpoint(id, orgScope);
    await ep.destroy();
    return { id, deleted: true };
}

// ── dispatch + delivery ─────────────────────────────────────────────────────────

function endpointSubscribes(ep, eventType) {
    const evs = ep.events || ['*'];
    return evs.includes('*') || evs.includes(eventType) || evs.some((e) => e.endsWith('.*') && eventType.startsWith(e.slice(0, -1)));
}

/** Fan an event out to all matching active endpoints (org-scoped + platform listeners). */
async function dispatch({ orgId = null, eventType, payload = {} }) {
    const where = { status: 'active' };
    where[Op.or] = orgId ? [{ org_id: orgId }, { org_id: null }] : [{ org_id: null }];
    const endpoints = await db.WebhookEndpoint.findAll({ where });
    const targets = endpoints.filter((ep) => endpointSubscribes(ep, eventType));
    const created = [];
    for (const ep of targets) {
        const del = await db.WebhookDelivery.create({
            endpoint_id: ep.id, org_id: ep.org_id, event_type: eventType,
            payload, max_attempts: config.webhooks.maxAttempts, status: 'pending', next_attempt_at: new Date(),
        });
        created.push(del.id);
    }
    return { dispatched: created.length, deliveryIds: created };
}

/** Send one delivery now. Marks delivered on 2xx, schedules a retry otherwise. */
async function attemptDelivery(delivery) {
    const ep = await db.WebhookEndpoint.findByPk(delivery.endpoint_id);
    if (!ep || ep.status !== 'active') {
        await delivery.update({ status: 'failed', last_error: 'endpoint missing or disabled', next_attempt_at: null });
        return { id: delivery.id, status: 'failed' };
    }
    const envelope = {
        id: delivery.event_id, type: delivery.event_type, created: Math.floor(Date.now() / 1000),
        data: delivery.payload, attempt: delivery.attempts + 1,
    };
    const body = JSON.stringify(envelope);
    const sig = signWebhook(ep.secret, body);

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), config.webhooks.timeoutMs);
    let statusCode = 0; let errText = null; let snippet = null;
    try {
        const res = await fetch(ep.url, {
            method: 'POST', signal: controller.signal,
            headers: {
                'Content-Type': 'application/json',
                [config.webhooks.signatureHeader]: sig.header,
                'X-Baalvion-Event': delivery.event_type,
                'X-Baalvion-Delivery': delivery.id,
            },
            body,
        });
        statusCode = res.status;
        snippet = (await res.text().catch(() => '')).slice(0, 500);
    } catch (err) {
        errText = err.name === 'AbortError' ? 'timeout' : err.message;
    } finally {
        clearTimeout(timer);
    }

    const attempts = delivery.attempts + 1;
    if (statusCode >= 200 && statusCode < 300) {
        await delivery.update({ status: 'delivered', attempts, last_status_code: statusCode, response_snippet: snippet, delivered_at: new Date(), next_attempt_at: null, last_error: null });
        return { id: delivery.id, status: 'delivered', statusCode };
    }
    if (attempts >= delivery.max_attempts) {
        await delivery.update({ status: 'failed', attempts, last_status_code: statusCode || null, last_error: errText || `HTTP ${statusCode}`, response_snippet: snippet, next_attempt_at: null });
        return { id: delivery.id, status: 'failed', statusCode };
    }
    const backoff = config.webhooks.backoffSec[Math.min(attempts - 1, config.webhooks.backoffSec.length - 1)] || 600;
    await delivery.update({ status: 'retrying', attempts, last_status_code: statusCode || null, last_error: errText || `HTTP ${statusCode}`, response_snippet: snippet, next_attempt_at: new Date(Date.now() + backoff * 1000) });
    return { id: delivery.id, status: 'retrying', statusCode, retryInSec: backoff };
}

async function dueDeliveries(now = new Date(), limit = 50) {
    return db.WebhookDelivery.findAll({
        where: { status: { [Op.in]: ['pending', 'retrying'] }, next_attempt_at: { [Op.lte]: now } },
        order: [['next_attempt_at', 'ASC']], limit,
    });
}

async function listDeliveries(orgScope, { endpointId, status, limit = 50, offset = 0 } = {}) {
    const where = {};
    if (orgScope) where.org_id = orgScope;
    if (endpointId) where.endpoint_id = endpointId;
    if (status) where.status = status;
    const { rows, count } = await db.WebhookDelivery.findAndCountAll({
        where, order: [['created_at', 'DESC']], limit: Math.min(Number(limit) || 50, 200), offset: Number(offset) || 0,
    });
    return { items: rows.map((r) => r.toJSON()), total: count };
}

/** Re-queue a delivery (manual redeliver from the dashboard). */
async function redeliver(deliveryId, orgScope) {
    const del = await db.WebhookDelivery.findByPk(deliveryId);
    if (!del) throw Errors.notFound('Delivery not found');
    if (orgScope && del.org_id && del.org_id !== orgScope) throw Errors.forbidden('Delivery belongs to another organization');
    await del.update({ status: 'pending', next_attempt_at: new Date() });
    return { id: del.id, status: 'pending' };
}

/** Send a synthetic event to one endpoint right now (dashboard "send test"). */
async function sendTest(endpointId, orgScope, eventType = 'ping') {
    const ep = await getEndpoint(endpointId, orgScope);
    const del = await db.WebhookDelivery.create({
        endpoint_id: ep.id, org_id: ep.org_id, event_type: eventType,
        payload: { message: 'This is a test event from the Baalvion Developer Platform.', ts: new Date().toISOString() },
        max_attempts: 1, status: 'pending', next_attempt_at: new Date(),
    });
    const result = await attemptDelivery(del);
    return result;
}

module.exports = {
    createEndpoint, listEndpoints, getEndpoint, updateEndpoint, rollSecret, deleteEndpoint,
    endpointSubscribes, dispatch, attemptDelivery, dueDeliveries, listDeliveries, redeliver, sendTest,
};
