'use strict';
/**
 * Redis Streams consumer — reads from baalvion:events and dispatches to
 * the appropriate queue worker based on event type.
 *
 * Uses XREADGROUP with consumer groups for at-least-once delivery.
 * Pending entries (ACK not received) are reclaimed after 30 s.
 */
const redis  = require('../config/redis');
const config = require('../config/appConfig');
const logger = require('../utils/logger');
const { getQueues } = require('../queue/queues');

const {
    stream,
    consumerGroup,
    consumerName,
    batchSize,
    blockMs,
} = config.eventBus;

let _running = false;
let _conn    = null;

// ── Event → notification handler dispatch ────────────────────────────────────

async function dispatch(eventType, payload) {
    const { emailQueue } = getQueues();

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

        default:
            logger.debug({ eventType }, 'No notification handler for event type');
    }
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

// ── Consumer loop ─────────────────────────────────────────────────────────────

async function ensureConsumerGroup(r) {
    try {
        // Ensure the stream exists with at least one entry
        await r.xadd(stream, 'MAXLEN', '~', '10000', '*', '_type', 'init');
        await r.xgroup('CREATE', stream, consumerGroup, '$', 'MKSTREAM');
    } catch (err) {
        // BUSYGROUP = group already exists — that's fine
        if (!err.message?.includes('BUSYGROUP')) throw err;
    }
}

async function reclaimPending(r) {
    // Reclaim messages pending for > 30 s (e.g. crashed before ACK)
    try {
        const pending = await r.xautoclaim(stream, consumerGroup, consumerName, 30_000, '0-0', 'COUNT', 10);
        if (pending && pending[1]?.length > 0) {
            logger.info({ count: pending[1].length }, 'Reclaimed pending events');
            for (const msg of pending[1]) {
                await processMessage(r, msg);
            }
        }
    } catch (err) {
        logger.warn({ err }, 'Failed to reclaim pending events');
    }
}

async function processMessage(r, msg) {
    const [msgId, fields] = msg;
    const eventData = {};
    for (let i = 0; i < fields.length; i += 2) {
        eventData[fields[i]] = fields[i + 1];
    }

    const eventType = eventData._type;
    let payload;
    try {
        payload = JSON.parse(eventData._payload || '{}');
    } catch {
        payload = {};
    }

    try {
        await dispatch(eventType, { ...payload, _correlationId: eventData._correlationId });
        await r.xack(stream, consumerGroup, msgId);
    } catch (err) {
        logger.error({ msgId, eventType, err }, 'Failed to dispatch event — will be reclaimed');
        // Don't ACK — will be reclaimed after 30s
    }
}

async function startEventConsumer() {
    _conn    = redis.newConnection();
    _running = true;

    await ensureConsumerGroup(_conn);
    logger.info({ stream, consumerGroup, consumerName }, 'Event consumer started');

    // Reclaim any pending messages from a previous run
    await reclaimPending(_conn);

    while (_running) {
        try {
            const results = await _conn.xreadgroup(
                'GROUP',    consumerGroup,
                'CONSUMER', consumerName,
                'COUNT',    batchSize,
                'BLOCK',    blockMs,
                'NOACK',    false,
                'STREAMS',  stream,
                '>',
            );

            if (!results) continue;

            for (const [, messages] of results) {
                for (const msg of messages) {
                    await processMessage(_conn, msg);
                }
            }
        } catch (err) {
            if (!_running) break;
            logger.error({ err }, 'Event consumer error — retrying in 5s');
            await new Promise(r => setTimeout(r, 5_000));
        }
    }
}

async function stopEventConsumer() {
    _running = false;
    if (_conn) { _conn.disconnect(); _conn = null; }
}

module.exports = { startEventConsumer, stopEventConsumer };
