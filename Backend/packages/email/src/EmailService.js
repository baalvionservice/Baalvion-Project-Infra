'use strict';

const { createSesClient, buildSendCommand } = require('./client');
const { resolveSender, replyToFor } = require('./senders');
const { render, categoryOf, isMarketing } = require('./templates');
const { withRetry, isTransient } = require('./retry');
const { NoopStore } = require('./stores');
const { loadConfig, isSesConfigured } = require('./config');
const { htmlToText } = require('./text');

/**
 * Build the RFC 8058 List-Unsubscribe + List-Unsubscribe-Post headers for marketing mail.
 * Returns `null` when no unsubscribe target is available so transactional mail never gets one.
 * @param {import('./config').EmailConfig} config
 * @param {string} [unsubscribeUrl]
 * @returns {Array<{name:string,value:string}>|null}
 */
function marketingUnsubscribeHeaders(config, unsubscribeUrl) {
    const targets = [];
    if (config.unsubscribeMailto) targets.push(`<mailto:${config.unsubscribeMailto}?subject=unsubscribe>`);
    if (unsubscribeUrl) targets.push(`<${unsubscribeUrl}>`);
    if (!targets.length) return null;
    return [
        { name: 'List-Unsubscribe', value: targets.join(', ') },
        // One-click unsubscribe (only valid alongside an https URL).
        ...(unsubscribeUrl ? [{ name: 'List-Unsubscribe-Post', value: 'List-Unsubscribe=One-Click' }] : []),
    ];
}

/**
 * Centralized Amazon SES email service.
 *
 * Dependency-injected and reusable across every backend service:
 *
 *   const { createEmailService } = require('@baalvion/email');
 *   const email = createEmailService({ logger, store });   // config from env by default
 *   await email.sendOTP({ to, code, expiresMinutes: 5 });
 *
 * Responsibilities:
 *  - Pick the correct verified sender automatically from the template's category.
 *  - Render responsive, dark-mode templates.
 *  - Send through SESv2 (AWS SDK v3) with the platform configuration set.
 *  - Retry transient failures; never retry hard bounces / permanent rejections.
 *  - Record every send (recipient, sender, template, status, timestamp, messageId, config set).
 */
class EmailService {
    /**
     * @param {Object} [deps]
     * @param {import('./config').EmailConfig} [deps.config]   resolved config (defaults from env)
     * @param {any} [deps.sesClient]                            pre-built SESv2 client (else created from config)
     * @param {{info:Function,warn:Function,error:Function,debug?:Function}} [deps.logger]
     * @param {{record:Function,updateStatus:Function,get?:Function}} [deps.store]  log/status store
     */
    constructor(deps = {}) {
        this.config = deps.config || loadConfig();
        this.logger = deps.logger || console;
        this.store = deps.store || new NoopStore(this.logger);
        this.enabled = isSesConfigured(this.config);
        // Lazily create the SES client only when SES is actually configured, so a dev box
        // without AWS creds can still load the package (sends become no-ops with a clear log).
        this._sesClient = deps.sesClient || (this.enabled ? createSesClient(this.config) : null);

        this.ctx = {
            appUrl: this.config.appUrl,
            supportEmail: this.config.senders.support,
            billingEmail: this.config.senders.billing,
        };
    }

    /** Whether real SES delivery is configured. Critical flows (OTP) should check this. */
    isConfigured() { return this.enabled; }

    // ── Public, purpose-named API ──────────────────────────────────────────────

    /** @param {{to:string, code:string, expiresMinutes?:number, purpose?:string, idempotencyKey?:string}} p */
    sendOTP(p) { return this._send('otp', p.to, p, p.idempotencyKey); }

    /** @param {{to:string, verifyUrl:string, email?:string, idempotencyKey?:string}} p */
    sendVerificationEmail(p) { return this._send('emailVerification', p.to, p, p.idempotencyKey); }

    /** @param {{to:string, name?:string, ctaUrl?:string, idempotencyKey?:string}} p */
    sendWelcomeEmail(p) { return this._send('welcome', p.to, p, p.idempotencyKey); }

    /** @param {{to:string, resetUrl:string, expiresMinutes?:number, idempotencyKey?:string}} p */
    sendPasswordReset(p) { return this._send('passwordReset', p.to, p, p.idempotencyKey); }

    /** @param {{to:string, time?:any, location?:string, device?:string, ip?:string, secureUrl?:string, idempotencyKey?:string}} p */
    sendLoginAlert(p) { return this._send('loginAlert', p.to, p, p.idempotencyKey); }

    /** @param {{to:string, reason?:string, time?:any, ip?:string, location?:string, riskScore?:number, secureUrl?:string, idempotencyKey?:string}} p */
    sendSecurityAlert(p) { return this._send('securityAlert', p.to, p, p.idempotencyKey); }

    /** @param {{to:string, orderNumber:string, items?:Array, total?:any, currency?:string, name?:string, orderUrl?:string, idempotencyKey?:string}} p */
    sendOrderNotification(p) { return this._send('orderConfirmation', p.to, p, p.idempotencyKey); }

    /** @param {{to:string, invoiceNumber:string, items?:Array, total?:any, currency?:string, invoiceUrl?:string, name?:string, issuedAt?:any, dueAt?:any, status?:string, idempotencyKey?:string}} p */
    sendInvoice(p) { return this._send('invoice', p.to, p, p.idempotencyKey); }

    /** @param {{to:string, message?:string, messageHtml?:string, subject?:string, ticketId?:string, agentName?:string, ticketUrl?:string, idempotencyKey?:string}} p */
    sendSupportReply(p) { return this._send('supportReply', p.to, p, p.idempotencyKey); }

    /** @param {{to:string|string[], subject?:string, title?:string, bodyHtml?:string, bodyText?:string, ctaUrl?:string, ctaLabel?:string, unsubscribeUrl?:string, idempotencyKey?:string}} p */
    sendNewsletter(p) { return this._send('newsletter', p.to, p, p.idempotencyKey); }

    /**
     * Escape hatch: send a named template not covered by a dedicated method.
     * @param {{to:string|string[], template:string, data?:object, idempotencyKey?:string}} p
     */
    send(p) { return this._send(p.template, p.to, p.data || {}, p.idempotencyKey); }

    /**
     * Low-level send of already-rendered HTML. Used by services that own their own
     * templates (auth/proxy/law/jobs/admin) so they can adopt SES without re-templating.
     * `category` chooses the verified sender (default 'auth'); pass `from` to override the
     * display name only (the address still comes from the category to keep senders verified).
     * A plain-text alternative is auto-derived from `html` when `text` is omitted.
     * `unsubscribeUrl` opts a marketing send into a List-Unsubscribe header — pass it ONLY for
     * newsletters/marketing, never for transactional mail.
     * @param {{to:string|string[], subject:string, html:string, text?:string, category?:import('./senders').EmailCategory, replyTo?:string, unsubscribeUrl?:string, idempotencyKey?:string, template?:string}} p
     * @returns {Promise<{messageId:string|null, status:string, error?:string}>}
     */
    async sendRaw(p) {
        const category = p.category || 'auth';
        const { address: sender, from } = resolveSender(this.config, category);
        const recipient = Array.isArray(p.to) ? p.to.join(',') : p.to;
        const templateLabel = p.template || 'raw';
        // Guarantee a text/plain alternative: caller's text wins, else derive from the HTML.
        const text = p.text || htmlToText(p.html);
        // List-Unsubscribe is opt-in (marketing only) — callers pass unsubscribeUrl explicitly.
        const headers = p.unsubscribeUrl ? marketingUnsubscribeHeaders(this.config, p.unsubscribeUrl) : null;
        const baseEntry = {
            recipient, sender, template: templateLabel, category,
            configurationSet: this.config.configurationSet,
            timestamp: new Date().toISOString(),
        };

        if (!this.enabled) {
            (this.logger.warn || this.logger.log).call(this.logger,
                { to: recipient, template: templateLabel }, '[email] SES not configured — raw send skipped (dev)');
            await this.store.record({ ...baseEntry, messageId: '', status: 'skipped' });
            return { messageId: null, status: 'skipped' };
        }

        const cmd = buildSendCommand({
            from, to: p.to, subject: p.subject, html: p.html, text,
            replyTo: p.replyTo || replyToFor(this.config, category),
            configurationSet: this.config.configurationSet,
            ...(headers ? { headers } : {}),
            tags: [{ name: 'template', value: templateLabel }, { name: 'category', value: category }],
        });

        try {
            const result = await withRetry(() => this._sesClient.send(cmd), {
                onRetry: ({ attempt, delay, error }) => (this.logger.warn || this.logger.log).call(this.logger,
                    { attempt, delay, err: error && error.message, to: recipient }, '[email] transient SES failure — retrying'),
            });
            await this.store.record({ ...baseEntry, messageId: result.MessageId, status: 'sent' });
            (this.logger.info || this.logger.log).call(this.logger,
                { to: recipient, template: templateLabel, messageId: result.MessageId }, '[email] sent (raw)');
            return { messageId: result.MessageId, status: 'sent' };
        } catch (err) {
            const transient = isTransient(err);
            await this.store.record({ ...baseEntry, messageId: '', status: 'failed', error: err && err.message });
            (this.logger.error || this.logger.log).call(this.logger,
                { to: recipient, transient, err: err && err.message }, '[email] raw send failed');
            if (transient) throw err;
            return { messageId: null, status: 'failed', error: err && err.message };
        }
    }

    // ── Internals ──────────────────────────────────────────────────────────────

    /**
     * Render + send a template. Returns { messageId, status } and never throws for a
     * permanent (non-retryable) failure mid-batch unless the caller opts into throwing —
     * instead it records the failure and returns { status:'failed' }. Transient errors are
     * retried; a final transient error throws so the caller's queue can re-drive the job.
     */
    async _send(templateName, to, data, idempotencyKey) {
        const category = categoryOf(templateName);
        if (!category) throw new Error(`Unknown email template: "${templateName}"`);
        const { address: sender, from } = resolveSender(this.config, category);
        const rendered = render(templateName, data, this.ctx);
        const { subject, html } = rendered;
        // Every template ships its own text; fall back to deriving it from HTML just in case.
        const text = rendered.text || htmlToText(html);
        // List-Unsubscribe only for marketing templates (newsletter) that carry an unsubscribe URL.
        const headers = isMarketing(templateName)
            ? marketingUnsubscribeHeaders(this.config, data && data.unsubscribeUrl)
            : null;
        const recipient = Array.isArray(to) ? to.join(',') : to;
        const baseEntry = {
            recipient, sender, template: templateName, category,
            configurationSet: this.config.configurationSet,
            timestamp: new Date().toISOString(),
        };

        if (!this.enabled) {
            // No SES configured (dev): log loudly, record as 'skipped', do not pretend success.
            this.logger.warn
                ? this.logger.warn({ to: recipient, template: templateName }, '[email] SES not configured — send skipped (dev)')
                : this.logger.log('[email] SES not configured — skipped', recipient, templateName);
            await this.store.record({ ...baseEntry, messageId: '', status: 'skipped' });
            return { messageId: null, status: 'skipped' };
        }

        const cmd = buildSendCommand({
            from, to, subject, html, text,
            replyTo: replyToFor(this.config, category),
            configurationSet: this.config.configurationSet,
            ...(headers ? { headers } : {}),
            tags: [
                { name: 'template', value: templateName },
                { name: 'category', value: category },
                ...(idempotencyKey ? [{ name: 'idempotency', value: idempotencyKey }] : []),
            ],
        });

        try {
            const result = await withRetry(() => this._sesClient.send(cmd), {
                onRetry: ({ attempt, delay, error }) =>
                    this.logger.warn
                        ? this.logger.warn({ attempt, delay, err: error && error.message, to: recipient }, '[email] transient SES failure — retrying')
                        : null,
            });
            const messageId = result.MessageId;
            await this.store.record({ ...baseEntry, messageId, status: 'sent' });
            this.logger.info
                ? this.logger.info({ to: recipient, template: templateName, messageId, category }, '[email] sent')
                : this.logger.log('[email] sent', recipient, templateName, messageId);
            return { messageId, status: 'sent' };
        } catch (err) {
            const transient = isTransient(err);
            await this.store.record({ ...baseEntry, messageId: '', status: 'failed', error: err && err.message });
            this.logger.error
                ? this.logger.error({ to: recipient, template: templateName, transient, err: err && err.message }, '[email] send failed')
                : this.logger.log('[email] send failed', recipient, err && err.message);
            // Transient → rethrow so a queue (BullMQ) can re-drive. Permanent (hard bounce /
            // rejected) → swallow so a bad address never poisons a batch or burns retries.
            if (transient) throw err;
            return { messageId: null, status: 'failed', error: err && err.message };
        }
    }
}

/**
 * Factory (preferred entry point for DI).
 * @param {ConstructorParameters<typeof EmailService>[0]} [deps]
 * @returns {EmailService}
 */
function createEmailService(deps) {
    return new EmailService(deps);
}

module.exports = { EmailService, createEmailService };
