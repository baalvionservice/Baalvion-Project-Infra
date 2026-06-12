'use strict';
const crypto  = require('crypto');
const https   = require('https');
const http    = require('http');
const logger  = require('../utils/logger');
const { assertSafeUrl } = require('../utils/safeUrl');

const TIMEOUT_MS = 10_000;

// ── Signature ─────────────────────────────────────────────────────────────────

function signPayload(secret, payload) {
    const ts  = Date.now();
    const sig = crypto
        .createHmac('sha256', secret)
        .update(`${ts}.${payload}`)
        .digest('hex');
    return { ts, sig: `t=${ts},v1=${sig}` };
}

// ── HTTP delivery ─────────────────────────────────────────────────────────────

async function deliverHttp(webhookUrl, payload, headers) {
    // SSRF guard: validate the URL before making any outbound request
    const url = await assertSafeUrl(webhookUrl);

    return new Promise((resolve, reject) => {
        const body     = JSON.stringify(payload);
        const lib      = url.protocol === 'https:' ? https : http;
        const options  = {
            hostname:  url.hostname,
            port:      url.port || (url.protocol === 'https:' ? 443 : 80),
            path:      url.pathname + url.search,
            method:    'POST',
            headers: {
                'Content-Type':   'application/json',
                'Content-Length': Buffer.byteLength(body),
                'User-Agent':     'Baalvion-Webhooks/1.0',
                ...headers,
            },
        };

        const req = lib.request(options, (res) => {
            let data = '';
            res.on('data', (chunk) => { data += chunk; });
            res.on('end', () => {
                if (res.statusCode >= 200 && res.statusCode < 300) {
                    resolve({ status: res.statusCode, body: data.slice(0, 500) });
                } else {
                    reject(new Error(`HTTP ${res.statusCode}: ${data.slice(0, 200)}`));
                }
            });
        });

        req.setTimeout(TIMEOUT_MS, () => {
            req.destroy(new Error(`Webhook delivery timed out after ${TIMEOUT_MS}ms`));
        });
        req.on('error', reject);
        req.write(body);
        req.end();
    });
}

// ── Main deliver function ─────────────────────────────────────────────────────

async function deliverWebhook({ url, event, data, secret, webhookId }) {
    const payload = {
        id:        webhookId || crypto.randomUUID(),
        event,
        data,
        timestamp: new Date().toISOString(),
    };

    const headers = {};
    if (secret) {
        const { sig } = signPayload(secret, JSON.stringify(payload));
        headers['X-Baalvion-Signature-256'] = sig;
    }
    headers['X-Baalvion-Event'] = event;
    headers['X-Baalvion-Delivery'] = payload.id;

    const result = await deliverHttp(url, payload, headers);
    logger.info({ url, event, webhookId: payload.id, status: result.status }, 'Webhook delivered');
    return result;
}

module.exports = { deliverWebhook, signPayload };
