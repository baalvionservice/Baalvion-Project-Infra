'use strict';
const teamService = require('../service/teamService');
const { sendSuccess } = require('../utils/response');
const { AppError } = require('../utils/errors');
const { createTeamMemberSchema, updateTeamMemberSchema } = require('../validators/schemas');

const listTeamMembers = async (req, res, next) => {
    try {
        const data = await teamService.listTeamMembers();
        return sendSuccess(req, res, data);
    } catch (err) { return next(err); }
};

const createTeamMember = async (req, res, next) => {
    try {
        const parsed = createTeamMemberSchema.safeParse(req.body);
        if (!parsed.success) return next(new AppError('VALIDATION_ERROR', 'Validation failed', 400, parsed.error.flatten()));
        const data = await teamService.createTeamMember(parsed.data);
        return sendSuccess(req, res, data, 201);
    } catch (err) { return next(err); }
};

const getTeamMember = async (req, res, next) => {
    try {
        const data = await teamService.getTeamMember(req.params.id);
        return sendSuccess(req, res, data);
    } catch (err) { return next(err); }
};

const updateTeamMember = async (req, res, next) => {
    try {
        const parsed = updateTeamMemberSchema.safeParse(req.body);
        if (!parsed.success) return next(new AppError('VALIDATION_ERROR', 'Validation failed', 400, parsed.error.flatten()));
        const data = await teamService.updateTeamMember(req.params.id, parsed.data);
        return sendSuccess(req, res, data);
    } catch (err) { return next(err); }
};

const deleteTeamMember = async (req, res, next) => {
    try {
        await teamService.deleteTeamMember(req.params.id);
        return sendSuccess(req, res, { deleted: true });
    } catch (err) { return next(err); }
};

module.exports = { listTeamMembers, createTeamMember, getTeamMember, updateTeamMember, deleteTeamMember };
