'use strict';
const svc = require('../service/eduService');
const v = require('../validators/edu');
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
const ok = (fn, status) => h(async (req, res) => sendSuccess(req, res, await fn(req), status));

module.exports = {
    listTeachers: ok((req) => svc.listTeachers({ subject: req.query.subject, regionId: req.query.regionId, country: req.query.country, q: req.query.q, ...page(req) })),
    getTeacher: ok((req) => svc.getTeacher(req.params.id)),
    upcomingSessions: ok((req) => svc.listUpcomingSessions({ liveOnly: req.query.live === 'true' })),

    myTeacher: ok((req) => svc.getMyTeacher(uid(req))),
    saveMyTeacher: ok((req) => svc.saveMyTeacher(uid(req), parse(v.teacherSchema, req.body))),
    createSession: ok((req) => svc.createSession(uid(req), parse(v.sessionSchema, req.body)), 201),
    mySessions: ok((req) => svc.listMySessions(uid(req))),
    updateSession: ok((req) => svc.updateMySession(uid(req), req.params.id, parse(v.sessionUpdateSchema, req.body))),
    sessionEnrollments: ok((req) => svc.listSessionEnrollments(uid(req), req.params.id)),
    decideEnrollment: ok((req) => svc.decideEnrollment(uid(req), req.params.id, parse(v.enrollmentDecisionSchema, req.body).status)),

    enroll: ok((req) => svc.enroll(uid(req), label(req), req.params.id, parse(v.enrollSchema, req.body).note), 201),
    myEnrollments: ok((req) => svc.listMyEnrollments(uid(req))),
    cancelEnrollment: ok((req) => svc.cancelEnrollment(uid(req), req.params.id)),
    reviewTeacher: ok((req) => svc.reviewTeacher(uid(req), label(req), req.params.id, parse(v.reviewSchema, req.body)), 201),

    adminTeachers: ok((req) => svc.adminListTeachers({ status: req.query.status, ...page(req) })),
    adminReviewTeacher: ok((req) => svc.adminReviewTeacher(req.params.id, uid(req), parse(v.reviewTeacherSchema, req.body))),
    adminSessions: ok((req) => svc.adminListSessions(page(req))),
    adminCancelSession: ok((req) => svc.adminCancelSession(req.params.id)),
};
