'use strict';
/**
 * Minimal, dependency-free SMTP sender.
 *
 * The dev stack runs Mailpit (plain SMTP on localhost:1025, no auth, no TLS),
 * so a tiny hand-rolled SMTP conversation is enough — no nodemailer dependency.
 * Sending is BEST-EFFORT: callers must not let a mail failure abort their work.
 *
 *   SMTP_HOST (default 127.0.0.1)   SMTP_PORT (default 1025)
 *   EMAIL_FROM (default noreply@baalvion.com)
 */
const net = require('net');
const logger = require('./logger');
const { createEmailService, isSesConfigured, loadConfig } = require('@baalvion/email');

const HOST = process.env.SMTP_HOST || '127.0.0.1';
const PORT = Number(process.env.SMTP_PORT || 1025);
const FROM = process.env.EMAIL_FROM || 'noreply@baalvion.com';

// Amazon SES (preferred). When AWS credentials are present, admin mail (staff invites,
// onboarding) is sent through the centralized SES service from the verified `notifications`
// sender; otherwise the existing minimal SMTP conversation (dev Mailpit) is used.
let _sesEnabled = null;
let _emailService = null;
function sesEnabled() {
    if (_sesEnabled === null) _sesEnabled = isSesConfigured(loadConfig());
    return _sesEnabled;
}
function emailService() {
    if (!_emailService) _emailService = createEmailService({ logger });
    return _emailService;
}

function sendViaSmtp({ to, subject, html, text }) {
    return new Promise((resolve, reject) => {
        const socket = net.createConnection({ host: HOST, port: PORT });
        socket.setEncoding('utf8');
        socket.setTimeout(5000);

        const body = html || text || '';
        const isHtml = !!html;
        const message = [
            `From: Baalvion Admin <${FROM}>`,
            `To: ${to}`,
            `Subject: ${subject}`,
            'MIME-Version: 1.0',
            `Content-Type: ${isHtml ? 'text/html' : 'text/plain'}; charset=utf-8`,
            '',
            body,
        ].join('\r\n');

        // Scripted SMTP: each step waits for the previous 2xx/3xx reply.
        const steps = [
            { send: null,                              expect: 220 },
            { send: `EHLO baalvion-admin\r\n`,         expect: 250 },
            { send: `MAIL FROM:<${FROM}>\r\n`,         expect: 250 },
            { send: `RCPT TO:<${to}>\r\n`,             expect: 250 },
            { send: `DATA\r\n`,                        expect: 354 },
            { send: `${message}\r\n.\r\n`,             expect: 250 },
            { send: `QUIT\r\n`,                        expect: 221 },
        ];
        let idx = 0;
        let buf = '';

        const fail = (msg) => {
            try {
                socket.destroy();
            } catch (err) {
                // Socket may already be torn down; surface it at debug, never abort the reject.
                logger.debug({ err: err.message }, '[mailer] socket.destroy during failure handling');
            }
            reject(new Error(msg));
        };

        socket.on('data', (chunk) => {
            buf += chunk;
            // Wait for a complete reply line.
            if (!buf.endsWith('\r\n')) return;
            const code = parseInt(buf.slice(0, 3), 10);
            const step = steps[idx];
            if (code !== step.expect) return fail(`SMTP step ${idx} expected ${step.expect}, got: ${buf.trim()}`);
            buf = '';
            idx += 1;
            if (idx >= steps.length) { resolve({ delivered: true }); return; }
            const next = steps[idx];
            if (next.send) socket.write(next.send);
        });

        socket.on('timeout', () => fail('SMTP timeout'));
        socket.on('error', (e) => fail(`SMTP socket error: ${e.message}`));
    });
}

/**
 * Send a pre-rendered email. Amazon SES (notifications sender) when configured, otherwise the
 * minimal SMTP conversation above. Backward-compatible signature.
 * @param {{ to:string, subject:string, html?:string, text?:string }} opts
 */
async function sendMail(opts) {
    if (sesEnabled()) {
        await emailService().sendRaw({
            to: opts.to, subject: opts.subject,
            html: opts.html || (opts.text ? `<p>${String(opts.text).replace(/\n/g, '<br/>')}</p>` : '<p></p>'),
            text: opts.text, category: 'notifications',
        });
        return { delivered: true };
    }
    return sendViaSmtp(opts);
}

/** Best-effort wrapper: never throws; logs and returns a status flag. */
async function sendMailSafe(opts) {
    try {
        await sendMail(opts);
        logger.info({ to: opts.to, subject: opts.subject }, '[mailer] delivered');
        return { delivered: true };
    } catch (err) {
        logger.warn({ to: opts.to, err: err.message }, '[mailer] delivery failed (non-fatal)');
        return { delivered: false, error: err.message };
    }
}

module.exports = { sendMail, sendMailSafe };
