'use strict';
/**
 * Lightweight transactional mailer (nodemailer).
 *
 * Dev defaults to the local Mailpit SMTP sink (localhost:1025, no auth) so emails are
 * actually delivered and viewable at http://localhost:8025. Production is configured via
 * SMTP_* env vars. Best-effort by design: sendMail NEVER throws — it returns { sent }
 * so callers can treat email as a non-fatal side effect.
 */
const nodemailer = require('nodemailer');

const HOST = process.env.SMTP_HOST || 'localhost';
const PORT = Number(process.env.SMTP_PORT || 1025);
const USER = process.env.SMTP_USER || '';
const PASS = process.env.SMTP_PASS || '';
const FROM = process.env.MAIL_FROM || 'Baalvion NetStack <no-reply@baalvion.com>';
const SECURE = String(process.env.SMTP_SECURE || '').toLowerCase() === 'true';
const REJECT_UNAUTH = String(process.env.SMTP_REJECT_UNAUTHORIZED || 'false').toLowerCase() === 'true';

let _transport = null;
function transport() {
    if (_transport) return _transport;
    _transport = nodemailer.createTransport({
        host: HOST,
        port: PORT,
        secure: SECURE,                       // false for Mailpit / STARTTLS on :1025
        auth: USER ? { user: USER, pass: PASS } : undefined,
        tls: { rejectUnauthorized: REJECT_UNAUTH }, // tolerate self-signed in dev
    });
    return _transport;
}

async function sendMail({ to, subject, text, html }) {
    if (!to) return { sent: false, reason: 'no recipient' };
    try {
        const info = await transport().sendMail({
            from: FROM,
            to,
            subject,
            text,
            html: html || (text ? `<p>${String(text).replace(/\n/g, '<br/>')}</p>` : undefined),
        });
        return { sent: true, messageId: info.messageId };
    } catch (err) {
        // Non-fatal: log and continue. The in-app notification is the guaranteed channel.
        console.warn('[mailer] sendMail failed:', err.message);
        return { sent: false, reason: err.message };
    }
}

module.exports = { sendMail };
