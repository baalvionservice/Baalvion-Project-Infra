'use strict';
const { v4: uuidv4 } = require('uuid');
const db = require('../models');

class OrgRepository {
    async findById(id) {
        return db.Organization.findByPk(id);
    }

    async findBySlug(slug) {
        return db.Organization.findOne({ where: { slug } });
    }

    /**
     * Generates a url-safe slug from `name`, appends a 6-char UUID suffix to
     * guarantee uniqueness even when two orgs pick the same name.
     */
    async create({ name, ownerId }) {
        const base       = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 54);
        const slug       = `${base || 'org'}-${uuidv4().slice(0, 6)}`;
        return db.Organization.create({ name, slug, owner_id: ownerId });
    }

    // ── Memberships ────────────────────────────────────────────────────────────

    async getMember(orgId, userId) {
        return db.TeamMember.findOne({ where: { org_id: orgId, user_id: userId } });
    }

    async getActiveMember(orgId, userId) {
        return db.TeamMember.findOne({ where: { org_id: orgId, user_id: userId, status: 'active' } });
    }

    /** Returns all active memberships for a user, with org details. */
    async listMemberships(userId) {
        return db.TeamMember.findAll({
            where:   { user_id: userId, status: 'active' },
            include: [{ model: db.Organization, as: 'organization' }],
            order:   [['joined_at', 'ASC']],
        });
    }

    /** Returns first active membership — used to derive default org on login. */
    async getPrimaryMembership(userId) {
        return db.TeamMember.findOne({
            where:   { user_id: userId, status: 'active' },
            include: [{ model: db.Organization, as: 'organization' }],
            order:   [['joined_at', 'ASC']],
        });
    }

    async addMember({ orgId, userId, role, invitedBy = null }) {
        const existing = await this.getMember(orgId, userId);
        if (existing) {
            await existing.update({ status: 'active', role, joined_at: new Date() });
            return existing;
        }
        return db.TeamMember.create({
            org_id:     orgId,
            user_id:    userId,
            role,
            invited_by: invitedBy,
            joined_at:  new Date(),
            status:     'active',
        });
    }

    async updateMemberRole(orgId, userId, { role, serviceRoles }) {
        const fields = {};
        if (role         !== undefined) fields.role          = role;
        if (serviceRoles !== undefined) fields.service_roles = serviceRoles;
        return db.TeamMember.update(fields, { where: { org_id: orgId, user_id: userId, status: 'active' } });
    }

    async removeMember(orgId, userId) {
        return db.TeamMember.update({ status: 'removed' }, { where: { org_id: orgId, user_id: userId } });
    }

    /** Returns active member list with user details joined. */
    async listMembers(orgId) {
        return db.TeamMember.findAll({
            where:   { org_id: orgId, status: 'active' },
            include: [{ model: db.User, as: 'user', attributes: ['id', 'email', 'full_name', 'avatar_url'] }],
            order:   [['joined_at', 'ASC']],
        });
    }
}

module.exports = new OrgRepository();
