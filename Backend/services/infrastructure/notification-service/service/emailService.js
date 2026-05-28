'use strict';
const { Resend }    = require('resend');
const nodemailer    = require('nodemailer');
const redis         = require('../config/redis');
const config        = require('../config/appConfig');
const logger        = require('../utils/logger');
const { render }    = require('../templates');

let _resend      = null;
let _smtpTransport = null;

function getResend() {
    if (!_resend && config.email.resendApiKey) {
        _resend = new Resend(config.email.resendApiKey);
    }
    return _resend;
}

function getSmtp() {
    if (!_smtpTransport && config.email.smtp.host) {
        _smtpTransport = nodemailer.createTransport({
            host:   config.email.smtp.host,
            port:   config.email.smtp.port,
            secure: config.email.smtp.port === 465,
            auth:   { user: config.email.smtp.user, pass: config.email.smtp.pass },
        });
    }
    return _smtpTransport;
}

// ── Rate limiting ─────────────────────────────────────────────────────────────

async function checkRateLimit(recipient) {
    const r = redis.getClient();
    if (!r || !redis.isAvailable()) return true;  // allow if Redis down
    const key    = `notif:rl:email:${recipient}`;
    const count  = await r.incr(key);
    if (count === 1) await r.expire(key, 3600);
    return count <= config.rateLimits.emailPerRecipientPerHour;
}

// ── Idempotency ───────────────────────────────────────────────────────────────

async function markSent(idempotencyKey) {
    const r = redis.getClient();
    if (!r || !redis.isAvailable()) return false;
    const key = `notif:idem:${idempotencyKey}`;
    const set  = await r.set(key, '1', 'EX', 86400, 'NX');
    return set === null;  // null means key already existed → duplicate
}

// ── Send via Resend (primary) ─────────────────────────────────────────────────

async function sendViaResend({ to, subject, html, replyTo }) {
    const resend = getResend();
    if (!resend) throw new Error('Resend not configured');
    const result = await resend.emails.send({
        from:    `${config.email.fromName} <${config.email.fromAddress}>`,
        to:      [to],
        subject,
        html,
        reply_to: replyTo || config.email.replyTo,
    });
    if (result.error) throw new Error(`Resend error: ${result.error.message}`);
    return { provider: 'resend', id: result.data?.id };
}

// ── Send via SMTP (fallback) ──────────────────────────────────────────────────

async function sendViaSmtp({ to, subject, html, replyTo }) {
    const transport = getSmtp();
    if (!transport) throw new Error('SMTP not configured');
    const info = await transport.sendMail({
        from:    `"${config.email.fromName}" <${config.email.fromAddress}>`,
        to,
        subject,
        html,
        replyTo: replyTo || config.email.replyTo,
    });
    return { provider: 'smtp', id: info.messageId };
}

// ── Main send function (provider failover) ────────────────────────────────────

async function sendEmail({ to, templateName, data, idempotencyKey, replyTo }) {
    // Idempotency check
    if (idempotencyKey) {
        const duplicate = await markSent(idempotencyKey);
        if (duplicate) {
            logger.info({ idempotencyKey, to }, 'Duplicate email suppressed');
            return { suppressed: true, reason: 'duplicate' };
        }
    }

    // Rate limit check
    const allowed = await checkRateLimit(to);
    if (!allowed) {
        logger.warn({ to }, 'Email rate limit exceeded');
        return { suppressed: true, reason: 'rate_limit' };
    }

    const appData = { ...data, appUrl: config.appUrl, adminUrl: config.adminUrl };
    const { subject, html } = render(templateName, appData);

    let result;
    try {
        result = await sendViaResend({ to, subject, html, replyTo });
    } catch (err) {
        logger.warn({ err, to }, 'Resend failed — trying SMTP fallback');
        result = await sendViaSmtp({ to, subject, html, replyTo });
    }

    logger.info({ to, templateName, provider: result.provider, id: result.id }, 'Email sent');
    return result;
}

// ── Send raw HTML (for transactional emails without template) ─────────────────

async function sendRawEmail({ to, subject, html, idempotencyKey, replyTo }) {
    if (idempotencyKey) {
        const duplicate = await markSent(idempotencyKey);
        if (duplicate) return { suppressed: true, reason: 'duplicate' };
    }

    try {
        return await sendViaResend({ to, subject, html, replyTo });
    } catch {
        return await sendViaSmtp({ to, subject, html, replyTo });
    }
}

module.exports = { sendEmail, sendRawEmail };
