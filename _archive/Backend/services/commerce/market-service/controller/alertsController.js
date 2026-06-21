'use strict';
const db = require('../models');
const { PriceAlert } = db;
const { AppError } = require('../utils/errors');
const { sendSuccess, sendPaginated } = require('../utils/response');

const listAlerts = async (req, res, next) => {
    try {
        const where = { user_id: req.user.id };
        if (req.query.is_active !== undefined) where.is_active = req.query.is_active === 'true';
        const alerts = await PriceAlert.findAll({ where, order: [['created_at', 'DESC']] });
        return sendPaginated(req, res, { items: alerts, pagination: { total: alerts.length, page: 1, limit: alerts.length, totalPages: 1 } });
    } catch (err) { return next(err); }
};

const createAlert = async (req, res, next) => {
    try {
        const { symbol, name, alert_type, target_value, current_price, notification_channels } = req.body;
        if (!symbol || !alert_type || target_value === undefined) {
            return next(new AppError('VALIDATION_ERROR', 'symbol, alert_type, and target_value are required', 400));
        }
        if (!['above', 'below', 'change_pct'].includes(alert_type)) {
            return next(new AppError('VALIDATION_ERROR', 'alert_type must be above, below, or change_pct', 400));
        }
        const alert = await PriceAlert.create({
            user_id: req.user.id,
            symbol: symbol.toUpperCase(),
            name,
            alert_type,
            target_value,
            current_price: current_price || 0,
            notification_channels: notification_channels || ['app'],
        });
        return sendSuccess(req, res, alert, 201);
    } catch (err) { return next(err); }
};

const updateAlert = async (req, res, next) => {
    try {
        const alert = await PriceAlert.findOne({ where: { id: req.params.id, user_id: req.user.id } });
        if (!alert) return next(new AppError('NOT_FOUND', 'Alert not found', 404));
        const allowed = ['target_value', 'is_active', 'name', 'notification_channels'];
        const updates = {};
        for (const key of allowed) { if (req.body[key] !== undefined) updates[key] = req.body[key]; }
        // Reactivating an alert should reset triggered state
        if (updates.is_active === true) { updates.is_triggered = false; updates.triggered_at = null; }
        await alert.update(updates);
        return sendSuccess(req, res, alert);
    } catch (err) { return next(err); }
};

const deleteAlert = async (req, res, next) => {
    try {
        const alert = await PriceAlert.findOne({ where: { id: req.params.id, user_id: req.user.id } });
        if (!alert) return next(new AppError('NOT_FOUND', 'Alert not found', 404));
        await alert.destroy();
        return sendSuccess(req, res, { deleted: true });
    } catch (err) { return next(err); }
};

const checkAlerts = async (req, res, next) => {
    try {
        const activeAlerts = await PriceAlert.findAll({ where: { is_active: true, is_triggered: false } });
        const triggered = [];
        for (const alert of activeAlerts) {
            const currentPrice = parseFloat(alert.current_price || 0);
            const targetValue = parseFloat(alert.target_value);
            let shouldTrigger = false;
            if (alert.alert_type === 'above' && currentPrice >= targetValue) shouldTrigger = true;
            else if (alert.alert_type === 'below' && currentPrice <= targetValue) shouldTrigger = true;
            else if (alert.alert_type === 'change_pct') {
                // change_pct: trigger if absolute change pct >= target
                shouldTrigger = Math.abs(parseFloat(alert.change_pct || 0)) >= targetValue;
            }
            if (shouldTrigger) {
                await alert.update({ is_triggered: true, triggered_at: new Date() });
                triggered.push(alert.id);
            }
        }
        return sendSuccess(req, res, { checked: activeAlerts.length, triggered: triggered.length, triggered_ids: triggered });
    } catch (err) { return next(err); }
};

module.exports = { listAlerts, createAlert, updateAlert, deleteAlert, checkAlerts };
