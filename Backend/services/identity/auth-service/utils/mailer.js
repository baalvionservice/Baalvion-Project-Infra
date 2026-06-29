const nodemailer = require('nodemailer');
const config = require('../config/appConfig');
const { createEmailService, isSesConfigured, loadConfig, htmlToText } = require('@baalvion/email');

let transporter = null;
let _emailService = null;
let _sesEnabled = null;

// ── Amazon SES (preferred transport) ──────────────────────────────────────────
// Auth mail (OTP, verification, invitations) is sent from the verified `auth` sender
// (noreply@baalvion.com) via the centralized SES service. Falls back to SMTP, then to a
// dev console logger, so local development without AWS credentials still runs.

function sesEnabled() {
    if (_sesEnabled === null) _sesEnabled = isSesConfigured(loadConfig());
    return _sesEnabled;
}

function getEmailService() {
    if (!_emailService) {
        // Lightweight console logger keeps auth-service free of a pino dependency here.
        _emailService = createEmailService({ logger: console });
    }
    return _emailService;
}

function getTransporter() {
    if (transporter) return transporter;
    if (!config.email.host) {
        // Dev fallback: log to console (no SMTP host configured).
        return null;
    }
    transporter = nodemailer.createTransport({
        host: config.email.host,
        port: config.email.port,
        secure: config.email.port === 465,
        // STARTTLS for 587 (e.g. AWS SES email-smtp.<region>.amazonaws.com) so SMTP creds are
        // never sent over an unencrypted connection. Port 465 is already implicit TLS.
        requireTLS: config.email.port !== 465,
        // Auth only when credentials are provided — local/relay SMTP (e.g. Mailpit) needs none.
        ...(config.email.user ? { auth: { user: config.email.user, pass: config.email.pass } } : {}),
    });
    return transporter;
}

/**
 * Send a pre-rendered email. Backward-compatible signature — callers render their own HTML.
 * Order of transports: Amazon SES (auth sender) → SMTP → dev console.
 * @param {{ to: string, subject: string, html: string, text?: string }} opts
 */
async function sendMail({ to, subject, html, text }) {
    if (sesEnabled()) {
        // `category: 'auth'` => verified noreply@baalvion.com sender + baalvion-production config set.
        await getEmailService().sendRaw({ to, subject, html, text, category: 'auth' });
        return;
    }
    const t = getTransporter();
    if (!t) {
        console.log(`[Mailer DEV] To: ${to} | Subject: ${subject}\n${html}`);
        return;
    }
    await t.sendMail({ from: config.email.from, to, subject, html, text: text || htmlToText(html) });
}

/**
 * Whether a real mail transport is configured (Amazon SES OR SMTP). Flows where delivery is the
 * WHOLE point — e.g. email-OTP login — must check this and fail loudly instead of silently
 * falling back to the dev console logger (which would tell the user "code sent" while no email is
 * ever delivered). Best-effort flows (register/reset) ignore this and fire-and-forget.
 */
function isMailerConfigured() {
    return sesEnabled() || !!config.email.host;
}

module.exports = { sendMail, isMailerConfigured };
