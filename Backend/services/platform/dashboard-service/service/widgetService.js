'use strict';
const db = require('../models');
const { AppError } = require('../utils/errors');

const listWidgets = async (dashboardId, orgId) => {
    const dashboard = await db.Dashboard.findOne({ where: { id: dashboardId, org_id: orgId } });
    if (!dashboard) throw new AppError('NOT_FOUND', 'Dashboard not found', 404);
    return db.Widget.findAll({
        where: { dashboard_id: dashboardId, org_id: orgId },
        order: [['position_y', 'ASC'], ['position_x', 'ASC']],
    });
};

const createWidget = async (dashboardId, orgId, data) => {
    const dashboard = await db.Dashboard.findOne({ where: { id: dashboardId, org_id: orgId } });
    if (!dashboard) throw new AppError('NOT_FOUND', 'Dashboard not found', 404);

    const widget = await db.Widget.create({ ...data, dashboard_id: dashboardId, org_id: orgId });
    await dashboard.update({ widgets_count: dashboard.widgets_count + 1 });
    return widget;
};

const getWidget = async (id, orgId) => {
    const widget = await db.Widget.findOne({
        where: { id, org_id: orgId },
        include: [{ model: db.DataSource, as: 'data_source' }],
    });
    if (!widget) throw new AppError('NOT_FOUND', 'Widget not found', 404);
    return widget;
};

const updateWidget = async (id, orgId, data) => {
    const widget = await db.Widget.findOne({ where: { id, org_id: orgId } });
    if (!widget) throw new AppError('NOT_FOUND', 'Widget not found', 404);
    await widget.update(data);
    return widget;
};

const deleteWidget = async (id, orgId) => {
    const widget = await db.Widget.findOne({ where: { id, org_id: orgId } });
    if (!widget) throw new AppError('NOT_FOUND', 'Widget not found', 404);
    const dashboard = await db.Dashboard.findOne({ where: { id: widget.dashboard_id, org_id: orgId } });
    await widget.destroy();
    if (dashboard) {
        await dashboard.update({ widgets_count: Math.max(0, dashboard.widgets_count - 1) });
    }
};

module.exports = { listWidgets, createWidget, getWidget, updateWidget, deleteWidget };
