'use strict';
const db = require('../models');
const { AppError } = require('../utils/errors');

const listTeamMembers = async () => {
    return db.TeamMember.findAll({
        where: { is_active: true },
        order: [['order_index', 'ASC'], ['full_name', 'ASC']],
    });
};

const createTeamMember = async (data) => {
    return db.TeamMember.create(data);
};

const getTeamMember = async (id) => {
    const member = await db.TeamMember.findByPk(id);
    if (!member) throw new AppError('NOT_FOUND', 'Team member not found', 404);
    return member;
};

const updateTeamMember = async (id, data) => {
    const member = await db.TeamMember.findByPk(id);
    if (!member) throw new AppError('NOT_FOUND', 'Team member not found', 404);
    await member.update(data);
    return member;
};

const deleteTeamMember = async (id) => {
    const member = await db.TeamMember.findByPk(id);
    if (!member) throw new AppError('NOT_FOUND', 'Team member not found', 404);
    await member.destroy();
};

module.exports = { listTeamMembers, createTeamMember, getTeamMember, updateTeamMember, deleteTeamMember };
