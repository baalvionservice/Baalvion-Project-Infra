'use strict';
// ─────────────────────────────────────────────────────────────────────────────
// Transactional email. Env-gated:
//   • MAIL_ENABLED=true + SMTP_* configured  → real send via nodemailer
//     (dev: point SMTP_HOST/PORT at Mailpit :1025; prod: SES/SendGrid/etc SMTP).
//   • otherwise                              → the email is LOGGED, not sent, so
//     local/dev/test never block on a mail server and nothing silently breaks.
//
// All templates share one branded HTML shell. Sends are best-effort and never
// throw into the request path (a failed receipt must not fail a paid booking).
// ─────────────────────────────────────────────────────────────────────────────
const nodemailer = require('nodemailer');
const config = require('../config/appConfig');
const { getSecret } = require('../config/secrets');

const ENABLED = String(process.env.MAIL_ENABLED || 'false').toLowerCase() === 'true';
const FROM = process.env.MAIL_FROM || 'Law Elite Network <no-reply@lawelitenetwork.com>';

let transporter = null;
function getTransport() {
    if (transporter || !ENABLED) return transporter;
    transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST || 'localhost',
        port: Number(process.env.SMTP_PORT || 1025),
        secure: String(process.env.SMTP_SECURE || 'false') === 'true',
        auth: (getSecret('SMTP_USER') || getSecret('SMTP_PASS'))
            ? { user: getSecret('SMTP_USER'), pass: getSecret('SMTP_PASS') }
            : undefined,
    });
    return transporter;
}

const esc = (s) => String(s == null ? '' : s).replace(/[&<>"]/g, (c) => (
    { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]
));

// Branded HTML shell shared by every template.
function shell(title, bodyHtml) {
    return `<!doctype html><html><body style="margin:0;background:#f1f5f9;font-family:Inter,Arial,sans-serif;color:#0f172a">
  <div style="max-width:560px;margin:0 auto;padding:24px">
    <div style="text-align:center;padding:8px 0 20px">
      <span style="font-size:18px;font-weight:800;letter-spacing:.5px;color:#0B1F3A">LAW&nbsp;ELITE&nbsp;NETWORK</span>
    </div>
    <div style="background:#fff;border:1px solid #e2e8f0;border-radius:16px;padding:32px">
      <h1 style="margin:0 0 16px;font-size:20px;color:#0B1F3A">${esc(title)}</h1>
      ${bodyHtml}
    </div>
    <p style="text-align:center;color:#94a3b8;font-size:12px;margin-top:20px">
      © ${new Date().getFullYear()} Law Elite Network · Global Legal Intelligence
    </p>
  </div>
</body></html>`;
}

const btn = (href, label) =>
    `<a href="${esc(href)}" style="display:inline-block;background:#0B1F3A;color:#fff;text-decoration:none;padding:12px 24px;border-radius:10px;font-weight:700;font-size:14px">${esc(label)}</a>`;

/**
 * Low-level send. Returns { sent:boolean }. Never throws.
 */
async function send({ to, subject, html, text }) {
    if (!to) return { sent: false };
    try {
        if (!ENABLED) {
            // eslint-disable-next-line no-console
            console.log(`[mailer] (disabled) would send "${subject}" -> ${to}`);
            return { sent: false, logged: true };
        }
        const t = getTransport();
        const info = await t.sendMail({ from: FROM, to, subject, html, text: text || subject });
        // eslint-disable-next-line no-console
        console.log(`[mailer] sent "${subject}" -> ${to} (${info.messageId})`);
        return { sent: true, messageId: info.messageId };
    } catch (err) {
        // eslint-disable-next-line no-console
        console.error(`[mailer] failed "${subject}" -> ${to}: ${err.message}`);
        return { sent: false, error: err.message };
    }
}

// ── Templates ────────────────────────────────────────────────────────────────
const templates = {
    welcome: ({ name }) => ({
        subject: 'Welcome to Law Elite Network',
        html: shell('Welcome aboard', `
      <p>Hi ${esc(name || 'there')},</p>
      <p>Your Law Elite Network account is ready. Discover vetted lawyers across 188 countries,
         book consultations and manage your matters — all in one place.</p>
      <p style="margin:24px 0">${btn(config.appUrl, 'Open your dashboard')}</p>`),
    }),

    bookingConfirmation: ({ clientName, lawyerName, scheduledAt, type, amount, currency }) => ({
        subject: 'Your consultation is confirmed',
        html: shell('Consultation confirmed', `
      <p>Hi ${esc(clientName || 'there')},</p>
      <p>Your <strong>${esc(type || 'consultation')}</strong> with <strong>${esc(lawyerName || 'your lawyer')}</strong> is confirmed.</p>
      <table style="margin:16px 0;font-size:14px;color:#334155">
        <tr><td style="padding:4px 12px 4px 0;color:#64748b">When</td><td><strong>${esc(scheduledAt || 'TBD')}</strong></td></tr>
        ${amount != null ? `<tr><td style="padding:4px 12px 4px 0;color:#64748b">Amount</td><td><strong>${esc(currency || 'USD')} ${esc(amount)}</strong></td></tr>` : ''}
      </table>
      <p style="margin:24px 0">${btn(`${config.appUrl}/appointments`, 'View booking')}</p>`),
    }),

    paymentReceipt: ({ name, amount, currency, reference, description }) => ({
        subject: 'Payment receipt — Law Elite Network',
        html: shell('Payment received', `
      <p>Hi ${esc(name || 'there')},</p>
      <p>We've received your payment. Thank you.</p>
      <table style="margin:16px 0;font-size:14px;color:#334155">
        <tr><td style="padding:4px 12px 4px 0;color:#64748b">Amount</td><td><strong>${esc(currency || 'USD')} ${esc(amount)}</strong></td></tr>
        ${description ? `<tr><td style="padding:4px 12px 4px 0;color:#64748b">For</td><td>${esc(description)}</td></tr>` : ''}
        ${reference ? `<tr><td style="padding:4px 12px 4px 0;color:#64748b">Reference</td><td><code>${esc(reference)}</code></td></tr>` : ''}
      </table>
      <p style="margin:24px 0">${btn(`${config.appUrl}/transactions`, 'View transactions')}</p>`),
    }),

    lawyerVerified: ({ name }) => ({
        subject: 'Your Law Elite profile is now live',
        html: shell('You are verified', `
      <p>Hi ${esc(name || 'Counsel')},</p>
      <p>Congratulations — your practitioner profile has been verified and is now discoverable
         to clients across the network.</p>
      <p style="margin:24px 0">${btn(`${config.appUrl}/lawyer/dashboard`, 'Go to your dashboard')}</p>`),
    }),

    payoutProcessed: ({ name, amount, currency, reference }) => ({
        subject: 'Payout processed — Law Elite Network',
        html: shell('Payout on its way', `
      <p>Hi ${esc(name || 'Counsel')},</p>
      <p>A payout of <strong>${esc(currency || 'USD')} ${esc(amount)}</strong> has been processed to your account.</p>
      ${reference ? `<p style="color:#64748b;font-size:13px">Reference: <code>${esc(reference)}</code></p>` : ''}
      <p style="margin:24px 0">${btn(`${config.appUrl}/lawyer/earnings`, 'View earnings')}</p>`),
    }),
};

/** Send a named template; merges template output and sends. Never throws. */
async function sendTemplate(name, to, data = {}) {
    const tpl = templates[name];
    if (!tpl) { console.error(`[mailer] unknown template "${name}"`); return { sent: false }; }
    const { subject, html } = tpl(data);
    return send({ to, subject, html });
}

module.exports = { send, sendTemplate, templates, ENABLED };
