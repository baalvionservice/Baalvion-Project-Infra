'use strict';
const queue = require('../queue');
const { workerMetrics } = require('../queue/workers');
const { sendSuccess } = require('../utils/response');
const { AppError } = require('../utils/errors');

// :name is a URL segment — reject an unregistered queue as a 400 rather than letting
// the registry's fail-closed throw surface as a 500.
const knownQueue = (name) => {
    if (![...queue.QUEUE_NAMES, queue.DLQ].includes(name)) {
        throw new AppError('VALIDATION_ERROR', `Unknown queue: ${name}`, 400, { known: queue.QUEUE_NAMES });
    }
    return name;
};

const health = async (req, res, next) => {
    try {
        const queues = await queue.health();
        const realtime = require('../realtime').health();
        return sendSuccess(req, res, { queues, workers: workerMetrics(), realtime });
    } catch (err) { return next(err); }
};

const replay = async (req, res, next) => {
    try {
        const replayed = await queue.replayDeadLetter(Number(req.body && req.body.limit) || 100);
        return sendSuccess(req, res, { replayed });
    } catch (err) { return next(err); }
};

const pause = async (req, res, next) => {
    try { await queue.pause(knownQueue(req.params.name)); return sendSuccess(req, res, { paused: req.params.name }); }
    catch (err) { return next(err); }
};
const resume = async (req, res, next) => {
    try { await queue.resume(knownQueue(req.params.name)); return sendSuccess(req, res, { resumed: req.params.name }); }
    catch (err) { return next(err); }
};

// Enqueue a notification through the delivery pipeline.
const dispatchNotification = async (req, res, next) => {
    try {
        const data = { tenantId: (req.auth && req.auth.tenantId) || 'T-DEMO', ...req.body };
        const job = await queue.enqueue('notifications', 'notify', data, req.body && req.body.idempotencyKey ? { jobId: req.body.idempotencyKey } : {});
        return sendSuccess(req, res, { jobId: job.id }, 201);
    } catch (err) { return next(err); }
};

module.exports = { health, replay, pause, resume, dispatchNotification };
