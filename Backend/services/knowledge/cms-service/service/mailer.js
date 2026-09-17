'use strict';
// Transactional email for cms-service. Amazon SES via @baalvion/email — the same
// centralized sender every other service uses (law-service, admin-service, etc.).
// Best-effort: a failed send is logged, never thrown into the invite/member-add
// request path.
const { createEmailService, isSesConfigured, loadConfig } = require('@baalvion/email');
const { logger } = require('../platform/logger');

const log = logger('mailer');

let _sesEnabled = null;
let _emailService = null;
let _emailConfig = null;

function emailConfig() {
    if (!_emailConfig) _emailConfig = loadConfig();
    return _emailConfig;
}
function sesEnabled() {
    if (_sesEnabled === null) _sesEnabled = isSesConfigured(emailConfig());
    return _sesEnabled;
}
function emailService() {
    if (!_emailService) _emailService = createEmailService({ logger: console });
    return _emailService;
}

/** Base URL of the admin console (where /invite/:token lives). */
function adminUrl() {
    return emailConfig().adminUrl;
}

/**
 * Send the VIP "you're invited to write for {publication}" email.
 * Never throws — a mail failure must not fail the invite/member-add request.
 */
async function sendContributorInvitation({
    to, publication, roleName, inviterName, personalNote, token, expiresHours,
}) {
    if (!to) return { sent: false };
    const acceptUrl = `${adminUrl()}/invite/${encodeURIComponent(token)}`;
    try {
        if (!sesEnabled()) {
            log.info({ to, publication, acceptUrl }, '[mailer] SES not configured — invitation logged, not sent');
            return { sent: false, logged: true, acceptUrl };
        }
        const res = await emailService().send({
            to,
            template: 'contributorInvitation',
            data: {
                publication,
                roleName,
                inviterName,
                personalNote,
                acceptUrl,
                email: to,
                expiresHours,
            },
        });
        if (res.status === 'sent') return { sent: true, messageId: res.messageId };
        log.warn({ to, status: res.status, error: res.error }, '[mailer] contributor invitation not sent');
        return { sent: false, error: res.error };
    } catch (err) {
        log.error({ err: err.message, to }, '[mailer] contributor invitation send failed');
        return { sent: false, error: err.message };
    }
}

// Same real inbox every "mailto:" link on the public site already points at
// (Frontend/Imperialpedia-main/src/config/env.ts's contactEmail default) — kept
// separately configurable here since the recipient is a business decision, not
// a code constant.
const AUTHOR_CONTACT_RECIPIENT = process.env.AUTHOR_CONTACT_EMAIL || 'Founder@baalvion.com';

function _escapeHtml(s) {
    return String(s ?? '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}

/**
 * "Contact the author" form on /authors/[slug] — relays the reader's message by
 * email rather than writing to a moderated table (there's no author-inquiry
 * model/admin review UI yet; email is the real, working channel that already
 * exists). Never throws — a mail failure must not fail the submit request.
 */
async function sendAuthorContactMessage({ authorSlug, authorName, fromName, fromEmail, message }) {
    try {
        if (!sesEnabled()) {
            log.info({ authorSlug, fromEmail }, '[mailer] SES not configured — author contact message logged, not sent');
            return { sent: false, logged: true };
        }
        const html = `
            <p>New message from the "${_escapeHtml(authorName)}" author page (<code>/authors/${_escapeHtml(authorSlug)}</code>):</p>
            <p><strong>From:</strong> ${_escapeHtml(fromName)} &lt;${_escapeHtml(fromEmail)}&gt;</p>
            <p><strong>Message:</strong></p>
            <p>${_escapeHtml(message).replace(/\n/g, '<br/>')}</p>
        `;
        const res = await emailService().sendRaw({
            to: AUTHOR_CONTACT_RECIPIENT,
            subject: `New message for ${authorName} via Imperialpedia`,
            html,
            category: 'support',
            replyTo: fromEmail,
        });
        if (res.status === 'sent') return { sent: true, messageId: res.messageId };
        log.warn({ authorSlug, status: res.status, error: res.error }, '[mailer] author contact message not sent');
        return { sent: false, error: res.error };
    } catch (err) {
        log.error({ err: err.message, authorSlug }, '[mailer] author contact message send failed');
        return { sent: false, error: err.message };
    }
}

module.exports = { sendContributorInvitation, sendAuthorContactMessage };
