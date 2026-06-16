'use strict';
const db = require('../models');
const { AppError } = require('../utils/errors');
const { sendSuccess } = require('../utils/response');

async function _audit(req, action, entity_type, entity_id) {
    try {
        await db.AuditLog.create({
            org_id: req.user.orgId, action, entity_type, entity_id,
            user_id: req.user.id, role: req.user.role, resource: req.originalUrl,
            ip_address: req.ip, status: 'Success', severity: 'Info',
        });
    } catch (_) { /* non-blocking */ }
}

const iso = (v) => (v == null ? null : new Date(v).toISOString());

exports.get = async (req, res, next) => {
    try {
        const orgId = req.user.orgId;
        const [jobs, hooks] = await Promise.all([
            db.AutomationCronJob.findAll({ where: { org_id: orgId }, order: [['next_run', 'ASC']], raw: true }),
            db.AutomationWebhook.findAll({ where: { org_id: orgId }, order: [['occurred_at', 'DESC']], raw: true }),
        ]);
        return sendSuccess(req, res, {
            cronJobs: jobs.map((j) => ({
                id: j.job_key, name: j.name, description: j.description, frequency: j.frequency,
                lastRun: iso(j.last_run), nextRun: iso(j.next_run), duration: j.duration, status: j.status,
            })),
            webhooks: hooks.map((w) => ({
                id: w.event_key, timestamp: iso(w.occurred_at), eventType: w.event_type,
                source: w.source, payload: w.payload, responseCode: w.response_code, status: w.status,
            })),
        });
    } catch (err) { return next(err); }
};

exports.runJob = async (req, res, next) => {
    try {
        const job = await db.AutomationCronJob.findOne({ where: { job_key: req.params.jobKey, org_id: req.user.orgId } });
        if (!job) return next(new AppError('NOT_FOUND', 'Job not found', 404));
        await job.update({ last_run: new Date(), status: 'Success' });
        await _audit(req, 'RUN_CRON_JOB', 'automation_cron_job', job.job_key);
        return sendSuccess(req, res, {
            id: job.job_key, name: job.name, lastRun: iso(job.last_run), status: job.status,
        });
    } catch (err) { return next(err); }
};
