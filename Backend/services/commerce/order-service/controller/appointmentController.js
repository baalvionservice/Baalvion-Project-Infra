'use strict';
const { sendSuccess, sendPaginated } = require('../utils/response');
const appointmentService = require('../service/appointmentService');
const { actorOf } = require('../utils/actor');

// Shopper/guest: book an appointment. Ownership bound in-service (userId or signed guest session).
const book = async (req, res, next) => {
    try { return sendSuccess(req, res, await appointmentService.book(req.params.storeId, req.validated, actorOf(req)), 201); }
    catch (err) { return next(err); }
};

// Customer-facing: the authenticated shopper's own appointments (IDOR-safe — scoped by userId).
const listMine = async (req, res, next) => {
    try { return sendPaginated(req, res, await appointmentService.listMine(req.params.storeId, req.auth && req.auth.userId, req.query)); }
    catch (err) { return next(err); }
};

// Admin: list all appointments in the store (filterable by status).
const list = async (req, res, next) => {
    try { return sendPaginated(req, res, await appointmentService.list(req.params.storeId, req.query)); }
    catch (err) { return next(err); }
};

// Admin/ops: advance an appointment along the forward-only status machine.
const updateStatus = async (req, res, next) => {
    try { return sendSuccess(req, res, await appointmentService.updateStatus(req.params.storeId, req.params.id, req.validated.status, req.auth.userId)); }
    catch (err) { return next(err); }
};

module.exports = { book, listMine, list, updateStatus };
