'use strict';
/**
 * Best-effort mail sender for marketplace-service (investor invitations). Amazon SES
 * (preferred, verified `notifications` sender) when AWS credentials are configured,
 * otherwise falls back to Mailpit over local SMTP in dev. Mirrors admin-service's
 * utils/mailer.js so invitation delivery behaves identically across services.
 */
const net = require('net');
const { createEmailService, isSesConfigured, loadConfig } = require('@baalvion/email');

const HOST = process.env.SMTP_HOST || '127.0.0.1';
const PORT = Number(process.env.SMTP_PORT || 1025);
const FROM = process.env.EMAIL_FROM || 'noreply@baalvion.com';

let _sesEnabled = null;
let _emailService = null;
function sesEnabled() {
    if (_sesEnabled === null) _sesEnabled = isSesConfigured(loadConfig());
    return _sesEnabled;
}
function emailService() {
    if (!_emailService) _emailService = createEmailService({ logger: console });
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
            `From: Baalvion Invest <${FROM}>`,
            `To: ${to}`,
            `Subject: ${subject}`,
            'MIME-Version: 1.0',
            `Content-Type: ${isHtml ? 'text/html' : 'text/plain'}; charset=utf-8`,
            '',
            body,
        ].join('\r\n');

        const steps = [
            { send: null, expect: 220 },
            { send: `EHLO baalvion-marketplace\r\n`, expect: 250 },
            { send: `MAIL FROM:<${FROM}>\r\n`, expect: 250 },
            { send: `RCPT TO:<${to}>\r\n`, expect: 250 },
            { send: `DATA\r\n`, expect: 354 },
            { send: `${message}\r\n.\r\n`, expect: 250 },
            { send: `QUIT\r\n`, expect: 221 },
        ];
        let idx = 0;
        let buf = '';

        const fail = (msg) => {
            try { socket.destroy(); } catch { /* already torn down */ }
            reject(new Error(msg));
        };

        socket.on('data', (chunk) => {
            buf += chunk;
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

async function sendMail(opts) {
    if (sesEnabled()) {
        await emailService().sendRaw({
            to: opts.to, subject: opts.subject,
            html: opts.html || (opts.text ? `<p>${String(opts.text).replace(/\n/g, '<br/>')}</p>` : '<p></p>'),
            text: opts.text, category: 'invrel',
        });
        return { delivered: true };
    }
    return sendViaSmtp(opts);
}

/** Best-effort wrapper: never throws; logs and returns a status flag. */
async function sendMailSafe(opts) {
    try {
        await sendMail(opts);
        console.info('[mailer] delivered', { to: opts.to, subject: opts.subject });
        return { delivered: true };
    } catch (err) {
        console.warn('[mailer] delivery failed (non-fatal)', { to: opts.to, err: err.message });
        return { delivered: false, error: err.message };
    }
}

module.exports = { sendMail, sendMailSafe };
