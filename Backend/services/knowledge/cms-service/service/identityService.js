'use strict';
/**
 * Read-only identity lookups for CMS membership.
 *
 * cms-service stores website members by numeric userId only. To invite people by
 * email and to render member lists with names/avatars, we resolve users from the
 * shared platform identity store (auth.users) over the same database connection.
 * This is a read-only cross-schema lookup — cms-service never writes auth data.
 */
const { sequelize, Sequelize } = require('../models');

const { QueryTypes } = Sequelize;

const USER_COLS = `id, email, full_name AS "fullName", avatar_url AS "avatarUrl", status`;

/** Resolve a single active-or-inactive user by exact email (case-insensitive). */
async function findByEmail(email) {
    if (!email) return null;
    const rows = await sequelize.query(
        `SELECT ${USER_COLS} FROM auth.users WHERE lower(email) = lower(:email) LIMIT 1`,
        { replacements: { email }, type: QueryTypes.SELECT },
    );
    return rows[0] || null;
}

/** Batch-resolve users by id; returns a Map keyed by String(id) for enrichment. */
async function mapByIds(ids) {
    const unique = [...new Set((ids || []).map((v) => String(v)).filter(Boolean))];
    if (unique.length === 0) return new Map();
    const rows = await sequelize.query(
        `SELECT ${USER_COLS} FROM auth.users WHERE id IN (:ids)`,
        { replacements: { ids: unique }, type: QueryTypes.SELECT },
    );
    return new Map(rows.map((u) => [String(u.id), u]));
}

/** Typeahead search over active users by name or email (capped). */
async function search(q, limit = 10) {
    if (!q || q.trim().length < 2) return [];
    const rows = await sequelize.query(
        `SELECT ${USER_COLS} FROM auth.users
         WHERE status = 'active' AND (email ILIKE :q OR full_name ILIKE :q)
         ORDER BY full_name NULLS LAST
         LIMIT :limit`,
        { replacements: { q: `%${q.trim()}%`, limit: Math.min(Number(limit) || 10, 25) }, type: QueryTypes.SELECT },
    );
    return rows;
}

module.exports = { findByEmail, mapByIds, search };
