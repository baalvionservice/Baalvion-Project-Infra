'use strict';
const { Op } = require('sequelize');
const db = require('../models');
const { AppError } = require('../utils/errors');

const toStaff = (r) => ({ userId: r.user_id, tier: r.tier, label: r.label, grantedBy: r.granted_by, grantedAt: r.createdAt });

const list = async () => (await db.StaffMember.findAll({ order: [['createdAt', 'DESC']], limit: 200 })).map(toStaff);

async function grant(grantedBy, userId, { tier, label }) {
    const [row] = await db.StaffMember.upsert({ user_id: userId, tier, label, granted_by: grantedBy }, { returning: true });
    return toStaff(row);
}

async function revoke(userId) {
    const n = await db.StaffMember.destroy({ where: { user_id: userId } });
    if (!n) throw new AppError('NOT_FOUND', 'That person has no granted staff access', 404);
    return { removed: true };
}

async function auditList({ severity, actor, q, before, limit }) {
    const where = {};
    if (severity) where.severity = severity;
    if (actor) where.actor_id = actor;
    if (before) { const d = new Date(before); if (!Number.isNaN(d.getTime())) where.created_at = { [Op.lt]: d }; }
    if (q) {
        const like = `%${String(q).replace(/[\\%_]/g, (m) => `\\${m}`)}%`;
        where[Op.or] = [{ summary: { [Op.iLike]: like } }, { actor_label: { [Op.iLike]: like } }, { action: { [Op.iLike]: like } }];
    }
    const since = new Date(Date.now() - 24 * 3600000);
    const [rows, counts] = await Promise.all([
        db.AuditEvent.findAll({ where, order: [['created_at', 'DESC']], limit: Math.min(Number(limit) || 100, 200) }),
        db.AuditEvent.findAll({ attributes: ['severity', [db.sequelize.fn('COUNT', db.sequelize.col('id')), 'n']], where: { created_at: { [Op.gte]: since } }, group: ['severity'], raw: true }),
    ]);
    return {
        items: rows.map((r) => ({
            id: r.id, actorId: r.actor_id, actor: r.actor_label, tier: r.actor_tier, action: r.action, summary: r.summary,
            targetId: r.target_id, severity: r.severity, ip: r.ip, status: r.status_code, at: r.createdAt,
        })),
        last24h: Object.fromEntries(counts.map((c) => [c.severity, Number(c.n)])),
    };
}

module.exports = { list, grant, revoke, auditList };
