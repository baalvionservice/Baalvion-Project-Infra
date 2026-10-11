'use strict';
const { Router } = require('express');
const svc = require('../service/intermediaryService');
const trades = require('../service/intermediaryTradeService');
const { validate } = require('../middleware/validate');
const { requirePlatformAdmin } = require('../middleware/commerceAccess');
const { sendSuccess } = require('../utils/response');
const { AppError } = require('../utils/errors');
const s = require('../validators/intermediarySchemas');

const wrap = (fn, status) => async (req, res, next) => {
    try { return sendSuccess(req, res, await fn(req), status); } catch (err) { return next(err); }
};
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const idParam = (req, res, next) => (UUID.test(req.params.id) ? next() : next(new AppError('NOT_FOUND', 'Not found', 404)));
const ctx = (req) => ({ userId: req.auth.userId });

// ── Public (no login): the directory and each intermediary's QR images ──
const pub = Router();
pub.get('/', wrap(() => svc.listPublic()));
pub.get('/:key', wrap((req) => svc.getPublic(req.params.key)));
pub.get('/:id/qr/:qrId', idParam, async (req, res, next) => {
    try {
        if (!UUID.test(req.params.qrId)) throw new AppError('NOT_FOUND', 'Not found', 404);
        const img = await svc.qrImage(req.params.id, req.params.qrId);
        res.set('Content-Type', img.mime);
        res.set('Cache-Control', 'public, max-age=300');
        res.set('X-Content-Type-Options', 'nosniff');
        return res.send(img.data);
    } catch (err) { return next(err); }
});

// ── Signed in: apply, see my application, and the admin review list ──
const me = Router();
me.get('/mine', wrap((req) => svc.mine(req.auth.userId)));
me.post('/apply', validate(s.applySchema), wrap((req) => svc.apply(ctx(req), req.validated), 201));
me.get('/admin', requirePlatformAdmin, wrap((req) => svc.adminList(req.query.status)));
me.get('/admin/:id', requirePlatformAdmin, idParam, wrap((req) => svc.adminGet(req.params.id)));

// ── Trades ──
const tr = Router();
tr.get('/', wrap((req) => trades.list(ctx(req))));
tr.post('/', validate(s.createTradeSchema), wrap((req) => trades.create(ctx(req), req.validated), 201));
tr.get('/admin', requirePlatformAdmin, wrap((req) => trades.adminList(req.query.status)));
tr.get('/admin/:id', requirePlatformAdmin, idParam, wrap((req) => trades.adminGet(req.params.id)));
tr.get('/admin/:id/proofs', requirePlatformAdmin, idParam, wrap((req) => trades.proofImages(ctx(req), req.params.id, true)));
tr.post('/admin/:id/resolve', requirePlatformAdmin, idParam, validate(s.resolveSchema), wrap((req) => trades.resolve(ctx(req), req.params.id, req.validated)));
tr.get('/:id', idParam, wrap((req) => trades.get(ctx(req), req.params.id)));
tr.get('/:id/proofs', idParam, wrap((req) => trades.proofImages(ctx(req), req.params.id, false)));
tr.post('/:id/messages', idParam, validate(s.messageSchema), wrap((req) => trades.message(ctx(req), req.params.id, req.validated.body), 201));
tr.post('/:id/proofs', idParam, validate(s.proofsSchema), wrap((req) => trades.addProofs(ctx(req), req.params.id, req.validated.proofs), 201));
tr.post('/:id/paid', idParam, validate(s.paidSchema), wrap((req) => trades.markPaid(ctx(req), req.params.id, req.validated)));
tr.post('/:id/confirm-payment', idParam, wrap((req) => trades.confirmPayment(ctx(req), req.params.id)));
tr.post('/:id/complete', idParam, wrap((req) => trades.complete(ctx(req), req.params.id)));
tr.post('/:id/cancel', idParam, wrap((req) => trades.cancel(ctx(req), req.params.id)));
tr.post('/:id/dispute', idParam, validate(s.disputeSchema), wrap((req) => trades.dispute(ctx(req), req.params.id, req.validated.reason)));

module.exports = { publicRouter: pub, intermediaryRouter: me, tradeRouter: tr };
