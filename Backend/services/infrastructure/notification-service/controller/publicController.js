'use strict';
/**
 * Public (UNAUTHENTICATED) lead-capture endpoint. Reached from separately-deployed Vercel
 * frontends (Mining.Baalvion-main, about-baalvion-main, Imperialpedia-main, …) that have no
 * shared secret with the backend network — unlike /v1/notifications/email, this route needs
 * no internalAuth. Exposed at api.baalvion.com/v1/public/lead via a Caddy carve-out (same
 * pattern as the existing public CMS delivery routes).
 *
 * SECURITY: the recipient is NEVER caller-supplied — only a `site` slug is, resolved against a
 * hardcoded allowlist below. Without that, this endpoint would be an open email relay. Rate
 * limiting is two layers: middleware/leadRateLimit.js (per-IP, this route only) and
 * emailService.js's existing per-recipient hourly cap (a second, independent ceiling).
 */
const { z } = require('zod');
const emailService = require('../service/emailService');
const { sendSuccess } = require('../utils/response');
const { AppError } = require('../utils/errors');
const logger = require('../utils/logger');

// site slug -> { recipient, brand, formName }. `brand` selects the email's visual theme
// (templates/premium/brands.js); `site` here is deliberately NOT the same trust boundary as
// that brand slug — it's validated against this fixed list, never passed through free-form.
const SITES = {
    'mining-contact':      { recipient: 'trade@baalvion.com',        brand: 'mining',       formName: 'Contact form' },
    'mining-partnership':  { recipient: 'partnerships@baalvion.com', brand: 'mining',       formName: 'Partnership inquiry' },
    'about-inquiry':       { recipient: 'hello@baalvion.com',        brand: 'about',        formName: 'Inquiry' },
    'imperialpedia-contact': { recipient: 'contact@imperialpedia.com', brand: 'imperialpedia', formName: 'Contact form' },
    'proxy-enterprise':    { recipient: 'enterprise@baalvion.com',   brand: 'proxy',        formName: 'Enterprise inquiry' },
};

// Field VALUES are free text (escaped at render time in templates/premium — never trust this
// layer alone), but keys/count/length are bounded here to keep the email itself readable and
// bound worst-case payload size.
const fieldSchema = z.object({
    k: z.string().min(1).max(60),
    v: z.string().min(1).max(2000),
});

const leadSchema = z.object({
    site:    z.enum(Object.keys(SITES)),
    fields:  z.array(fieldSchema).min(1).max(20),
    message: z.string().max(5000).optional(),
    // Honeypot: real users never populate a field named this (hidden via CSS in the form);
    // a bot filling every input trips it. Silently accepted-but-dropped, not rejected outright,
    // so the bot gets no signal that it was caught.
    website: z.string().max(200).optional(),
});

exports.submitLead = async (req, res, next) => {
    try {
        const parsed = leadSchema.safeParse(req.body);
        if (!parsed.success) throw new AppError('VALIDATION_ERROR', 'Invalid submission', 400, parsed.error.flatten());

        if (parsed.data.website) {
            // Honeypot tripped — report success so the bot moves on, but never actually send.
            logger.info({ site: parsed.data.site, ip: req.ip }, 'lead submission honeypot tripped — dropped silently');
            return sendSuccess(req, res, { submitted: true }, 202);
        }

        const target = SITES[parsed.data.site];
        const result = await emailService.sendEmail({
            to:           target.recipient,
            templateName: 'leadNotification',
            data: {
                brand:    target.brand,
                formName: target.formName,
                fields:   parsed.data.fields,
                message:  parsed.data.message,
            },
        });

        if (result.suppressed) {
            // Rate-limited or deduped — still a success from the submitter's point of view
            // (they don't need to know the team's inbox is momentarily throttled).
            logger.warn({ site: parsed.data.site, reason: result.reason }, 'lead notification suppressed');
        }

        sendSuccess(req, res, { submitted: true }, 202);
    } catch (err) { next(err); }
};
