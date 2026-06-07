'use strict';
const router = require('express').Router();
const { authMiddleware } = require('../middleware/authMiddleware');
const db = require('../models');
const { makeCrud } = require('../controller/engagementController');
const { sendSuccess } = require('../utils/response');
const { AppError } = require('../utils/errors');

const ctrl = makeCrud(db.IrSubscription);

const DEFAULT_ORG_ID = process.env.IR_DEFAULT_ORG_ID || '11111111-1111-1111-1111-111111111111';
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Public email-alerts signup (no auth) — upserts a subscription by email so re-signing
// updates preferences instead of duplicating. Persists to ir.ir_subscriptions.
router.post('/subscribe', async (req, res, next) => {
    try {
        const { email, preferences } = req.body || {};
        if (!email || !EMAIL_RE.test(String(email))) {
            return next(new AppError('VALIDATION_ERROR', 'A valid email address is required', 400));
        }
        const orgId = req.user?.orgId || DEFAULT_ORG_ID;
        const normalized = String(email).trim().toLowerCase();
        const prefs = (preferences && typeof preferences === 'object') ? preferences : {};
        const existing = await db.IrSubscription.findOne({ where: { org_id: orgId, email: normalized } });
        const row = existing
            ? await existing.update({ preferences: prefs, active: true })
            : await db.IrSubscription.create({ org_id: orgId, role: 'public_investor', email: normalized, preferences: prefs, active: true });
        return sendSuccess(req, res, row, 201);
    } catch (err) { return next(err); }
});

router.get('/', ctrl.list);
router.get('/:id', ctrl.get);
router.post('/', authMiddleware, ctrl.create);
router.patch('/:id', authMiddleware, ctrl.update);
router.delete('/:id', authMiddleware, ctrl.remove);

module.exports = router;
