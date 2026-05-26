'use strict';
const db = require('../models');
const { AppError } = require('../utils/errors');

const listDashboards = async (orgId, userId, { page, limit }) => {
    const offset = (page - 1) * limit;
    const { count, rows } = await db.Dashboard.findAndCountAll({
        where: { org_id: orgId },
        order: [['is_default', 'DESC'], ['created_at', 'DESC']],
        limit,
        offset,
    });
    return { items: rows, total: count, page, limit, totalPages: Math.ceil(count / limit) };
};

const createDashboard = async (orgId, userId, data) => {
    if (data.is_default) {
        await db.Dashboard.update({ is_default: false }, { where: { org_id: orgId } });
    }
    return db.Dashboard.create({ ...data, org_id: orgId, created_by: userId });
};

const getDashboard = async (id, orgId) => {
    const dashboard = await db.Dashboard.findOne({
        where: { id, org_id: orgId },
        include: [{ model: db.Widget, as: 'widgets', include: [{ model: db.DataSource, as: 'data_source', attributes: ['id', 'name', 'source_type'] }] }],
    });
    if (!dashboard) throw new AppError('NOT_FOUND', 'Dashboard not found', 404);
    await dashboard.update({ last_viewed_at: new Date() });
    return dashboard;
};

const updateDashboard = async (id, orgId, data) => {
    const dashboard = await db.Dashboard.findOne({ where: { id, org_id: orgId } });
    if (!dashboard) throw new AppError('NOT_FOUND', 'Dashboard not found', 404);
    if (data.is_default) {
        await db.Dashboard.update({ is_default: false }, { where: { org_id: orgId } });
    }
    await dashboard.update(data);
    return dashboard;
};

const deleteDashboard = async (id, orgId) => {
    const dashboard = await db.Dashboard.findOne({ where: { id, org_id: orgId } });
    if (!dashboard) throw new AppError('NOT_FOUND', 'Dashboard not found', 404);
    await dashboard.destroy();
};

const duplicateDashboard = async (id, orgId, userId) => {
    const source = await db.Dashboard.findOne({
        where: { id, org_id: orgId },
        include: [{ model: db.Widget, as: 'widgets' }],
    });
    if (!source) throw new AppError('NOT_FOUND', 'Dashboard not found', 404);

    const copy = await db.Dashboard.create({
        org_id: orgId,
        created_by: userId,
        name: `${source.name} (Copy)`,
        description: source.description,
        layout: source.layout,
        theme: source.theme,
        refresh_interval_seconds: source.refresh_interval_seconds,
        is_default: false,
        is_public: false,
    });

    if (source.widgets && source.widgets.length > 0) {
        const widgetData = source.widgets.map(w => ({
            dashboard_id: copy.id,
            org_id: orgId,
            name: w.name,
            widget_type: w.widget_type,
            data_source_id: w.data_source_id,
            config: w.config,
            position_x: w.position_x,
            position_y: w.position_y,
            width: w.width,
            height: w.height,
            refresh_interval_seconds: w.refresh_interval_seconds,
        }));
        await db.Widget.bulkCreate(widgetData);
        await copy.update({ widgets_count: widgetData.length });
    }

    return copy;
};

module.exports = { listDashboards, createDashboard, getDashboard, updateDashboard, deleteDashboard, duplicateDashboard };
