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

module.exports = { sendMail };
