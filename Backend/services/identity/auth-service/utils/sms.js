'use strict';
/**
 * @file utils/sms.js
 * @description Pluggable SMS sender for phone-verification OTPs. Mirrors utils/mailer.js:
 * a single `sendSms({ to, body })` with a console DEV fallback when no provider is configured.
 *
 * Providers (selected by config.sms.provider):
 *   • 'twilio'  — Twilio REST API via fetch (Basic auth, no SDK dependency).
 *   • 'webhook' — POST { to, body } JSON to config.sms.webhookUrl (generic gateway/aggregator).
 *   • anything else / unset — DEV fallback: log to the server console. NEVER throws.
 *
 * Delivery is best-effort and decoupled from the OTP record: a send failure must not block the
 * flow (the code is already persisted), so callers treat a rejection as "could not deliver" only.
 */
const config = require('../config/appConfig');
const logger = require('./logger');

function maskPhone(to) {
    const s = String(to || '');
    return s.length <= 4 ? '****' : `${s.slice(0, 3)}****${s.slice(-2)}`;
}

async function sendViaTwilio({ to, body }) {
    const { accountSid, authToken, from } = config.sms.twilio;
    if (!accountSid || !authToken || !from) {
        throw new Error('Twilio SMS provider selected but accountSid/authToken/from are not configured');
    }
    const url = `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`;
    const auth = Buffer.from(`${accountSid}:${authToken}`).toString('base64');
    const form = new URLSearchParams({ To: to, From: from, Body: body });
    const res = await fetch(url, {
        method: 'POST',
        headers: { Authorization: `Basic ${auth}`, 'Content-Type': 'application/x-www-form-urlencoded' },
        body: form.toString(),
    });
    if (!res.ok) {
        const detail = await res.text().catch(() => '');
        throw new Error(`Twilio send failed (${res.status}): ${detail.slice(0, 200)}`);
    }
}

async function sendViaWebhook({ to, body }) {
    const { webhookUrl, webhookToken } = config.sms;
    if (!webhookUrl) throw new Error('Webhook SMS provider selected but config.sms.webhookUrl is not set');
    const res = await fetch(webhookUrl, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            ...(webhookToken ? { Authorization: `Bearer ${webhookToken}` } : {}),
        },
        body: JSON.stringify({ to, body }),
    });
    if (!res.ok) {
        const detail = await res.text().catch(() => '');
        throw new Error(`SMS webhook failed (${res.status}): ${detail.slice(0, 200)}`);
    }
}

/**
 * Send an SMS. Resolves on success; rejects only on a real provider error (callers swallow it).
 * With no provider configured this logs to the console (DEV) and resolves.
 * @param {{ to: string, body: string }} msg
 */
async function sendSms({ to, body }) {
    const provider = (config.sms.provider || '').toLowerCase();
    if (provider === 'twilio') return sendViaTwilio({ to, body });
    if (provider === 'webhook') return sendViaWebhook({ to, body });
    // DEV fallback — no provider configured. Surface the code in logs so local flows are testable.
    logger.info(`[SMS DEV] To: ${maskPhone(to)} | ${body}`);
}

module.exports = { sendSms, maskPhone };
