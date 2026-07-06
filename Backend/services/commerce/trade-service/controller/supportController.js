'use strict';
const { Op } = require('sequelize');
const db = require('../models');
const { sendSuccess, sendPaginated } = require('../utils/response');
const { AppError } = require('../utils/errors');

function isAdmin(req) {
    const roles = (req.auth && req.auth.roles) || [];
    return roles.some((r) => r === 'admin' || r === 'super_admin' || r === 'owner');
}

function callerTenantId(req) {
    return (req.auth && (req.auth.tenantId || req.auth.orgId)) || null;
}

function callerUserId(req) {
    return (req.auth && req.auth.userId) || null;
}

function callerRole(req) {
    return (req.auth && req.auth.role) || null;
}

// Support tickets are private per-org data, so every route requires auth and
// ownership is enforced on every fetch, not just writes.
async function fetchTicketOwned(id, req, next, options = {}) {
    const ticket = await db.SupportTicket.findByPk(id, options);
    if (!ticket) { next(new AppError('NOT_FOUND', 'Support ticket not found', 404)); return null; }
    if (isAdmin(req)) return ticket;
    const tenantId = callerTenantId(req);
    if (tenantId && ticket.tenant_id && ticket.tenant_id !== tenantId) {
        next(new AppError('FORBIDDEN', 'You do not have permission to access this ticket', 403)); return null;
    }
    return ticket;
}

const listTickets = async (req, res, next) => {
    try {
        const { status, priority, category, search, page = 1, limit = 20 } = req.query;
        const where = {};
        if (status) where.status = status;
        if (priority) where.priority = priority;
        if (category) where.category = category;
        if (search) where.subject = { [Op.iLike]: `%${search}%` };
        // Defense in depth: scope explicitly from the verified caller identity, on top of
        // the tenant hook + RLS (matches the convention in orderController.listOrders).
        if (!isAdmin(req)) {
            const tenantId = callerTenantId(req);
            if (tenantId) where.tenant_id = tenantId;
        }
        const offset = (Number(page) - 1) * Number(limit);
        const { count, rows } = await db.SupportTicket.findAndCountAll({
            where, limit: Number(limit), offset, order: [['created_at', 'DESC']],
        });
        return sendPaginated(req, res, { items: rows, total: count, page: Number(page), limit: Number(limit) });
    } catch (err) {
        return next(err);
    }
};

const getTicket = async (req, res, next) => {
    try {
        const ticket = await fetchTicketOwned(req.params.id, req, next, {
            include: [{ model: db.SupportTicketMessage, as: 'messages' }],
        });
        if (!ticket) return undefined;
        return sendSuccess(req, res, ticket);
    } catch (err) {
        return next(err);
    }
};

const createTicket = async (req, res, next) => {
    try {
        const { tenant_id: _ignored, created_by_user_id: _ignoredCreator, ...body } = req.body || {};
        const tenantId = callerTenantId(req);
        const ticket = await db.SupportTicket.create({
            ...body,
            ...(tenantId ? { tenant_id: tenantId } : {}),
            created_by_user_id: callerUserId(req),
            created_by_org_id: tenantId,
        });
        return sendSuccess(req, res, ticket, 201);
    } catch (err) {
        return next(err);
    }
};

const addMessage = async (req, res, next) => {
    try {
        const ticket = await fetchTicketOwned(req.params.id, req, next);
        if (!ticket) return undefined;
        const { body } = req.body || {};
        if (!body) return next(new AppError('VALIDATION_ERROR', 'Message body is required', 400));
        const message = await db.SupportTicketMessage.create({
            tenant_id: ticket.tenant_id,
            ticket_id: ticket.id,
            author_user_id: callerUserId(req),
            author_role: callerRole(req),
            body,
        });
        if (ticket.created_by_user_id && ticket.created_by_user_id !== callerUserId(req)) {
            await db.Notification.create({
                tenant_id: ticket.tenant_id,
                recipient_org_id: ticket.created_by_org_id,
                type: 'support_ticket_reply',
                title: 'New reply on your support ticket',
                message: ticket.subject,
                entity_type: 'support_ticket',
                entity_id: ticket.id,
            });
        }
        return sendSuccess(req, res, message, 201);
    } catch (err) {
        return next(err);
    }
};

const updateStatus = async (req, res, next) => {
    try {
        const ticket = await fetchTicketOwned(req.params.id, req, next);
        if (!ticket) return undefined;
        const { status } = req.body || {};
        if (!status) return next(new AppError('VALIDATION_ERROR', 'status is required', 400));
        const updates = { status };
        if (status === 'resolved' || status === 'closed') updates.resolved_at = new Date();
        await ticket.update(updates);
        return sendSuccess(req, res, ticket);
    } catch (err) {
        return next(err);
    }
};

module.exports = { listTickets, getTicket, createTicket, addMessage, updateStatus };
