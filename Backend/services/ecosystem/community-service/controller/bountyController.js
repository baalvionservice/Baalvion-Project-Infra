'use strict';
const svc = require('../service/bountyService');
const v = require('../validators/bounty');
const { decodeEmailFromRequest } = require('../middleware/authMiddleware');
const { sendSuccess } = require('../utils/response');
const { AppError } = require('../utils/errors');

const parse = (schema, body) => {
    const r = schema.safeParse(body || {});
    if (!r.success) {
        const issue = r.error.issues[0];
        throw new AppError('VALIDATION_ERROR', `${issue.path.join('.') || 'body'}: ${issue.message}`, 422);
    }
    return r.data;
};
const h = (fn) => async (req, res, next) => {
    try { return await fn(req, res); } catch (err) { return next(err); }
};
const uid = (req) => req.auth.userId;
const label = (req) => { const e = decodeEmailFromRequest(req); return e ? e.split('@')[0].slice(0, 80) : null; };
const page = (req) => ({ limit: req.query.limit, offset: req.query.offset });

module.exports = {
    status: h(async (req, res) => sendSuccess(req, res, await svc.getStatus(uid(req)))),
    accept: h(async (req, res) => sendSuccess(req, res, await svc.acceptRules(uid(req)))),
    tasks: h(async (req, res) => sendSuccess(req, res, await svc.listOpenTasks())),
    submitReport: h(async (req, res) => sendSuccess(req, res, await svc.submitReport(uid(req), label(req), parse(v.reportSchema, req.body)), 201)),
    myReports: h(async (req, res) => sendSuccess(req, res, await svc.listMyReports(uid(req)))),

    myThread: h(async (req, res) => sendSuccess(req, res, await svc.getThread(uid(req), { viewerIsAdmin: false, after: req.query.after }))),
    postMyMessage: h(async (req, res) => sendSuccess(req, res,
        await svc.postMessage(uid(req), { id: uid(req), isAdmin: false, label: label(req) }, parse(v.messageSchema, req.body).content), 201)),
    unread: h(async (req, res) => sendSuccess(req, res, { unread: await svc.unreadForHunter(uid(req)) })),

    adminTasks: h(async (req, res) => sendSuccess(req, res, await svc.adminListTasks())),
    adminCreateTask: h(async (req, res) => sendSuccess(req, res, await svc.adminCreateTask(parse(v.createTaskSchema, req.body)), 201)),
    adminUpdateTask: h(async (req, res) => sendSuccess(req, res, await svc.adminUpdateTask(req.params.id, parse(v.updateTaskSchema, req.body)))),
    adminReports: h(async (req, res) => sendSuccess(req, res, await svc.adminListReports({ status: req.query.status, ...page(req) }))),
    adminReviewReport: h(async (req, res) => sendSuccess(req, res, await svc.adminReviewReport(req.params.id, uid(req), parse(v.reviewReportSchema, req.body)))),
    adminThreads: h(async (req, res) => sendSuccess(req, res, await svc.adminListThreads())),
    adminThread: h(async (req, res) => sendSuccess(req, res, await svc.getThread(req.params.id, { viewerIsAdmin: true, after: req.query.after }))),
    adminReply: h(async (req, res) => sendSuccess(req, res,
        await svc.postMessage(req.params.id, { id: uid(req), isAdmin: true }, parse(v.messageSchema, req.body).content), 201)),
};
