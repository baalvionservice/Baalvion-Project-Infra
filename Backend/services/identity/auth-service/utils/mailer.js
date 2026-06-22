const nodemailer = require('nodemailer');
const config = require('../config/appConfig');

let transporter = null;

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

async function sendMail({ to, subject, html }) {
    const t = getTransporter();
    if (!t) {
        console.log(`[Mailer DEV] To: ${to} | Subject: ${subject}\n${html}`);
        return;
    }
    await t.sendMail({ from: config.email.from, to, subject, html });
}

/**
 * Whether a real SMTP transport is configured (i.e. SMTP_HOST is set). Flows where delivery
 * is the WHOLE point — e.g. email-OTP login — must check this and fail loudly instead of
 * silently falling back to the dev console logger (which would tell the user "code sent" while
 * no email is ever delivered). Best-effort flows (register/reset) ignore this and fire-and-forget.
 */
function isMailerConfigured() {
    return !!config.email.host;
}

module.exports = { sendMail, isMailerConfigured };
