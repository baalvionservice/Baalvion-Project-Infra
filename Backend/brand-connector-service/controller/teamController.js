'use strict';
const db = require('../models');
const { AppError } = require('../utils/errors');
const { sendSuccess, sendPaginated } = require('../utils/response');

const paginate = (page = 1, limit = 20) => ({
    limit: Math.min(Number(limit), 100),
    offset: (Math.max(Number(page), 1) - 1) * Math.min(Number(limit), 100),
});

const PERMISSIONS = {
    admin: {
        leads: ['read', 'write', 'delete'],
        deals: ['read', 'write', 'delete'],
        proposals: ['read', 'write', 'delete'],
        payments: ['read', 'write', 'delete'],
        campaigns: ['read', 'write', 'delete'],
        outreach: ['read', 'write', 'delete'],
        team: ['read', 'write', 'delete'],
        billing: ['read', 'write'],
        analytics: ['read'],
        admin: ['read', 'write'],
    },
    manager: {
        leads: ['read', 'write'],
        deals: ['read', 'write'],
        proposals: ['read', 'write'],
        payments: ['read'],
        campaigns: ['read', 'write'],
        outreach: ['read', 'write'],
        team: ['read'],
        billing: ['read'],
        analytics: ['read'],
        admin: [],
    },
    viewer: {
        leads: ['read'],
        deals: ['read'],
        proposals: ['read'],
        payments: [],
        campaigns: ['read'],
        outreach: ['read'],
        team: ['read'],
        billing: [],
        analytics: ['read'],
        admin: [],
    },
};

exports.listTeam = async (req, res, next) => {
    try {
        const { page = 1, limit = 20 } = req.query;
        const p = paginate(page, limit);
        const { rows, count } = await db.TeamMember.findAndCountAll({
            where: { org_id: req.user.orgId },
            ...p,
            order: [['created_at', 'DESC']],
        });
        return sendPaginated(req, res, {
            data: rows, total: count, page: Number(page), limit: p.limit,
            totalPages: Math.ceil(count / p.limit),
        });
    } catch (err) { return next(err); }
};

exports.inviteMember = async (req, res, next) => {
    try {
        const { email, role } = req.body;
        if (!email) return next(new AppError('VALIDATION', 'email is required', 400));
        const validRoles = ['admin', 'manager', 'viewer'];
        const memberRole = validRoles.includes(role) ? role : 'viewer';
        const existing = await db.TeamMember.findOne({ where: { org_id: req.user.orgId, email } });
        if (existing) return next(new AppError('CONFLICT', 'Member already invited', 409));
        const member = await db.TeamMember.create({
            org_id: req.user.orgId,
            email,
            role: memberRole,
            status: 'invited',
        });
        return sendSuccess(req, res, member, 201);
    } catch (err) { return next(err); }
};

exports.changeRole = async (req, res, next) => {
    try {
        const member = await db.TeamMember.findOne({ where: { id: req.params.id, org_id: req.user.orgId } });
        if (!member) return next(new AppError('NOT_FOUND', 'Team member not found', 404));
        const validRoles = ['admin', 'manager', 'viewer'];
        const { role } = req.body;
        if (!validRoles.includes(role)) return next(new AppError('VALIDATION', `role must be one of: ${validRoles.join(', ')}`, 400));
        await member.update({ role });
        return sendSuccess(req, res, member);
    } catch (err) { return next(err); }
};

exports.removeMember = async (req, res, next) => {
    try {
        const member = await db.TeamMember.findOne({ where: { id: req.params.id, org_id: req.user.orgId } });
        if (!member) return next(new AppError('NOT_FOUND', 'Team member not found', 404));
        await member.destroy();
        return sendSuccess(req, res, { message: 'Member removed successfully' });
    } catch (err) { return next(err); }
};

exports.getPermissions = async (req, res, next) => {
    try {
        return sendSuccess(req, res, PERMISSIONS);
    } catch (err) { return next(err); }
};
