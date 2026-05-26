'use strict';
const { z }         = require('zod');
const { getQueues } = require('../queue/queues');
const emailService  = require('../service/emailService');
const webhookService = require('../service/webhookService');
const { sendSuccess, sendPaginated } = require('../utils/response');
const { AppError }  = require('../utils/errors');
const config        = require('../config/appConfig');

// ── Internal: enqueue email ───────────────────────────────────────────────────

const emailSchema = z.object({
    to:             z.string().email(),
    templateName:   z.string().optional(),
    data:           z.record(z.unknown()).optional(),
    idempotencyKey: z.string().optional(),
    rawSubject:     z.string().optional(),
    rawHtml:        z.string().optional(),
    priority:       z.number().min(1).max(10).optional(),
    delay:          z.number().min(0).optional(),
});

exports.enqueueEmail = async (req, res, next) => {
    try {
        const parsed = emailSchema.safeParse(req.body);
        if (!parsed.success) throw new AppError('VALIDATION_ERROR', 'Invalid payload', 400, parsed.error.flatten());

        const { emailQueue } = getQueues();
        const job = await emailQueue.add('api-email', parsed.data, {
            priority: parsed.data.priority,
            delay:    parsed.data.delay,
        });
        sendSuccess(req, res, { jobId: job.id }, 202);
    } catch (err) { next(err); }
};

// ── Internal: enqueue webhook ─────────────────────────────────────────────────

const webhookSchema = z.object({
    url:    z.string().url(),
    event:  z.string(),
    data:   z.record(z.unknown()),
    secret: z.string().optional(),
});

exports.enqueueWebhook = async (req, res, next) => {
    try {
        const parsed = webhookSchema.safeParse(req.body);
        if (!parsed.success) throw new AppError('VALIDATION_ERROR', 'Invalid payload', 400, parsed.error.flatten());

        const { webhookQueue } = getQueues();
        const job = await webhookQueue.add('api-webhook', parsed.data);
        sendSuccess(req, res, { jobId: job.id }, 202);
    } catch (err) { next(err); }
};

// ── Internal: send email synchronously (for critical auth emails) ─────────────

exports.sendEmailSync = async (req, res, next) => {
    try {
        const parsed = emailSchema.safeParse(req.body);
        if (!parsed.success) throw new AppError('VALIDATION_ERROR', 'Invalid payload', 400, parsed.error.flatten());

        const result = await emailService.sendEmail(parsed.data);
        sendSuccess(req, res, result, 200);
    } catch (err) { next(err); }
};

// ── Queue stats ────────────────────────────────────────────────────────────────

exports.getQueueStats = async (req, res, next) => {
    try {
        const { emailQueue, webhookQueue } = getQueues();
        const [ew, ef, ep, ww, wf, wp] = await Promise.all([
            emailQueue.getWaitingCount(),
            emailQueue.getFailedCount(),
            emailQueue.getActiveCount(),
            webhookQueue.getWaitingCount(),
            webhookQueue.getFailedCount(),
            webhookQueue.getActiveCount(),
        ]);
        sendSuccess(req, res, {
            email:   { waiting: ew, failed: ef, active: ep },
            webhook: { waiting: ww, failed: wf, active: wp },
        });
    } catch (err) { next(err); }
};

// ── DLQ viewer ─────────────────────────────────────────────────────────────────

exports.getDlq = async (req, res, next) => {
    try {
        const redis = require('../config/redis');
        const r = redis.getClient();
        if (!r) return sendSuccess(req, res, { items: [] });

        const entries = await r.xrevrange(config.eventBus.dlqStream, '+', '-', 'COUNT', 50);
        const items = entries.map(([id, fields]) => {
            const obj = { id };
            for (let i = 0; i < fields.length; i += 2) obj[fields[i]] = fields[i + 1];
            return obj;
        });
        sendSuccess(req, res, { items, total: items.length });
    } catch (err) { next(err); }
};

// ── Retry DLQ item ────────────────────────────────────────────────────────────

exports.retryDlqItem = async (req, res, next) => {
    try {
        const { entryId } = req.params;
        const redis = require('../config/redis');
        const r     = redis.getClient();
        if (!r) throw new AppError('SERVICE_UNAVAILABLE', 'Redis not available', 503);

        const entries = await r.xrange(config.eventBus.dlqStream, entryId, entryId);
        if (!entries.length) throw new AppError('NOT_FOUND', 'DLQ entry not found', 404);

        const [, fields] = entries[0];
        const obj = {};
        for (let i = 0; i < fields.length; i += 2) obj[fields[i]] = fields[i + 1];

        if (obj.source === 'email-worker' && obj.payload) {
            const { emailQueue } = getQueues();
            await emailQueue.add('dlq-retry', JSON.parse(obj.payload));
        }

        // Remove from DLQ
        await r.xdel(config.eventBus.dlqStream, entryId);
        sendSuccess(req, res, { message: 'Requeued for retry' });
    } catch (err) { next(err); }
};
