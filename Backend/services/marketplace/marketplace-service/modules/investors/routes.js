'use strict';
const router = require('express').Router();
const { z } = require('zod');
const db = require('../../models');
const { authMiddleware, optionalAuth } = require('../../middleware/authMiddleware');
const { sendSuccess } = require('../../utils/response');
const { AppError } = require('../../utils/errors');
const { screenAml, submitKyc } = require('../../integrations/compliance');

const DEFAULT_ORG_ID = process.env.MARKETPLACE_DEFAULT_ORG_ID || '52c76e5c-0668-4492-ba20-23e7ee16f49b';

const createSchema = z.object({
    type: z.enum(['angel', 'vc', 'family_office', 'pe', 'institutional', 'corporate', 'strategic']),
    legal_name: z.string().min(2).max(300),
    country: z.string().length(2).optional(),
});

// Onboarding create — runs AML screening immediately and submits KYC.
router.post('/', optionalAuth, async (req, res, next) => {
    try {
        const parsed = createSchema.safeParse(req.body);
        if (!parsed.success) return next(new AppError('VALIDATION_ERROR', 'Validation failed', 400, parsed.error.flatten()));
        const org_id = req.user?.orgId || DEFAULT_ORG_ID;
        const aml = await screenAml({ legalName: parsed.data.legal_name, country: parsed.data.country });
        const kyc = await submitKyc({ subjectType: 'investor', subjectId: 'pending' });
        const row = await db.Investor.create({
            ...parsed.data, org_id, created_by: req.user?.id || 'self',
            status: 'submitted',
            aml_status: aml.status === 'clear' ? 'clear' : 'review',
            kyc_status: kyc,
        });
        return sendSuccess(req, res, { ...row.toJSON(), aml }, 201);
    } catch (err) { return next(err); }
});

// Profile + preferences (upsert).
const profileSchema = z.object({
    thesis: z.string().optional(), aum_band: z.string().max(40).optional(),
    website: z.string().max(300).optional(), contact_email: z.string().email().optional(),
});
router.patch('/:id/profile', authMiddleware, async (req, res, next) => {
    try {
        const parsed = profileSchema.safeParse(req.body);
        if (!parsed.success) return next(new AppError('VALIDATION_ERROR', 'Validation failed', 400, parsed.error.flatten()));
        const [row] = await db.InvestorProfile.upsert({ investor_id: req.params.id, ...parsed.data, updated_at: new Date() });
        return sendSuccess(req, res, row);
    } catch (err) { return next(err); }
});

const prefsSchema = z.object({
    industries: z.array(z.string()).optional(), stages: z.array(z.string()).optional(),
    geographies: z.array(z.string()).optional(),
    ticket_min: z.coerce.number().optional(), ticket_max: z.coerce.number().optional(),
    risk_appetite: z.enum(['conservative', 'balanced', 'aggressive']).optional(),
});
router.patch('/:id/preferences', authMiddleware, async (req, res, next) => {
    try {
        const parsed = prefsSchema.safeParse(req.body);
        if (!parsed.success) return next(new AppError('VALIDATION_ERROR', 'Validation failed', 400, parsed.error.flatten()));
        const [row] = await db.InvestmentPreference.upsert({ investor_id: req.params.id, ...parsed.data });
        return sendSuccess(req, res, row);
    } catch (err) { return next(err); }
});

// Accreditation submission — moves status to in_review (verified by compliance).
router.post('/:id/accreditation', authMiddleware, async (req, res, next) => {
    try {
        const investor = await db.Investor.findByPk(req.params.id);
        if (!investor) return next(new AppError('NOT_FOUND', 'Investor not found', 404));
        await investor.update({ accreditation_status: 'in_review' });
        return sendSuccess(req, res, investor);
    } catch (err) { return next(err); }
});

router.get('/:id', authMiddleware, async (req, res, next) => {
    try {
        const row = await db.Investor.findByPk(req.params.id);
        if (!row) return next(new AppError('NOT_FOUND', 'Investor not found', 404));
        return sendSuccess(req, res, row);
    } catch (err) { return next(err); }
});

// TODO(phase 7): portfolio holdings + ROI (joins cap_table + escrow).
router.get('/:id/portfolio', authMiddleware, async (req, res, next) => {
    try { return sendSuccess(req, res, { holdings: [], note: 'Portfolio — scaffolded (phase 7)' }); }
    catch (err) { return next(err); }
});

module.exports = router;
