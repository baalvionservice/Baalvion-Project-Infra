'use strict';
const { sendSuccess, sendPaginated } = require('../utils/response');
const svc = require('../service/sellerBondService');

const authCtxOf = (req) => ({ userId: req.auth.userId });
const wrap = (fn, status) => async (req, res, next) => {
    try { return sendSuccess(req, res, await fn(req), status); } catch (err) { return next(err); }
};

exports.create = wrap((req) => svc.createBond(authCtxOf(req), req.validated), 201);
exports.mine = wrap((req) => svc.listMine(req.auth.userId));
exports.submitPayment = wrap((req) => svc.submitPayment(authCtxOf(req), req.params.id, req.validated.txHash));
exports.list = async (req, res, next) => {
    try { return sendPaginated(req, res, await svc.listAll(req.query)); } catch (err) { return next(err); }
};
exports.confirm = wrap((req) => svc.confirmPayment(authCtxOf(req), req.params.id, req.validated));
exports.reject = wrap((req) => svc.rejectPayment(authCtxOf(req), req.params.id, req.validated));
exports.forfeit = wrap((req) => svc.forfeitBond(authCtxOf(req), req.params.id, req.validated));
