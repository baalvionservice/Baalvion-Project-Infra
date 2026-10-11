'use strict';
// Staff console plumbing: who is staff, staff management, the audit log, support tickets,
// site announcements, and the admin-triggered notification used for seller outcomes.
const { Router } = require('express');
const v = require('../validators/staffSupport');
const staff = require('../service/staffService');
const support = require('../service/supportService');
const announcements = require('../service/announcementService');
const { authMiddleware, decodeEmailFromRequest } = require('../middleware/authMiddleware');
const { rememberContact } = require('../middleware/rememberContact');
const { requirePerm, resolveTier, permissionsOf, can, PERMISSIONS } = require('../middleware/staffAccess');
const userRateLimit = require('../middleware/userRateLimit');
const { notify } = require('../service/notify');
const { sendSuccess } = require('../utils/response');
const { AppError } = require('../utils/errors');

const router = Router();
const authed = [authMiddleware, rememberContact];
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const h = (fn) => async (req, res, next) => { try { return await fn(req, res); } catch (e) { return next(e); } };
const parse = (schema, body) => {
    const r = schema.safeParse(body || {});
    if (!r.success) { const i = r.error.issues[0]; throw new AppError('VALIDATION_ERROR', `${i.path.join('.') || 'body'}: ${i.message}`, 422); }
    return r.data;
};
const label = (req) => { const e = decodeEmailFromRequest(req); return e ? e.slice(0, 160) : null; };
const USER_ID = /^[A-Za-z0-9_-]{1,64}$/;
const needUser = (req, res, next) => (USER_ID.test(req.params.userId) ? next() : next(new AppError('NOT_FOUND', 'Not found', 404)));
const need = (re) => (req, res, next) => (UUID.test(req.params[re]) ? next() : next(new AppError('NOT_FOUND', 'Not found', 404)));


// ── Who am I (any signed-in user; non-staff simply get no tier) ───────────────
router.get('/staff/me', ...authed, h(async (req, res) => {
    const tier = await resolveTier(req);
    return sendSuccess(req, res, { tier, permissions: permissionsOf(tier), allPermissions: PERMISSIONS });
}));

// ── Staff management (super only) ─────────────────────────────────────────────
router.get('/admin/staff', ...authed, requirePerm('staff.manage'), h(async (req, res) => sendSuccess(req, res, await staff.list())));
router.put('/admin/staff/:userId', ...authed, needUser, requirePerm('staff.manage'), h(async (req, res) => {
    if (req.params.userId === req.auth.userId) throw new AppError('FORBIDDEN', 'You cannot change your own access', 403);
    return sendSuccess(req, res, await staff.grant(req.auth.userId, req.params.userId, parse(v.staffGrantSchema, req.body)));
}));
router.delete('/admin/staff/:userId', ...authed, needUser, requirePerm('staff.manage'), h(async (req, res) => sendSuccess(req, res, await staff.revoke(req.params.userId))));

// ── Audit log ─────────────────────────────────────────────────────────────────
router.get('/admin/audit', ...authed, requirePerm('audit.view'), h(async (req, res) => sendSuccess(req, res, await staff.auditList(req.query))));

// ── Admin-triggered notification (seller approvals, listing outcomes) ─────────
const notifyLimit = userRateLimit({ windowMs: 60 * 1000, max: 60 });
router.post('/admin/notify', ...authed, requirePerm('notify.send'), notifyLimit, h(async (req, res) => {
    const d = parse(v.notifySchema, req.body);
    await notify({ userId: d.userId, type: d.type, title: d.title, body: d.body, url: d.url, key: `admin-notify-${d.userId}-${d.type}-${Date.now()}` });
    return sendSuccess(req, res, { sent: true }, 201);
}));

// ── Support: members ──────────────────────────────────────────────────────────
const createLimit = userRateLimit({ windowMs: 60 * 60 * 1000, max: 5, message: 'Too many tickets, try again later' });
const msgLimit = userRateLimit({ windowMs: 60 * 1000, max: 20 });

router.post('/support/tickets', ...authed, createLimit, h(async (req, res) =>
    sendSuccess(req, res, await support.create(req.auth.userId, label(req), parse(v.ticketCreateSchema, req.body)), 201)));
router.get('/support/tickets/mine', ...authed, h(async (req, res) => sendSuccess(req, res, await support.listMine(req.auth.userId))));
router.get('/support/tickets/:id', ...authed, need('id'), h(async (req, res) => {
    const tier = await resolveTier(req);
    return sendSuccess(req, res, await support.detail(req.params.id, { userId: req.auth.userId, staff: can(tier, 'support.handle') }));
}));
router.post('/support/tickets/:id/messages', ...authed, need('id'), msgLimit, h(async (req, res) => {
    const d = parse(v.messageSchema, req.body);
    // Staff replying to a ticket they do not own go through the admin route so they are audited.
    return sendSuccess(req, res, await support.addMessage(req.params.id, { userId: req.auth.userId, staff: false, label: label(req) }, d.body), 201);
}));
router.post('/support/tickets/:id/close', ...authed, need('id'), h(async (req, res) => sendSuccess(req, res, await support.closeMine(req.params.id, req.auth.userId))));

// ── Support: staff ────────────────────────────────────────────────────────────
const sup = [...authed, requirePerm('support.handle')];
router.get('/admin/support/tickets', ...sup, h(async (req, res) => sendSuccess(req, res, await support.adminList(req.query, { userId: req.auth.userId }))));
router.get('/admin/support/tickets/:id', ...sup, need('id'), h(async (req, res) => sendSuccess(req, res, await support.detail(req.params.id, { userId: req.auth.userId, staff: true }))));
router.patch('/admin/support/tickets/:id', ...sup, need('id'), h(async (req, res) =>
    sendSuccess(req, res, await support.adminUpdate(req.params.id, { userId: req.auth.userId, label: label(req) }, parse(v.ticketStaffUpdateSchema, req.body)))));
router.post('/admin/support/tickets/:id/messages', ...sup, need('id'), msgLimit, h(async (req, res) =>
    sendSuccess(req, res, await support.addMessage(req.params.id, { userId: req.auth.userId, staff: true, label: label(req) }, parse(v.messageSchema, req.body).body), 201)));

// ── Announcements ─────────────────────────────────────────────────────────────
router.get('/announcements/active', h(async (req, res) => {
    res.set('Cache-Control', 'public, max-age=60');
    return sendSuccess(req, res, await announcements.active());
}));
const ann = [...authed, requirePerm('announce.publish')];
router.get('/admin/announcements', ...ann, h(async (req, res) => sendSuccess(req, res, await announcements.adminList())));
router.post('/admin/announcements', ...ann, h(async (req, res) => sendSuccess(req, res, await announcements.create(req.auth.userId, parse(v.announcementCreateSchema, req.body)), 201)));
router.patch('/admin/announcements/:id', ...ann, need('id'), h(async (req, res) => sendSuccess(req, res, await announcements.update(req.params.id, parse(v.announcementUpdateSchema, req.body)))));

module.exports = router;
