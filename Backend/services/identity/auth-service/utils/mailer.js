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
        // STARTTLS for authenticated relays on 587 (e.g. AWS SES email-smtp.<region>.amazonaws.com)
        // so SMTP creds are never sent over an unencrypted connection. Port 465 is already implicit
        // TLS. Credential-less local/dev catchers (e.g. Mailpit) don't speak STARTTLS at all —
        // forcing it there breaks every local email send with "Command not implemented".
        requireTLS: config.email.port !== 465 && Boolean(config.email.user),
        // Auth only when credentials are provided — local/relay SMTP (e.g. Mailpit) needs none.
        ...(config.email.user ? { auth: { user: config.email.user, pass: config.email.pass } } : {}),
    });
    return transporter;
}

/**
 * Make a value safe to appear in a log line.
 *
 * A recipient address is chosen by whoever registered, so it reaches this file as untrusted
 * text. Interpolating it raw lets somebody who signs up with a newline in the local part
 * write their own entries into the log — forged lines that read exactly like real ones,
 * which is how an audit trail stops being evidence.
 *
 * Newlines and tabs collapse to a single space, any remaining control characters are
 * dropped, and the result is capped so one long value cannot push the rest of a line out of
 * view.
 */
const forLog = (value) => String(value ?? '')
    .replace(/[\r\n\t]+/g, ' ')
    .replace(/\p{Cc}/gu, '')
    .slice(0, 200);


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
        // No transport. The body is NOT logged: it carries the verification / reset link, and
        // that link is a bearer credential — printing it put a working single-use token into
        // stdout, which is then shipped wherever logs go.
        if (config.env === 'production') {
            // A production deployment with no transport is a misconfiguration, not a fallback.
            // Said loudly, and still without the body.
            console.error(`[Mailer] NO TRANSPORT CONFIGURED — "${forLog(subject)}" was not delivered. Configure SES or SMTP.`);
            return;
        }
        console.log(`[Mailer DEV] To: ${forLog(to)} | Subject: ${forLog(subject)} (body withheld — it contains a one-time link)`);
        // Local development still needs the link to click, so it is available behind an
        // explicit opt-in rather than on by default.
        if (/^(1|true|yes|on)$/i.test(String(process.env.MAIL_DEV_LOG_LINKS || ''))) {
            const link = (String(html).match(/https?:\/\/[^"'\s>]+/) || [])[0];
            if (link) console.log(`[Mailer DEV] MAIL_DEV_LOG_LINKS is on — link: ${link}`);
        }
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
/**
 * What the mail transport is, in a form safe to print at start-up.
 *
 * The point is to make a misconfigured deployment obvious at BOOT rather than at the moment
 * somebody registers and never receives their link — today that failure is invisible until a
 * real person is already stuck.
 *
 * Nothing here is a secret. The host is named because an operator needs to know which relay
 * is in use; the username is reported only as present or absent, and the password is never
 * read. There is deliberately no "test connection" here either: a start-up probe that opens
 * an SMTP session would make boot depend on a third party being up.
 */
function describeMailer() {
    if (sesEnabled()) {
        return { transport: 'ses', configured: true, detail: 'Amazon SES', from: config.email.from };
    }
    if (config.email.host) {
        return {
            transport: 'smtp',
            configured: true,
            detail: `${config.email.host}:${config.email.port}`,
            authenticated: Boolean(config.email.user),   // whether, never what
            from: config.email.from,
        };
    }
    return { transport: 'none', configured: false, detail: 'No SES and no SMTP_HOST', from: config.email.from };
}

/**
 * Say at start-up whether mail can actually be delivered.
 *
 * In production a missing transport is a misconfiguration, not a fallback: registration,
 * verification and password reset all silently produce nothing. It is reported loudly and
 * once, here, instead of failing one user at a time.
 *
 * It does not exit the process. auth-service also serves login, refresh and token
 * verification for the whole platform, and refusing to boot over mail would turn a
 * degraded-email incident into a total outage.
 */
function reportMailerAtStartup(log = console) {
    const state = describeMailer();
    if (state.configured) {
        log.log(`[Mailer] ${state.transport.toUpperCase()} configured (${state.detail}), from ${state.from}`);
        return state;
    }
    if (config.env === 'production') {
        log.error('[Mailer] NO TRANSPORT CONFIGURED. Verification, password-reset and invitation '
            + 'emails will NOT be delivered. Set SES credentials or SMTP_HOST/SMTP_PORT/SMTP_USER/SMTP_PASS.');
    } else {
        log.warn(`[Mailer] No transport configured (${config.env}). Emails are not sent. `
            + 'Set MAIL_DEV_LOG_LINKS=true to print verification and reset links to this log.');
    }
    return state;
}

function isMailerConfigured() {
    return sesEnabled() || !!config.email.host;
}

module.exports = { sendMail, isMailerConfigured, describeMailer, reportMailerAtStartup };
