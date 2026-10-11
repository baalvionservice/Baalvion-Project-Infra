'use strict';
const svc = require('../service/kycService');
const v = require('../validators/kyc');
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
const label = (req) => { const e = decodeEmailFromRequest(req); return e ? e.slice(0, 120) : null; };

module.exports = {
    mine: h(async (req, res) => sendSuccess(req, res, await svc.getMine(uid(req)))),
    submit: h(async (req, res) => sendSuccess(req, res, await svc.submit(uid(req), label(req), parse(v.submitSchema, req.body)), 201)),

    adminList: h(async (req, res) => sendSuccess(req, res, await svc.adminList({ status: req.query.status, limit: req.query.limit, offset: req.query.offset }))),
    adminDecide: h(async (req, res) => sendSuccess(req, res, await svc.adminDecide(uid(req), req.params.id, parse(v.decisionSchema, req.body)))),
    // Documents are binary and sensitive: never cached, never sniffed, never framed.
    adminDocument: async (req, res, next) => {
        try {
            if (!['id', 'selfie'].includes(req.params.kind)) throw new AppError('NOT_FOUND', 'Not found', 404);
            const doc = await svc.adminDocument(uid(req), req.params.id, req.params.kind);
            res.set({ 'Content-Type': doc.mime, 'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff', 'Content-Disposition': 'inline', 'Content-Security-Policy': "default-src 'none'; sandbox" });
            return res.send(doc.bytes);
        } catch (err) { return next(err); }
    },

    internalStatus: h(async (req, res) => {
        if (!/^[A-Za-z0-9_-]{1,64}$/.test(req.params.userId)) throw new AppError('NOT_FOUND', 'Not found', 404);
        return sendSuccess(req, res, await svc.statusForUser(req.params.userId));
    }),
};
