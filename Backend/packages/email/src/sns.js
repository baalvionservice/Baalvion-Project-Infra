'use strict';

/**
 * Amazon SNS → SES event handling.
 *
 * SES is configured to publish Sends, Deliveries, Bounces, Complaints, Rejects, Delivery
 * Delays, Rendering Failures and Subscriptions to the `baalvion-ses-events` SNS topic. SNS
 * POSTs those to our webhook. This module:
 *   1. VERIFIES the SNS signature cryptographically (RSA-SHA1/256 over the canonical fields)
 *      so a forged request can't poison delivery status. The signing certificate is fetched
 *      only from an AWS host allowlist (SSRF guard) and cached.
 *   2. Handles SubscriptionConfirmation by confirming the subscription (opt-in).
 *   3. Parses Notification payloads into a normalized delivery status.
 *
 * No external deps — uses Node's built-in crypto/https/url.
 */

const crypto = require('crypto');
const https = require('https');
const { URL } = require('url');

// SNS signing certs are only ever served from amazonaws.com hosts. Reject anything else.
const ALLOWED_CERT_HOST = /^sns\.[a-z0-9-]+\.amazonaws\.com$/i;

// Fields included in the signature string, in order, per SNS message Type.
const SIGNABLE_KEYS = {
    Notification: ['Message', 'MessageId', 'Subject', 'Timestamp', 'TopicArn', 'Type'],
    SubscriptionConfirmation: ['Message', 'MessageId', 'SubscribeURL', 'Timestamp', 'Token', 'TopicArn', 'Type'],
    UnsubscribeConfirmation: ['Message', 'MessageId', 'SubscribeURL', 'Timestamp', 'Token', 'TopicArn', 'Type'],
};

const _certCache = new Map();

function fetchUrl(targetUrl, { maxBytes = 64 * 1024, timeoutMs = 5000 } = {}) {
    return new Promise((resolve, reject) => {
        let u;
        try { u = new URL(targetUrl); } catch { return reject(new Error('Invalid URL')); }
        if (u.protocol !== 'https:') return reject(new Error('Only https is allowed'));
        if (!ALLOWED_CERT_HOST.test(u.hostname)) return reject(new Error(`Disallowed host: ${u.hostname}`));

        const req = https.get(u, (res) => {
            if (res.statusCode !== 200) { res.resume(); return reject(new Error(`HTTP ${res.statusCode}`)); }
            let data = '';
            res.setEncoding('utf8');
            res.on('data', (c) => {
                data += c;
                if (data.length > maxBytes) { req.destroy(); reject(new Error('Response too large')); }
            });
            res.on('end', () => resolve(data));
        });
        req.on('error', reject);
        req.setTimeout(timeoutMs, () => req.destroy(new Error('Timeout')));
    });
}

async function getCert(certUrl) {
    if (_certCache.has(certUrl)) return _certCache.get(certUrl);
    const pem = await fetchUrl(certUrl);
    _certCache.set(certUrl, pem);
    return pem;
}

/** Build the exact string SNS signed. */
function canonicalString(message) {
    const keys = SIGNABLE_KEYS[message.Type];
    if (!keys) throw new Error(`Unsupported SNS message Type: ${message.Type}`);
    let str = '';
    for (const key of keys) {
        if (message[key] === undefined || message[key] === null) continue;
        str += `${key}\n${message[key]}\n`;
    }
    return str;
}

/**
 * Cryptographically verify an SNS message signature.
 * @param {object} message  parsed SNS JSON body
 * @returns {Promise<boolean>}
 */
async function verifySnsSignature(message) {
    if (!message || !message.SignatureVersion || !message.Signature || !message.SigningCertURL) return false;
    try {
        const algo = message.SignatureVersion === '2' ? 'RSA-SHA256' : 'RSA-SHA1';
        const certPem = await getCert(message.SigningCertURL); // host-allowlisted fetch
        const verifier = crypto.createVerify(algo);
        verifier.update(canonicalString(message), 'utf8');
        return verifier.verify(certPem, message.Signature, 'base64');
    } catch {
        // Any failure (unreachable cert, disallowed host, bad PEM) = unverifiable = fail closed.
        return false;
    }
}

/** Confirm an SNS subscription by GETting its SubscribeURL (host-allowlisted). */
async function confirmSubscription(message) {
    if (!message.SubscribeURL) throw new Error('No SubscribeURL on message');
    await fetchUrl(message.SubscribeURL);
    return { confirmed: true, topicArn: message.TopicArn };
}

/**
 * Normalize a SES event (inner SNS Message) into a delivery status update.
 * @param {object} sesEvent  parsed SES event JSON (the SNS `Message` field, parsed)
 * @returns {{ eventType:string, status:string, messageId:string|null, recipients:string[], detail:object }}
 */
function parseSesEvent(sesEvent) {
    // SES event JSON uses either `eventType` (configuration-set events) or `notificationType`
    // (legacy bounce/complaint/delivery feedback). Support both.
    const eventType = sesEvent.eventType || sesEvent.notificationType || 'Unknown';
    const mail = sesEvent.mail || {};
    const messageId = mail.messageId || null;

    const STATUS = {
        Send: 'sent',
        Delivery: 'delivered',
        Bounce: 'bounced',
        Complaint: 'complained',
        Reject: 'rejected',
        DeliveryDelay: 'delayed',
        'Rendering Failure': 'rendering_failed',
        RenderingFailure: 'rendering_failed',
        Subscription: 'subscription',
        Open: 'opened',
        Click: 'clicked',
    };
    const status = STATUS[eventType] || 'unknown';

    let recipients = mail.destination || [];
    const detail = {};
    if (eventType === 'Bounce' && sesEvent.bounce) {
        detail.bounceType = sesEvent.bounce.bounceType;       // Permanent | Transient | Undetermined
        detail.bounceSubType = sesEvent.bounce.bounceSubType;
        recipients = (sesEvent.bounce.bouncedRecipients || []).map((r) => r.emailAddress);
        // A Permanent bounce is a HARD BOUNCE — the address is now on the SES suppression list.
        detail.hardBounce = sesEvent.bounce.bounceType === 'Permanent';
    } else if (eventType === 'Complaint' && sesEvent.complaint) {
        recipients = (sesEvent.complaint.complainedRecipients || []).map((r) => r.emailAddress);
        detail.complaintFeedbackType = sesEvent.complaint.complaintFeedbackType;
    } else if (eventType === 'Reject' && sesEvent.reject) {
        detail.reason = sesEvent.reject.reason;
    } else if (eventType === 'DeliveryDelay' && sesEvent.deliveryDelay) {
        detail.delayType = sesEvent.deliveryDelay.delayType;
    } else if ((eventType === 'Rendering Failure' || eventType === 'RenderingFailure') && sesEvent.failure) {
        detail.errorMessage = sesEvent.failure.errorMessage;
    }
    return { eventType, status, messageId, recipients, detail };
}

/**
 * High-level handler. Verifies the signature, auto-confirms subscriptions, parses
 * notifications and persists delivery status via the injected store.
 *
 * @param {object} params
 * @param {string|object} params.body            raw request body (string) or parsed object
 * @param {{updateStatus:Function}} [params.store]
 * @param {{info:Function,warn:Function,error:Function}} [params.logger]
 * @param {boolean} [params.autoConfirm=true]    auto-confirm SubscriptionConfirmation messages
 * @param {boolean} [params.verify=true]         verify the SNS signature (disable only in tests)
 * @returns {Promise<{ ok:boolean, type:string, action:string, status?:string, messageId?:string|null }>}
 */
async function handleSnsRequest({ body, store, logger = console, autoConfirm = true, verify = true }) {
    const message = typeof body === 'string' ? JSON.parse(body) : body;
    const type = message.Type || 'Unknown';

    if (verify) {
        const valid = await verifySnsSignature(message);
        if (!valid) {
            (logger.warn || logger.log).call(logger, { type, topic: message.TopicArn }, '[ses-webhook] invalid SNS signature — rejected');
            const err = new Error('Invalid SNS signature');
            err.statusCode = 403;
            throw err;
        }
    }

    if (type === 'SubscriptionConfirmation') {
        if (autoConfirm) {
            await confirmSubscription(message);
            (logger.info || logger.log).call(logger, { topic: message.TopicArn }, '[ses-webhook] subscription confirmed');
            return { ok: true, type, action: 'confirmed' };
        }
        return { ok: true, type, action: 'pending', subscribeUrl: message.SubscribeURL };
    }

    if (type === 'UnsubscribeConfirmation') {
        (logger.info || logger.log).call(logger, { topic: message.TopicArn }, '[ses-webhook] unsubscribe confirmation received');
        return { ok: true, type, action: 'noted' };
    }

    if (type === 'Notification') {
        let sesEvent;
        try { sesEvent = JSON.parse(message.Message); } catch { sesEvent = {}; }
        const parsed = parseSesEvent(sesEvent);
        if (store && store.updateStatus && parsed.messageId) {
            await store.updateStatus(parsed.messageId, parsed.status, {
                eventType: parsed.eventType, recipients: parsed.recipients, detail: parsed.detail,
                at: new Date().toISOString(),
            });
        }
        (logger.info || logger.log).call(logger,
            { eventType: parsed.eventType, status: parsed.status, messageId: parsed.messageId, recipients: parsed.recipients },
            '[ses-webhook] event recorded');
        return { ok: true, type, action: 'recorded', status: parsed.status, messageId: parsed.messageId };
    }

    return { ok: true, type, action: 'ignored' };
}

module.exports = {
    handleSnsRequest,
    verifySnsSignature,
    confirmSubscription,
    parseSesEvent,
    canonicalString,
    ALLOWED_CERT_HOST,
};
