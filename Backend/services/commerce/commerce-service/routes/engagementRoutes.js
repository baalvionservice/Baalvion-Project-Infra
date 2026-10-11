'use strict';
const { Router } = require('express');
const svc = require('../service/engagementService');
const { validate } = require('../middleware/validate');
const { requirePlatformAdmin } = require('../middleware/commerceAccess');
const { sendSuccess } = require('../utils/response');
const { AppError } = require('../utils/errors');
const s = require('../validators/engagementSchemas');

const wrap = (fn, status) => async (req, res, next) => {
    try { return sendSuccess(req, res, await fn(req), status); } catch (err) { return next(err); }
};
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const idParam = (req, res, next) => (UUID.test(req.params.id) ? next() : next(new AppError('NOT_FOUND', 'Not found', 404)));
const uid = (req) => req.auth.userId;

// Public reads (mounted beside the storefront routes so the edge needs no change).
const pub = Router({ mergeParams: true });
pub.get('/lottery', wrap(() => svc.listDrawsPublic()));
pub.get('/dj-demands', wrap(() => svc.listDemandsPublic()));

// Signed in.
const me = Router();
me.get('/lottery/mine', wrap((req) => svc.myEntries(uid(req))));
me.post('/lottery/:id/enter', idParam, validate(s.enterSchema), wrap((req) => svc.enter(uid(req), req.params.id, req.validated.count), 201));
me.get('/dj-demands/mine', wrap((req) => svc.myDemandActivity(uid(req))));
me.post('/dj-demands', validate(s.proposeSchema), wrap((req) => svc.propose(uid(req), req.validated), 201));
me.post('/dj-demands/:id/pledge', idParam, validate(s.pledgeSchema), wrap((req) => svc.pledge(uid(req), req.params.id, req.validated.points), 201));
me.post('/dj-demands/:id/withdraw', idParam, wrap((req) => svc.withdraw(uid(req), req.params.id)));

// Admin.
const admin = Router();
admin.use(requirePlatformAdmin);
admin.get('/lottery', wrap(() => svc.adminListDraws()));
admin.post('/lottery', validate(s.drawSchema), wrap((req) => svc.createDraw(uid(req), req.validated), 201));
admin.get('/lottery/:id', idParam, wrap((req) => svc.adminGetDraw(req.params.id)));
admin.put('/lottery/:id', idParam, validate(s.drawSchema), wrap((req) => svc.updateDraw(req.params.id, req.validated)));
admin.post('/lottery/:id/open', idParam, wrap((req) => svc.openDraw(req.params.id)));
admin.post('/lottery/:id/close', idParam, wrap((req) => svc.closeDraw(req.params.id)));
admin.post('/lottery/:id/draw', idParam, wrap((req) => svc.runDraw(req.params.id)));
admin.post('/lottery/:id/cancel', idParam, wrap((req) => svc.cancelDraw(req.params.id)));
admin.post('/lottery/entries/:id/claimed', idParam, wrap((req) => svc.markClaimed(req.params.id)));
admin.get('/dj-demands', wrap((req) => svc.adminListDemands(req.query.status)));
admin.post('/dj-demands/:id/approve', idParam, validate(s.approveSchema), wrap((req) => svc.approveDemand(uid(req), req.params.id, req.validated)));
admin.post('/dj-demands/:id/reject', idParam, validate(s.noteSchema), wrap((req) => svc.rejectDemand(uid(req), req.params.id, req.validated.note)));
admin.post('/dj-demands/:id/confirm', idParam, validate(s.noteSchema), wrap((req) => svc.confirmDemand(uid(req), req.params.id, req.validated.note)));
admin.post('/dj-demands/:id/close', idParam, validate(s.noteSchema), wrap((req) => svc.closeDemand(uid(req), req.params.id, req.validated.note)));

// The admin routes sit under /engagement/admin; /engagement serves the member routes.
me.use('/admin', admin);

module.exports = { publicRouter: pub, memberRouter: me };
