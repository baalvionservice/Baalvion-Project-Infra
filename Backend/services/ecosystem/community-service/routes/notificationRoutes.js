'use strict';
const { Router } = require('express');
const db = require('../models');
const { authMiddleware } = require('../middleware/authMiddleware');
const { rememberContact } = require('../middleware/rememberContact');
const { sendSuccess } = require('../utils/response');
const { AppError } = require('../utils/errors');

const router = Router();
const authed = [authMiddleware, rememberContact];
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const toItem = (r) => ({ id: r.id, type: r.type, title: r.title, body: r.body, url: r.action_url, read: !!r.read_at, createdAt: r.createdAt });
const h = (fn) => async (req, res, next) => { try { return await fn(req, res); } catch (e) { return next(e); } };

router.get('/notifications', ...authed, h(async (req, res) => {
    const limit = Math.min(Number(req.query.limit) || 50, 100);
    const [rows, unread] = await Promise.all([
        db.UserNotification.findAll({ where: { user_id: req.auth.userId }, order: [['created_at', 'DESC']], limit }),
        db.UserNotification.count({ where: { user_id: req.auth.userId, read_at: null } }),
    ]);
    return sendSuccess(req, res, { items: rows.map(toItem), unread });
}));

router.post('/notifications/read-all', ...authed, h(async (req, res) => {
    const [n] = await db.UserNotification.update({ read_at: new Date() }, { where: { user_id: req.auth.userId, read_at: null } });
    return sendSuccess(req, res, { updated: n });
}));

router.post('/notifications/:id/read', ...authed, h(async (req, res) => {
    if (!UUID.test(req.params.id)) throw new AppError('NOT_FOUND', 'Not found', 404);
    // Scoped by user_id: one person cannot mark (or probe) another's notifications.
    const [n] = await db.UserNotification.update({ read_at: new Date() }, { where: { id: req.params.id, user_id: req.auth.userId, read_at: null } });
    return sendSuccess(req, res, { updated: n });
}));

router.delete('/notifications/:id', ...authed, h(async (req, res) => {
    if (!UUID.test(req.params.id)) throw new AppError('NOT_FOUND', 'Not found', 404);
    const n = await db.UserNotification.destroy({ where: { id: req.params.id, user_id: req.auth.userId } });
    return sendSuccess(req, res, { deleted: n });
}));

module.exports = router;
