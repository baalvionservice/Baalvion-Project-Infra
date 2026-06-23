'use strict';
/**
 * Redis Streams consumer — reads from baalvion:events and dispatches to
 * the appropriate queue worker based on event type.
 *
 * Uses XREADGROUP with consumer groups for at-least-once delivery.
 * Pending entries (ACK not received) are reclaimed after 30 s.
 */
const config = require('../config/appConfig');
const logger = require('../utils/logger');
const { getQueues } = require('../queue/queues');
const inappService = require('../service/inappService');
const redis  = require('../config/redis');
const { initSdk, getSdk } = require('../platform/sdk');
const { NotificationEvents, emit } = require('../platform/events');

// Best-effort in-app push — never let a realtime failure block the dispatch path
// or the event handler (a throw would leave the entry pending for redelivery).
async function tryInApp(userId, payload) {
    if (!userId) return;
    try { await inappService.sendInApp({ ...payload, userId }); }
    catch (err) { logger.warn({ err: err.message, userId }, 'in-app fan-out failed (non-fatal)'); }
}

let _subscription = null;

// ── Event → notification handler dispatch ────────────────────────────────────

async function dispatch(eventType, payload, meta = {}) {
    const { emailQueue: _emailQueue } = getQueues();
    // Wrap add() to pass the per-job idempotencyKey as the BullMQ jobId — BullMQ then
    // rejects a duplicate job, so a redelivered event (XAUTOCLAIM after a crash between
    // dispatch and markProcessed) never double-sends. (Previously the key lived only in
    // job DATA and was never used for dedup, so the idempotency claim was non-functional.)
    const emailQueue = { add: (name, data, opts = {}) => _emailQueue.add(name, data, (data && data.idempotencyKey) ? { jobId: data.idempotencyKey, ...opts } : opts) };

    switch (eventType) {
        // Auth events → emails
        case 'auth.registered':
            await emailQueue.add('welcome', {
                to:            payload.email,
                templateName:  'welcome',
                idempotencyKey: `welcome:${payload.userId}`,
                data: {
                    name:      payload.fullName || 'there',
                    verifyUrl: `${config.appUrl}/verify-email?token=${payload.verifyToken}`,
                },
            });
            break;

        case 'auth.email_verification_requested':
            await emailQueue.add('email-verify', {
                to:            payload.email,
                templateName:  'emailVerification',
                idempotencyKey: `emailverify:${payload.userId}:${payload.token}`,
                data: {
                    email:     payload.email,
                    verifyUrl: `${config.appUrl}/verify-email?token=${payload.verifyToken}`,
                },
            });
            break;

        case 'auth.password_reset_requested':
            await emailQueue.add('password-reset', {
                to:            payload.email,
                templateName:  'passwordReset',
                idempotencyKey: `pwreset:${payload.token}`,
                data: {
                    resetUrl: `${config.appUrl}/reset-password?token=${payload.resetToken}`,
                },
            });
            break;

        case 'session.high_risk':
            await emailQueue.add('security-alert', {
                to:            payload.email,
                templateName:  'securityAlert',
                idempotencyKey: `secrisk:${payload.sessionId}`,
                data: {
                    reason:    formatRiskSignals(payload.signals),
                    time:      payload.createdAt || new Date().toISOString(),
                    ip:        payload.ipAddress,
                    location:  payload.location || 'Unknown',
                    riskScore: payload.riskScore,
                    secureUrl: `${config.appUrl}/settings/security`,
                },
            });
            await tryInApp(payload.userId, {
                type: 'security', title: 'High-risk sign-in detected',
                body: `A risky sign-in was detected from ${payload.location || payload.ipAddress || 'an unknown location'}.`,
                data: { sessionId: payload.sessionId, riskScore: payload.riskScore },
            });
            break;

        case 'auth.new_device_login':
            await emailQueue.add('login-alert', {
                to:            payload.email,
                templateName:  'loginAlert',
                idempotencyKey: `loginAlert:${payload.sessionId}`,
                data: {
                    time:      payload.createdAt || new Date().toISOString(),
                    location:  payload.location || 'Unknown',
                    device:    payload.device   || 'Unknown device',
                    ip:        payload.ipAddress,
                    secureUrl: `${config.appUrl}/settings/security`,
                },
            });
            await tryInApp(payload.userId, {
                type: 'security', title: 'New device sign-in',
                body: `New sign-in from ${payload.device || 'a new device'} (${payload.location || 'unknown location'}).`,
                data: { sessionId: payload.sessionId },
            });
            break;

        case 'auth.invitation_created':
            await emailQueue.add('org-invite', {
                to:            payload.email,
                templateName:  'orgInvite',
                idempotencyKey: `invite:${payload.invitationId}`,
                data: {
                    inviterName: payload.inviterName,
                    orgName:     payload.orgName,
                    role:        payload.role,
                    acceptUrl:   `${config.appUrl}/invitations/${payload.token}/accept`,
                },
            });
            break;

        case 'auth.mfa_enabled':
            await emailQueue.add('mfa-enabled', {
                to:            payload.email,
                templateName:  'mfaEnabled',
                idempotencyKey: `mfaon:${payload.userId}`,
                data: {
                    secureUrl: `${config.appUrl}/settings/security`,
                },
            });
            break;

        case 'admin.impersonation_started':
            await emailQueue.add('impersonation-alert', {
                to:            payload.targetEmail,
                templateName:  'impersonationAlert',
                idempotencyKey: `imperso:${payload.impersonationId}`,
                data: {
                    adminEmail: payload.adminEmail,
                    time:       new Date().toISOString(),
                    expiresAt:  payload.expiresAt,
                    sessionId:  payload.impersonationId,
                },
            });
            break;

        // ── Platform domain events (CMS + commerce/payments) — SDK adoption ──
        case 'cms.content.published':
        case 'cms.content.unpublished':
        case 'cms.integration.updated':
        case 'cms.integration.removed':
        case 'cms.member.invited':
        case 'payment.created':
        case 'payment.authorized':
        case 'payment.captured':
        case 'payment.failed':
        case 'payment.refunded':
        case 'payment.ledger.recorded':
            await handleDomainEvent(eventType, payload, meta);
            break;

        default:
            logger.debug({ eventType }, 'No notification handler for event type');
    }
}

// Process a platform domain event: fan to the EXISTING in-app channel when a user
// is targeted (no new templates/features), then emit the notification lifecycle
// event onto the bus. tenantId + traceId flow from the surrounding sdk.trace scope.
async function handleDomainEvent(eventType, payload, meta) {
    const userId = payload.userId ?? meta.userId ?? null;
    if (userId) {
        await tryInApp(userId, {
            type: 'system',
            title: eventType,
            body: `Update: ${eventType}`,
            data: { eventType, tenantId: meta.tenantId ?? null },
        });
    }
    await emit(NotificationEvents.DISPATCHED, {
        sourceEvent: eventType,
        tenantId:    meta.tenantId ?? null,
        channels:    userId ? ['inapp'] : [],
        delivered:   Boolean(userId),
    }, { tenantId: meta.tenantId ?? null });
    logger.info({ eventType, tenantId: meta.tenantId ?? null, delivered: Boolean(userId) }, 'domain event processed');
}

function formatRiskSignals(signals = []) {
    const descriptions = {
        impossible_travel: 'Sign-in from a location that is physically impossible given your last activity',
        new_country:       'Sign-in from a new country not previously associated with your account',
        new_device:        'Sign-in from an unrecognised device',
        many_active_ips:   'Multiple active sessions from different IP addresses',
        tor_exit:          'Sign-in from a known anonymous network',
    };
    return signals.map(s => descriptions[s.type] || s.type).join('; ');
}

// ── Idempotency: dedup by event id (mark DONE only after success) ─────────────
// At-least-once delivery (XREADGROUP + XAUTOCLAIM reclaim) can redeliver; the
// done-marker makes processing idempotent. BullMQ jobIds dedup the actual sends.
async function isProcessed(eventId) {
    if (!eventId) return false;
    try { const r = redis.getClient(); return r ? (await r.exists(`notif:processed:${eventId}`)) === 1 : false; }
    catch { return false; }
}
async function markProcessed(eventId) {
    if (!eventId) return;
    try { const r = redis.getClient(); if (r) await r.set(`notif:processed:${eventId}`, '1', 'EX', 86_400); }
    catch (err) { logger.warn({ err: err && err.message, eventId }, 'markProcessed failed — non-fatal (at worst a duplicate, which BullMQ jobIds absorb)'); }
}

// ── SDK event handler: idempotent + trace-scoped ──────────────────────────────
// Receives an SdkEvent { id, eventType, tenantId, userId, traceId, payload }.
// On success the entry is ACKed by the SDK transport; a THROW leaves it pending
// for XAUTOCLAIM redelivery (at-least-once). traceId + tenantId are bound for the
// whole dispatch via sdk.trace.runWith so logs/emitted events stay correlated.
async function handle(event) {
    if (await isProcessed(event.id)) {
        logger.debug({ eventId: event.id, type: event.eventType }, 'event already processed — skipped (idempotent)');
        return; // returns cleanly → SDK transport ACKs (removed from PEL)
    }
    await getSdk().trace.runWith(
        { traceId: event.traceId, tenantId: event.tenantId, userId: event.userId },
        async () => {
            await dispatch(
                event.eventType,
                { ...(event.payload || {}), _correlationId: event.traceId },
                { tenantId: event.tenantId, userId: event.userId, traceId: event.traceId },
            );
        },
    );
    await markProcessed(event.id);
}

// ── Consumer lifecycle (SDK-native: sdk.events.subscribe) ─────────────────────
// ONE durable group ('notification-service') with pattern '>' = ALL event types,
// preserving the prior single-group / all-events delivery semantics. The SDK
// Redis Streams transport owns XREADGROUP + XAUTOCLAIM PEL reclaim on (re)start.
async function startEventConsumer() {
    const sdk = await initSdk();
    _subscription = await sdk.events.subscribe('>', config.eventBus.consumerGroup, handle);
    logger.info(
        { group: config.eventBus.consumerGroup, stream: config.eventBus.stream, transport: 'redis' },
        'event consumer started (sdk.events.subscribe)',
    );
    return _subscription;
}

async function stopEventConsumer() {
    if (_subscription) { await _subscription.unsubscribe(); _subscription = null; }
}

module.exports = { startEventConsumer, stopEventConsumer, dispatch, handle, formatRiskSignals };
