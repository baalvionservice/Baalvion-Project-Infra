'use strict';
const db = require('../models');
const { AppError } = require('../utils/errors');
const { sendSuccess, sendPaginated } = require('../utils/response');
const { Op, fn, col } = require('sequelize');

const paginate = (page = 1, limit = 20) => ({
    limit: Math.min(Number(limit), 100),
    offset: (Math.max(Number(page), 1) - 1) * Math.min(Number(limit), 100),
});

function requireAdmin(req, next) {
    if (req.user.role !== 'admin') {
        next(new AppError('FORBIDDEN', 'Admin access required', 403));
        return false;
    }
    return true;
}

exports.getStats = async (req, res, next) => {
    try {
        if (!requireAdmin(req, next)) return;
        const [
            totalLeads, totalDeals, totalProposals, totalPayments,
            totalCampaigns, totalTeamMembers, totalSubscriptions,
        ] = await Promise.all([
            db.Lead.count(),
            db.Deal.count(),
            db.Proposal.count(),
            db.Payment.count(),
            db.Campaign.count(),
            db.TeamMember.count(),
            db.Subscription.count({ where: { status: 'active' } }),
        ]);
        const revenueResult = await db.Payment.findOne({
            where: { status: { [Op.in]: ['paid', 'escrow', 'released'] } },
            attributes: [[fn('SUM', col('amount')), 'total']],
        });
        const totalRevenue = Number((revenueResult && revenueResult.getDataValue('total')) || 0);
        return sendSuccess(req, res, {
            leads: totalLeads,
            deals: totalDeals,
            proposals: totalProposals,
            payments: totalPayments,
            campaigns: totalCampaigns,
            team_members: totalTeamMembers,
            active_subscriptions: totalSubscriptions,
            total_revenue: totalRevenue,
        });
    } catch (err) { return next(err); }
};

exports.listUsers = async (req, res, next) => {
    try {
        if (!requireAdmin(req, next)) return;
        const { page = 1, limit = 20, search } = req.query;
        const p = paginate(page, limit);
        const where = {};
        if (search) {
            where[Op.or] = [
                { email: { [Op.iLike]: `%${search}%` } },
                { name: { [Op.iLike]: `%${search}%` } },
            ];
        }
        const { rows, count } = await db.TeamMember.findAndCountAll({
            where, ...p, order: [['created_at', 'DESC']],
        });
        return sendPaginated(req, res, {
            data: rows, total: count, page: Number(page), limit: p.limit,
            totalPages: Math.ceil(count / p.limit),
        });
    } catch (err) { return next(err); }
};

exports.updateUser = async (req, res, next) => {
    try {
        if (!requireAdmin(req, next)) return;
        const member = await db.TeamMember.findByPk(req.params.id);
        if (!member) return next(new AppError('NOT_FOUND', 'User not found', 404));
        const allowed = ['name', 'email', 'role', 'status'];
        const updates = {};
        for (const k of allowed) if (req.body[k] !== undefined) updates[k] = req.body[k];
        await member.update(updates);
        return sendSuccess(req, res, member);
    } catch (err) { return next(err); }
};

exports.deleteUser = async (req, res, next) => {
    try {
        if (!requireAdmin(req, next)) return;
        const member = await db.TeamMember.findByPk(req.params.id);
        if (!member) return next(new AppError('NOT_FOUND', 'User not found', 404));
        await member.destroy();
        return sendSuccess(req, res, { message: 'User deleted' });
    } catch (err) { return next(err); }
};

exports.listAllPayments = async (req, res, next) => {
    try {
        if (!requireAdmin(req, next)) return;
        const { status, page = 1, limit = 20 } = req.query;
        const where = {};
        if (status) where.status = status;
        const p = paginate(page, limit);
        const { rows, count } = await db.Payment.findAndCountAll({
            where, ...p, order: [['created_at', 'DESC']],
        });
        return sendPaginated(req, res, {
            data: rows, total: count, page: Number(page), limit: p.limit,
            totalPages: Math.ceil(count / p.limit),
        });
    } catch (err) { return next(err); }
};

exports.listAllCampaigns = async (req, res, next) => {
    try {
        if (!requireAdmin(req, next)) return;
        const { status, page = 1, limit = 20 } = req.query;
        const where = {};
        if (status) where.status = status;
        const p = paginate(page, limit);
        const { rows, count } = await db.Campaign.findAndCountAll({
            where, ...p, order: [['created_at', 'DESC']],
        });
        return sendPaginated(req, res, {
            data: rows, total: count, page: Number(page), limit: p.limit,
            totalPages: Math.ceil(count / p.limit),
        });
    } catch (err) { return next(err); }
};

exports.listLogs = async (req, res, next) => {
    try {
        if (!requireAdmin(req, next)) return;
        const { event, page = 1, limit = 20 } = req.query;
        const where = {};
        if (event) where.event = { [Op.iLike]: `%${event}%` };
        const p = paginate(page, limit);
        const { rows, count } = await db.SystemLog.findAndCountAll({
            where, ...p, order: [['created_at', 'DESC']],
        });
        return sendPaginated(req, res, {
            data: rows, total: count, page: Number(page), limit: p.limit,
            totalPages: Math.ceil(count / p.limit),
        });
    } catch (err) { return next(err); }
};
