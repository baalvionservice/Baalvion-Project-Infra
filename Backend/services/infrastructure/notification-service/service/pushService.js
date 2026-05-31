'use strict';
// Push channel — provider-agnostic. Two transports, BOTH optional + lazy-loaded:
//   • FCM     via `firebase-admin`  (mobile/web push). FCM is a push transport only,
//             NOT Firebase auth — and it is never required.
//   • WebPush via `web-push` (VAPID) (Firebase-free browser push).
// With neither configured, the dev "log" provider prints instead of sending.
const config = require('../config/appConfig');
const logger = require('../utils/logger');
const deviceService = require('./deviceService');
const { checkRateLimit, isDuplicate } = require('./throttle');

const fcmConfigured = () =>
    !!(config.push.fcm.serviceAccount || config.push.fcm.serviceAccountB64 || config.push.fcm.serviceAccountPath);
const webpushConfigured = () =>
    !!(config.push.webpush.publicKey && config.push.webpush.privateKey);

function resolveProvider() {
    const p = config.push.provider;
    if (p === 'fcm' || p === 'webpush' || p === 'log') return p;
    if (fcmConfigured()) return 'fcm';
    if (webpushConfigured()) return 'webpush';
    return 'log';
}

// ── FCM (firebase-admin), lazy ────────────────────────────────────────────────
let _fcm = null;
function getFcm() {
    if (_fcm !== null) return _fcm;
    try {
        const admin = require('firebase-admin'); // optional dependency
        let sa = null;
        const { serviceAccount, serviceAccountB64, serviceAccountPath } = config.push.fcm;
        if (serviceAccount) sa = JSON.parse(serviceAccount);
        else if (serviceAccountB64) sa = JSON.parse(Buffer.from(serviceAccountB64, 'base64').toString('utf8'));
        else if (serviceAccountPath) sa = JSON.parse(require('fs').readFileSync(serviceAccountPath, 'utf8'));
        if (!sa) { _fcm = false; return _fcm; }
        const app = admin.apps.length ? admin.app() : admin.initializeApp({ credential: admin.credential.cert(sa) });
        _fcm = admin.messaging(app);
    } catch (err) {
        logger.error({ err: err.message }, 'firebase-admin not installed/usable — run `pnpm add firebase-admin` to enable FCM');
        _fcm = false;
    }
    return _fcm;
}

async function sendViaFcm({ tokens, title, body, data }) {
    const messaging = getFcm();
    if (!messaging) throw new Error('FCM not configured');
    const res = await messaging.sendEachForMulticast({
        tokens,
        notification: { title, body },
        data: data ? Object.fromEntries(Object.entries(data).map(([k, v]) => [k, String(v)])) : undefined,
    });
    return { provider: 'fcm', sent: res.successCount, failed: res.failureCount };
}

// ── Web Push (VAPID), lazy ─────────────────────────────────────────────────────
let _webpush = null;
function getWebpush() {
    if (_webpush !== null) return _webpush;
    try {
        const webpush = require('web-push'); // optional dependency
        webpush.setVapidDetails(config.push.webpush.subject, config.push.webpush.publicKey, config.push.webpush.privateKey);
        _webpush = webpush;
    } catch (err) {
        logger.error({ err: err.message }, 'web-push not installed — run `pnpm add web-push` to enable Web Push');
        _webpush = false;
    }
    return _webpush;
}

async function sendViaWebpush({ tokens, title, body, data }) {
    const webpush = getWebpush();
    if (!webpush) throw new Error('Web Push not configured');
    const payload = JSON.stringify({ title, body, data: data || {} });
    let sent = 0, failed = 0;
    await Promise.all(tokens.map(async (t) => {
        try { const sub = typeof t === 'string' ? JSON.parse(t) : t; await webpush.sendNotification(sub, payload); sent++; }
        catch { failed++; }
    }));
    return { provider: 'webpush', sent, failed };
}

function sendViaLog({ tokens, title, body }) {
    logger.info({ tokenCount: tokens.length, title, body }, '[push:log] (dev) push not sent — no FCM/WebPush configured');
    return { provider: 'log', sent: tokens.length, failed: 0, status: 'logged' };
}

/**
 * @param {object} p { userId?, tokens?:string[], title, body, data?, idempotencyKey? }
 *   tokens default to the user's registered device tokens.
 */
async function sendPush({ userId, tokens, title, body, data, idempotencyKey }) {
    if (!title && !body) throw new Error('push requires `title` or `body`');

    if (await isDuplicate(idempotencyKey)) return { suppressed: true, reason: 'duplicate' };

    const targetTokens = (tokens && tokens.length) ? tokens : (userId ? await deviceService.getTokens(userId) : []);
    const provider = resolveProvider();
    if (!targetTokens.length && provider !== 'log') {
        logger.info({ userId }, 'No device tokens for push — suppressed');
        return { suppressed: true, reason: 'no_tokens' };
    }

    const rlKey = userId || targetTokens[0] || 'anon';
    if (!(await checkRateLimit('push', rlKey, config.rateLimits.pushPerRecipientPerHour))) {
        return { suppressed: true, reason: 'rate_limit' };
    }

    let result;
    if (provider === 'fcm') result = await sendViaFcm({ tokens: targetTokens, title, body, data });
    else if (provider === 'webpush') result = await sendViaWebpush({ tokens: targetTokens, title, body, data });
    else result = sendViaLog({ tokens: targetTokens, title, body });

    logger.info({ userId, provider: result.provider, sent: result.sent, failed: result.failed }, 'Push dispatched');
    return result;
}

module.exports = { sendPush, resolveProvider, fcmConfigured, webpushConfigured };
