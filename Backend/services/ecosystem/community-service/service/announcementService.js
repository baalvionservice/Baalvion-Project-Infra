'use strict';
const { Op } = require('sequelize');
const db = require('../models');
const { AppError } = require('../utils/errors');

const toAnn = (a) => ({
    id: a.id, title: a.title, body: a.body, severity: a.severity, linkUrl: a.link_url,
    startsAt: a.starts_at, endsAt: a.ends_at, status: a.status, createdAt: a.createdAt,
});

async function active() {
    const now = new Date();
    const rows = await db.Announcement.findAll({
        where: { status: 'published', starts_at: { [Op.lte]: now }, [Op.or]: [{ ends_at: null }, { ends_at: { [Op.gt]: now } }] },
        order: [['starts_at', 'DESC']], limit: 5,
    });
    // Public payload: only what the banner shows.
    return rows.map((a) => ({ id: a.id, title: a.title, body: a.body, severity: a.severity, linkUrl: a.link_url }));
}

const adminList = async () => (await db.Announcement.findAll({ order: [['createdAt', 'DESC']], limit: 100 })).map(toAnn);

const cols = (d) => ({ title: d.title, body: d.body, severity: d.severity, link_url: d.linkUrl, starts_at: d.startsAt, ends_at: d.endsAt, status: d.status });
const defined = (o) => Object.fromEntries(Object.entries(o).filter(([, v]) => v !== undefined));

async function create(adminId, d) {
    if (d.endsAt && d.startsAt && new Date(d.endsAt) <= new Date(d.startsAt)) throw new AppError('VALIDATION_ERROR', 'endsAt: must be after the start time', 422);
    return toAnn(await db.Announcement.create({ ...defined(cols(d)), created_by: adminId }));
}

async function update(id, d) {
    const a = await db.Announcement.findByPk(id);
    if (!a) throw new AppError('NOT_FOUND', 'Announcement not found', 404);
    const start = d.startsAt || a.starts_at;
    const end = d.endsAt === undefined ? a.ends_at : d.endsAt;
    if (end && new Date(end) <= new Date(start)) throw new AppError('VALIDATION_ERROR', 'endsAt: must be after the start time', 422);
    await a.update(defined(cols(d)));
    return toAnn(a);
}

module.exports = { active, adminList, create, update };
