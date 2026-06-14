'use strict';
const router = require('express').Router();
const { z } = require('zod');
const db = require('../../models');
const { authMiddleware, optionalAuth } = require('../../middleware/authMiddleware');
const { sendSuccess, sendPaginated } = require('../../utils/response');
const { AppError } = require('../../utils/errors');
const { submitKyc } = require('../../integrations/compliance');

const DEFAULT_ORG_ID = process.env.MARKETPLACE_DEFAULT_ORG_ID || '52c76e5c-0668-4492-ba20-23e7ee16f49b';

const createSchema = z.object({
    legal_name: z.string().min(2).max(300),
    brand_name: z.string().max(300).optional(),
    registration_no: z.string().max(60).optional(),
    country: z.string().length(2).optional(),
    industry_code: z.string().max(40).optional(),
    stage: z.enum(['startup', 'sme', 'growth', 'enterprise']).default('startup'),
    website: z.string().url().max(300).optional(),
});

// Onboarding create (a founder registers their company).
router.post('/', optionalAuth, async (req, res, next) => {
    try {
        const parsed = createSchema.safeParse(req.body);
        if (!parsed.success) return next(new AppError('VALIDATION_ERROR', 'Validation failed', 400, parsed.error.flatten()));
        const org_id = req.user?.orgId || DEFAULT_ORG_ID;
        const row = await db.Company.create({ ...parsed.data, org_id, created_by: req.user?.id || 'self' });
        return sendSuccess(req, res, row, 201);
    } catch (err) { return next(err); }
});

// Staff/admin list (scoped to caller org).
router.get('/', authMiddleware, async (req, res, next) => {
    try {
        const page = Number(req.query.page) || 1;
        const limit = Math.min(Number(req.query.limit) || 20, 100);
        const { count, rows } = await db.Company.findAndCountAll({
            where: { org_id: req.user.orgId }, order: [['created_at', 'DESC']], limit, offset: (page - 1) * limit,
        });
        return sendPaginated(req, res, { items: rows, total: count, page, limit, totalPages: Math.ceil(count / limit) });
    } catch (err) { return next(err); }
});

router.get('/:id', optionalAuth, async (req, res, next) => {
    try {
        const row = await db.Company.findByPk(req.params.id);
        if (!row) return next(new AppError('NOT_FOUND', 'Company not found', 404));
        const [profile, founders] = await Promise.all([
            db.CompanyProfile.findByPk(req.params.id),
            db.Founder.findAll({ where: { company_id: req.params.id } }),
        ]);
        return sendSuccess(req, res, { ...row.toJSON(), profile, founders });
    } catch (err) { return next(err); }
});

// Upsert the rich profile (summary, traction, funding ask, deck).
const profileSchema = z.object({
    summary: z.string().optional(), problem: z.string().optional(), solution: z.string().optional(),
    traction_json: z.record(z.any()).optional(),
    team_size: z.coerce.number().int().optional(), founded_year: z.coerce.number().int().optional(),
    revenue_band: z.string().max(40).optional(),
    funding_raised: z.coerce.number().optional(), funding_target: z.coerce.number().optional(),
    valuation_target: z.coerce.number().optional(), deck_url: z.string().max(500).optional(),
    is_published: z.boolean().optional(),
});
router.patch('/:id/profile', authMiddleware, async (req, res, next) => {
    try {
        const parsed = profileSchema.safeParse(req.body);
        if (!parsed.success) return next(new AppError('VALIDATION_ERROR', 'Validation failed', 400, parsed.error.flatten()));
        const company = await db.Company.findByPk(req.params.id);
        if (!company) return next(new AppError('NOT_FOUND', 'Company not found', 404));
        const [row] = await db.CompanyProfile.upsert({ company_id: req.params.id, ...parsed.data, updated_at: new Date() });
        return sendSuccess(req, res, row);
    } catch (err) { return next(err); }
});

// Add a founder.
const founderSchema = z.object({
    name: z.string().min(2).max(200), role: z.string().max(120).optional(),
    email: z.string().email().optional(), linkedin: z.string().max(300).optional(),
    equity_pct: z.coerce.number().min(0).max(100).optional(), bio: z.string().optional(),
});
router.post('/:id/founders', authMiddleware, async (req, res, next) => {
    try {
        const parsed = founderSchema.safeParse(req.body);
        if (!parsed.success) return next(new AppError('VALIDATION_ERROR', 'Validation failed', 400, parsed.error.flatten()));
        const row = await db.Founder.create({ ...parsed.data, company_id: req.params.id });
        return sendSuccess(req, res, row, 201);
    } catch (err) { return next(err); }
});

// Register an uploaded document (file already stored in S3 via @baalvion/upload → file_url).
const docSchema = z.object({
    type: z.enum(['financial', 'legal', 'ip', 'business_plan', 'cap_table', 'deck']),
    file_url: z.string().min(1).max(600), file_size: z.coerce.number().int().optional(),
    mime: z.string().max(120).optional(),
    visibility: z.enum(['private', 'nda', 'approved']).default('private'),
});
router.post('/:id/documents', authMiddleware, async (req, res, next) => {
    try {
        const parsed = docSchema.safeParse(req.body);
        if (!parsed.success) return next(new AppError('VALIDATION_ERROR', 'Validation failed', 400, parsed.error.flatten()));
        const row = await db.CompanyDocument.create({ ...parsed.data, company_id: req.params.id, uploaded_by: req.user?.id || 'self' });
        return sendSuccess(req, res, row, 201);
    } catch (err) { return next(err); }
});

// Cap table — current holdings + the event history that produced them.
router.get('/:id/cap-table', authMiddleware, async (req, res, next) => {
    try {
        const [entries, events] = await Promise.all([
            db.CapTableEntry.findAll({ where: { company_id: req.params.id }, order: [['as_of', 'DESC']] }),
            db.CapTableEvent.findAll({ where: { company_id: req.params.id }, order: [['effective_at', 'DESC']] }),
        ]);
        return sendSuccess(req, res, { entries, events });
    } catch (err) { return next(err); }
});

// Submit for compliance/admin approval — triggers KYC.
router.post('/:id/submit', authMiddleware, async (req, res, next) => {
    try {
        const company = await db.Company.findByPk(req.params.id);
        if (!company) return next(new AppError('NOT_FOUND', 'Company not found', 404));
        if (company.status !== 'draft' && company.status !== 'rejected') {
            return next(new AppError('CONFLICT', `Company already ${company.status}`, 409));
        }
        const kyc = await submitKyc({ subjectType: 'company', subjectId: company.id });
        await company.update({ status: 'submitted', kyc_status: kyc });
        return sendSuccess(req, res, company);
    } catch (err) { return next(err); }
});

module.exports = router;
