'use strict';
const { z }         = require('zod');
const { getQueues } = require('../queue/queues');
const emailService  = require('../service/emailService');
const webhookService = require('../service/webhookService');
const smsService    = require('../service/smsService');
const pushService   = require('../service/pushService');
const inappService  = require('../service/inappService');
const deviceService = require('../service/deviceService');
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
        const { emailQueue, webhookQueue, smsQueue, pushQueue, notificationQueue } = getQueues();
        const stat = async (q) => ({ waiting: await q.getWaitingCount(), failed: await q.getFailedCount(), active: await q.getActiveCount() });
        const [email, webhook, sms, push, notification] = await Promise.all([
            stat(emailQueue), stat(webhookQueue), stat(smsQueue), stat(pushQueue), stat(notificationQueue),
        ]);
        sendSuccess(req, res, { email, webhook, sms, push, notification });
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

// ── SMS (internal) ──────────────────────────────────────────────────────────────
const smsSchema = z.object({
    to:             z.string().min(5),
    body:           z.string().min(1).max(1600),
    idempotencyKey: z.string().optional(),
    priority:       z.number().min(1).max(10).optional(),
    delay:          z.number().min(0).optional(),
});

exports.enqueueSms = async (req, res, next) => {
    try {
        const parsed = smsSchema.safeParse(req.body);
        if (!parsed.success) throw new AppError('VALIDATION_ERROR', 'Invalid payload', 400, parsed.error.flatten());
        const { smsQueue } = getQueues();
        const job = await smsQueue.add('api-sms', parsed.data, { priority: parsed.data.priority, delay: parsed.data.delay });
        sendSuccess(req, res, { jobId: job.id }, 202);
    } catch (err) { next(err); }
};

// ── Push (internal) ───────────────────────────────────────────────────────────
const pushSchema = z.object({
    userId:         z.string().optional(),
    tokens:         z.array(z.string()).optional(),
    title:          z.string().optional(),
    body:           z.string().optional(),
    data:           z.record(z.unknown()).optional(),
    idempotencyKey: z.string().optional(),
}).refine((d) => d.userId || (d.tokens && d.tokens.length), { message: 'userId or tokens required' })
  .refine((d) => d.title || d.body, { message: 'title or body required' });

exports.enqueuePush = async (req, res, next) => {
    try {
        const parsed = pushSchema.safeParse(req.body);
        if (!parsed.success) throw new AppError('VALIDATION_ERROR', 'Invalid payload', 400, parsed.error.flatten());
        const { pushQueue } = getQueues();
        const job = await pushQueue.add('api-push', parsed.data);
        sendSuccess(req, res, { jobId: job.id }, 202);
    } catch (err) { next(err); }
};

// ── Unified multi-channel dispatch (internal) ─────────────────────────────────
const dispatchSchema = z.object({
    userId:     z.string().optional(),
    recipients: z.object({ email: z.string().email().optional(), phone: z.string().optional() }).optional(),
    channels:   z.array(z.enum(['email', 'sms', 'push', 'inapp'])).optional(),
    email:      z.record(z.unknown()).optional(),
    sms:        z.object({ body: z.string() }).optional(),
    push:       z.object({ title: z.string().optional(), body: z.string().optional(), data: z.record(z.unknown()).optional() }).optional(),
    inapp:      z.object({ title: z.string().optional(), body: z.string().optional(), data: z.record(z.unknown()).optional(), type: z.string().optional() }).optional(),
    idempotencyKey: z.string().optional(),
});

exports.dispatch = async (req, res, next) => {
    try {
        const parsed = dispatchSchema.safeParse(req.body);
        if (!parsed.success) throw new AppError('VALIDATION_ERROR', 'Invalid payload', 400, parsed.error.flatten());
        const { notificationQueue } = getQueues();
        const job = await notificationQueue.add('api-dispatch', parsed.data);
        sendSuccess(req, res, { jobId: job.id }, 202);
    } catch (err) { next(err); }
};

// ── Device tokens (user — registers their own device for push) ─────────────────
const deviceSchema = z.object({ token: z.string().min(1), platform: z.enum(['web', 'ios', 'android']).optional() });

exports.registerDevice = async (req, res, next) => {
    try {
        const parsed = deviceSchema.safeParse(req.body);
        if (!parsed.success) throw new AppError('VALIDATION_ERROR', 'Invalid payload', 400, parsed.error.flatten());
        const out = await deviceService.registerDevice(req.auth.userId, parsed.data.token, parsed.data.platform || 'web');
        sendSuccess(req, res, out, 201);
    } catch (err) { next(err); }
};

exports.unregisterDevice = async (req, res, next) => {
    try { sendSuccess(req, res, await deviceService.unregisterDevice(req.auth.userId, req.params.token)); }
    catch (err) { next(err); }
};

exports.listDevices = async (req, res, next) => {
    try { sendSuccess(req, res, { items: await deviceService.listDevices(req.auth.userId) }); }
    catch (err) { next(err); }
};

// ── Channel preferences (user) ──────────────────────────────────────────────────
exports.getPreferences = async (req, res, next) => {
    try { sendSuccess(req, res, await deviceService.getPreferences(req.auth.userId)); }
    catch (err) { next(err); }
};

exports.updatePreferences = async (req, res, next) => {
    try {
        const parsed = z.record(z.boolean()).safeParse(req.body);
        if (!parsed.success) throw new AppError('VALIDATION_ERROR', 'Body must be { channel: boolean }', 400, parsed.error.flatten());
        sendSuccess(req, res, await deviceService.setPreferences(req.auth.userId, parsed.data));
    } catch (err) { next(err); }
};

// ── In-app inbox (user) ──────────────────────────────────────────────────────────
exports.getInbox = async (req, res, next) => {
    try {
        const limit = Math.min(parseInt(req.query.limit || '50', 10), 100);
        sendSuccess(req, res, await inappService.getInbox(req.auth.userId, { limit }));
    } catch (err) { next(err); }
};

exports.markInboxRead = async (req, res, next) => {
    try { sendSuccess(req, res, await inappService.markRead(req.auth.userId, req.params.id)); }
    catch (err) { next(err); }
};

exports.markInboxAllRead = async (req, res, next) => {
    try { sendSuccess(req, res, await inappService.markAllRead(req.auth.userId)); }
    catch (err) { next(err); }
};
