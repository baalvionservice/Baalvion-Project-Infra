'use strict';
// admin-service :: support (ticketing) module — controller layer.
//
// Mirrors controller/adminController.js: { success, data, requestId } envelope via
// sendSuccess, AppError for typed failures, req.auth.userId as the acting admin, and
// req.ip threaded into the service for audit rows. Errors are forwarded to the shared
// error handler via next(err).
const supportService = require('../service/supportService');
const { sendSuccess } = require('../utils/response');

// Resolve a human-readable agent name for message authorship. The canonical token
// carries no display name, so fall back to email/userId. (Never load-bearing for auth.)
function adminName(req) {
    return (req.auth && (req.auth.email || req.auth.name)) || 'Support Agent';
}

// ── Stats ───────────────────────────────────────────────────────────────────
exports.getStats = async (req, res, next) => {
    try {
        const stats = await supportService.getStats();
        sendSuccess(req, res, stats);
    } catch (err) { next(err); }
};

// ── Tickets ───────────────────────────────────────────────────────────────────
// The console reads r.data.data (the PaginatedResponse) then ticketList = tickets.data.
// So the success payload must itself be a PaginatedResponse { success, data[], pagination }.
exports.listTickets = async (req, res, next) => {
    try {
        const { page = 1, limit = 50, status, priority, category, assigneeId, search } = req.query;
        const p = Math.max(1, parseInt(page, 10) || 1);
        const l = Math.min(200, Math.max(1, parseInt(limit, 10) || 50));

        const result = await supportService.listTickets({
            page:       p,
            limit:      l,
            status:     status     || undefined,
            priority:   priority   || undefined,
            category:   category   || undefined,
            assigneeId: assigneeId || undefined,
            search:     search     || undefined,
        });

        const totalPages = l ? Math.ceil(result.total / l) : 1;
        sendSuccess(req, res, {
            success: true,
            data: result.items,
            pagination: {
                page: p,
                limit: l,
                total: result.total,
                totalPages,
                hasNext: p * l < result.total,
                hasPrev: p > 1,
            },
        });
    } catch (err) { next(err); }
};

exports.getTicket = async (req, res, next) => {
    try {
        const ticket = await supportService.getTicket(req.params.id);
        sendSuccess(req, res, ticket);
    } catch (err) { next(err); }
};

exports.updateTicket = async (req, res, next) => {
    try {
        const { status, priority, assigneeId, assigneeName, tags } = req.body || {};
        const ticket = await supportService.updateTicket(
            req.params.id,
            { status, priority, assigneeId, assigneeName, tags },
            req.auth.userId,
            req.ip,
        );
        sendSuccess(req, res, ticket);
    } catch (err) { next(err); }
};

exports.assignTicket = async (req, res, next) => {
    try {
        const { assigneeId, assigneeName } = req.body || {};
        const ticket = await supportService.assignTicket(
            req.params.id,
            { assigneeId, assigneeName },
            req.auth.userId,
            req.ip,
        );
        sendSuccess(req, res, ticket);
    } catch (err) { next(err); }
};

exports.escalateTicket = async (req, res, next) => {
    try {
        const { reason } = req.body || {};
        const ticket = await supportService.escalateTicket(
            req.params.id, reason, req.auth.userId, adminName(req), req.ip,
        );
        sendSuccess(req, res, ticket);
    } catch (err) { next(err); }
};

exports.closeTicket = async (req, res, next) => {
    try {
        const { resolution } = req.body || {};
        const ticket = await supportService.closeTicket(
            req.params.id, resolution, req.auth.userId, adminName(req), req.ip,
        );
        sendSuccess(req, res, ticket);
    } catch (err) { next(err); }
};

// ── Messages ──────────────────────────────────────────────────────────────────
exports.listMessages = async (req, res, next) => {
    try {
        const messages = await supportService.listMessages(req.params.id);
        sendSuccess(req, res, messages);
    } catch (err) { next(err); }
};

exports.sendMessage = async (req, res, next) => {
    try {
        const { body, isInternal } = req.body || {};
        const message = await supportService.addMessage(
            req.params.id,
            { body, isInternal: isInternal === true },
            req.auth.userId,
            adminName(req),
            req.ip,
        );
        sendSuccess(req, res, message, 201);
    } catch (err) { next(err); }
};

// ── Customer timeline ───────────────────────────────────────────────────────────
exports.getCustomerTimeline = async (req, res, next) => {
    try {
        const timeline = await supportService.getCustomerTimeline(req.params.userId);
        sendSuccess(req, res, timeline);
    } catch (err) { next(err); }
};

// ── Macros ───────────────────────────────────────────────────────────────────
exports.listMacros = async (req, res, next) => {
    try {
        const macros = await supportService.listMacros();
        sendSuccess(req, res, macros);
    } catch (err) { next(err); }
};

exports.createMacro = async (req, res, next) => {
    try {
        const { name, body, category } = req.body || {};
        const macro = await supportService.createMacro({ name, body, category }, req.auth.userId, req.ip);
        sendSuccess(req, res, macro, 201);
    } catch (err) { next(err); }
};

exports.updateMacro = async (req, res, next) => {
    try {
        const { name, body, category } = req.body || {};
        const macro = await supportService.updateMacro(req.params.id, { name, body, category }, req.auth.userId, req.ip);
        sendSuccess(req, res, macro);
    } catch (err) { next(err); }
};

exports.deleteMacro = async (req, res, next) => {
    try {
        const result = await supportService.deleteMacro(req.params.id, req.auth.userId, req.ip);
        sendSuccess(req, res, result);
    } catch (err) { next(err); }
};
