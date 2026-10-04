'use strict';
// Notifications: an in-app feed row, plus an email through notification-service when configured.
// Always fire-and-forget and fail-open: a notification problem must never fail the action that
// triggered it (a booking, a decision, a payment record). Every failure is logged, never thrown.
//
// Email goes to notification-service's internal /notifications/email with rawSubject/rawHtml and a
// stable idempotencyKey, using the platform's shared x-internal-secret. Unset NOTIFICATION_BASE_URL
// or INTERNAL_SERVICE_SECRET and email is skipped; the in-app feed still works.
const db = require('../models');

const baseUrl = () => process.env.NOTIFICATION_BASE_URL || '';
const prefix = () => process.env.NOTIFICATION_API_PREFIX || '/v1';
const secret = () => process.env.INTERNAL_SERVICE_SECRET || '';
const siteUrl = () => (process.env.SITE_URL || 'https://community.marketunderworld.com').replace(/\/$/, '');
const emailEnabled = () => !!baseUrl() && !!secret();
const TIMEOUT_MS = Number(process.env.NOTIFICATION_TIMEOUT_MS || 4000);

const esc = (v) => String(v ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const clip = (v, n) => String(v ?? '').slice(0, n);
const absolute = (url) => (!url ? null : /^https?:\/\//i.test(url) ? url : `${siteUrl()}${url.startsWith('/') ? '' : '/'}${url}`);

// Every dynamic value is escaped: names, notes and reasons are user-typed.
function renderEmail({ title, body, url, cta = 'Open' }) {
    const link = absolute(url);
    return `<div style="font-family:Arial,Helvetica,sans-serif;max-width:560px;margin:0 auto;padding:24px;color:#111">
<h2 style="margin:0 0 12px">${esc(title)}</h2>
<p style="line-height:1.55;white-space:pre-line">${esc(body)}</p>
${link ? `<p><a href="${esc(link)}" style="display:inline-block;background:#111;color:#fff;padding:10px 18px;border-radius:6px;text-decoration:none">${esc(cta)}</a></p>` : ''}
<p style="color:#888;font-size:12px;margin-top:24px">Market Underworld community</p></div>`;
}

async function sendEmail({ to, subject, title, body, url, cta, idempotencyKey }) {
    if (!emailEnabled() || !to) return;
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), TIMEOUT_MS);
    try {
        const res = await fetch(`${baseUrl().replace(/\/$/, '')}${prefix()}/notifications/email`, {
            method: 'POST',
            headers: { 'content-type': 'application/json', 'x-internal-secret': secret(), 'x-internal-service': 'community-service' },
            body: JSON.stringify({ to, rawSubject: clip(subject || title, 200), rawHtml: renderEmail({ title, body, url, cta }), idempotencyKey }),
            signal: ctrl.signal,
        });
        if (!res.ok) console.error(JSON.stringify({ evt: 'community.email_failed', status: res.status, key: idempotencyKey }));
    } catch (err) {
        console.error(JSON.stringify({ evt: 'community.email_error', error: err.message, key: idempotencyKey }));
    } finally {
        clearTimeout(timer);
    }
}

async function contactEmail(userId) {
    if (!userId) return null;
    const row = await db.NotificationContact.findByPk(userId);
    return row ? row.email : null;
}

/**
 * Notify one person.
 * @param {object} n
 * @param {string} [n.userId]  gets an in-app row (and an email if we know their address)
 * @param {string} [n.email]   explicit address (guests who have no account); overrides the lookup
 * @param {string} n.type      short category used for icons/filters
 * @param {string} n.title
 * @param {string} n.body
 * @param {string} [n.url]     where the action button / bell item leads
 * @param {string} [n.key]     idempotency key for the email (same key = one email)
 */
async function notify(n) {
    try {
        if (n.userId) {
            await db.UserNotification.create({
                user_id: n.userId, type: clip(n.type, 40), title: clip(n.title, 200), body: clip(n.body, 1000), action_url: n.url || null,
            });
        }
        const to = n.email || (await contactEmail(n.userId));
        if (to) await sendEmail({ to, title: n.title, body: n.body, url: n.url, cta: n.cta, idempotencyKey: n.key });
    } catch (err) {
        console.error(JSON.stringify({ evt: 'community.notify_error', error: err.message, type: n.type }));
    }
}

// Ops alert to the admin team's mailbox(es). ADMIN_ALERT_EMAIL may hold a comma-separated list.
async function alertAdmins({ title, body, url, key }) {
    const list = String(process.env.ADMIN_ALERT_EMAIL || '').split(',').map((s) => s.trim()).filter(Boolean);
    await Promise.all(list.map((to) => sendEmail({ to, title, body, url, cta: 'Open admin console', idempotencyKey: key ? `${key}:${to}` : undefined }).catch(() => {})));
}

// Callers use this so they never await or catch: the promise is swallowed here.
const fire = (promise) => { Promise.resolve(promise).catch(() => {}); };

module.exports = { notify, alertAdmins, fire, renderEmail, esc, contactEmail, emailEnabled };
