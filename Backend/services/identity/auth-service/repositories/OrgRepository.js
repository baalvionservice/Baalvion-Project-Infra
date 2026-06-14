'use strict';
const { v4: uuidv4 } = require('uuid');
const { Op } = require('sequelize');
const db = require('../models');

function slugify(name) {
    return name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 54);
}

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
    async create({ name, ownerId, type = 'buyer' }) {
        const slug = `${slugify(name) || 'org'}-${uuidv4().slice(0, 6)}`;
        return db.Organization.create({ name, slug, type, owner_id: ownerId });
    }

    // ── Platform-owner org administration ────────────────────────────────────────

    /**
     * Creates an org from the platform console with a full profile + chosen type.
     * `ownerId` is optional — platform-created orgs commonly precede their first human
     * owner (who is then invited). If `slug` is supplied it is honoured (deduped on
     * collision); otherwise one is derived from the name.
     */
    async createWithProfile({ name, slug, type, ownerId = null, legalName, displayName, country, jurisdiction, contactEmail, contactPhone, status = 'active' }) {
        let finalSlug = (slug && slugify(slug)) || slugify(name) || 'org';
        if (await this.findBySlug(finalSlug)) finalSlug = `${finalSlug}-${uuidv4().slice(0, 6)}`;
        return db.Organization.create({
            name,
            slug: finalSlug,
            type,
            owner_id: ownerId,
            legal_name: legalName ?? null,
            display_name: displayName ?? null,
            country: country ?? null,
            jurisdiction: jurisdiction ?? null,
            contact_email: contactEmail ?? null,
            contact_phone: contactPhone ?? null,
            status,
        });
    }

    /** Paginated org registry with optional text search + type/status filters. */
    async listPaginated({ search, type, status, page = 1, limit = 25 }) {
        const where = {};
        if (type) where.type = type;
        if (status) where.status = status;
        if (search) {
            const q = `%${search.trim()}%`;
            where[Op.or] = [
                { name: { [Op.iLike]: q } },
                { slug: { [Op.iLike]: q } },
                { legal_name: { [Op.iLike]: q } },
                { display_name: { [Op.iLike]: q } },
            ];
        }
        const offset = (page - 1) * limit;
        const { count, rows } = await db.Organization.findAndCountAll({
            where, order: [['created_at', 'DESC']], limit, offset,
        });
        return { total: count, page, limit, rows };
    }

    async updateProfile(orgId, fields) {
        const allowed = {};
        const map = {
            name: 'name', legalName: 'legal_name', displayName: 'display_name',
            country: 'country', jurisdiction: 'jurisdiction',
            contactEmail: 'contact_email', contactPhone: 'contact_phone', plan: 'plan',
        };
        for (const [k, col] of Object.entries(map)) {
            if (fields[k] !== undefined) allowed[col] = fields[k];
        }
        if (Object.keys(allowed).length === 0) return this.findById(orgId);
        await db.Organization.update(allowed, { where: { id: orgId } });
        return this.findById(orgId);
    }

    async setStatus(orgId, status) {
        await db.Organization.update({ status }, { where: { id: orgId } });
        return this.findById(orgId);
    }

    async setOwner(orgId, ownerId) {
        await db.Organization.update({ owner_id: ownerId }, { where: { id: orgId } });
    }

    /** Active member count for an org (for the registry list). */
    async countActiveMembers(orgId) {
        return db.TeamMember.count({ where: { org_id: orgId, status: 'active' } });
    }

    /** Aggregate counts by type and by status across all orgs (platform metrics). */
    async aggregateCounts() {
        const [byType, byStatus, total] = await Promise.all([
            db.Organization.findAll({ attributes: ['type', [db.sequelize.fn('COUNT', db.sequelize.col('id')), 'count']], group: ['type'], raw: true }),
            db.Organization.findAll({ attributes: ['status', [db.sequelize.fn('COUNT', db.sequelize.col('id')), 'count']], group: ['status'], raw: true }),
            db.Organization.count(),
        ]);
        return { byType, byStatus, total };
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

    /**
     * Returns the user's membership in a platform_owner-type org IF they hold an
     * owner/admin role there — i.e. they are a platform authority who may onboard and
     * administer other organizations. Null otherwise.
     */
    async findPlatformAuthority(userId) {
        // 'super_admin' is the legacy top-tier role on the seeded platform org and counts
        // as full platform authority alongside the modern owner/admin tiers.
        return db.TeamMember.findOne({
            where: { user_id: userId, status: 'active', role: { [Op.in]: ['owner', 'admin', 'super_admin'] } },
            include: [{ model: db.Organization, as: 'organization', where: { type: 'platform_owner' }, required: true }],
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

    async suspendMember(orgId, userId, suspendedBy) {
        return db.TeamMember.update(
            { status: 'suspended', suspended_at: new Date(), suspended_by: suspendedBy },
            { where: { org_id: orgId, user_id: userId } },
        );
    }

    async reactivateMember(orgId, userId) {
        return db.TeamMember.update(
            { status: 'active', suspended_at: null, suspended_by: null },
            { where: { org_id: orgId, user_id: userId } },
        );
    }

    /**
     * Returns the member list with user details joined. By default only active members;
     * pass { includeInactive: true } to include suspended members (admin user-management view).
     */
    async listMembers(orgId, { includeInactive = false } = {}) {
        const where = { org_id: orgId };
        if (!includeInactive) where.status = 'active';
        else where.status = { [Op.in]: ['active', 'suspended'] };
        return db.TeamMember.findAll({
            where,
            include: [{ model: db.User, as: 'user', attributes: ['id', 'email', 'full_name', 'avatar_url', 'status', 'mfa_enabled', 'mfa_required', 'last_login_at'] }],
            order:   [['joined_at', 'ASC']],
        });
    }
}

module.exports = new OrgRepository();
