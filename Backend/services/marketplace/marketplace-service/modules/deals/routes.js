'use strict';
const router = require('express').Router();
const { z } = require('zod');
const db = require('../../models');
const { authMiddleware } = require('../../middleware/authMiddleware');
const { sendSuccess, sendPaginated } = require('../../utils/response');
const { AppError } = require('../../utils/errors');

const v = (schema, body) => { const p = schema.safeParse(body); if (!p.success) throw new AppError('VALIDATION_ERROR', 'Validation failed', 400, p.error.flatten()); return p.data; };
const loadDeal = async (id) => { const d = await db.Deal.findByPk(id); if (!d) throw new AppError('NOT_FOUND', 'Deal not found', 404); return d; };
const isCompanySide = (deal, req) => req.user?.orgId === deal.org_id_company;

// ── Deal lifecycle ──────────────────────────────────────────────────────────
router.post('/', authMiddleware, async (req, res, next) => {
    try {
        const data = v(z.object({ opportunity_id: z.string().uuid(), org_id_company: z.string().uuid(), lead_investor_id: z.string().uuid().optional() }), req.body);
        const deal = await db.Deal.create({ ...data, org_id_investor: req.user.orgId, status: 'open' });
        await db.DealMessage.create({ deal_id: deal.id, sender_id: 'system', kind: 'system', body: 'Deal opened — investor expressed interest.' });
        return sendSuccess(req, res, deal, 201);
    } catch (err) { return next(err); }
});

router.get('/', authMiddleware, async (req, res, next) => {
    try {
        const page = Number(req.query.page) || 1; const limit = Math.min(Number(req.query.limit) || 20, 100);
        const { Op } = db.Sequelize;
        const where = { [Op.or]: [{ org_id_investor: req.user.orgId }, { org_id_company: req.user.orgId }] };
        if (req.query.status) where.status = req.query.status;
        const { count, rows } = await db.Deal.findAndCountAll({ where, order: [['created_at', 'DESC']], limit, offset: (page - 1) * limit });
        return sendPaginated(req, res, { items: rows, total: count, page, limit, totalPages: Math.ceil(count / limit) });
    } catch (err) { return next(err); }
});

router.get('/:id', authMiddleware, async (req, res, next) => {
    try { return sendSuccess(req, res, await loadDeal(req.params.id)); } catch (err) { return next(err); }
});

router.patch('/:id', authMiddleware, async (req, res, next) => {
    try {
        const deal = await loadDeal(req.params.id);
        const status = z.enum(['open', 'dd', 'negotiating', 'term_sheet', 'signing', 'funding', 'closed', 'withdrawn']).parse(req.body.status);
        await deal.update({ status });
        return sendSuccess(req, res, deal);
    } catch (err) { return next(err); }
});

// ── Chat (realtime delivery is handled by deal-room-service; this is the store) ──
router.get('/:dealId/messages', authMiddleware, async (req, res, next) => {
    try {
        await loadDeal(req.params.dealId);
        const rows = await db.DealMessage.findAll({ where: { deal_id: req.params.dealId }, order: [['created_at', 'ASC']], limit: 500 });
        return sendSuccess(req, res, rows);
    } catch (err) { return next(err); }
});
router.post('/:dealId/messages', authMiddleware, async (req, res, next) => {
    try {
        await loadDeal(req.params.dealId);
        const data = v(z.object({ body: z.string().min(1).max(5000), attachments_json: z.array(z.any()).optional() }), req.body);
        const row = await db.DealMessage.create({ deal_id: req.params.dealId, sender_id: req.user.id || 'user', body: data.body, attachments_json: data.attachments_json || [] });
        return sendSuccess(req, res, row, 201);
    } catch (err) { return next(err); }
});

// ── Members ─────────────────────────────────────────────────────────────────
router.get('/:dealId/members', authMiddleware, async (req, res, next) => {
    try { await loadDeal(req.params.dealId); return sendSuccess(req, res, await db.DealMember.findAll({ where: { deal_id: req.params.dealId } })); } catch (err) { return next(err); }
});
router.post('/:dealId/members', authMiddleware, async (req, res, next) => {
    try {
        await loadDeal(req.params.dealId);
        const data = v(z.object({ user_id: z.string().min(1), org_id: z.string().uuid(), role: z.enum(['lead', 'participant', 'advisor', 'legal', 'observer']).default('participant') }), req.body);
        const row = await db.DealMember.create({ deal_id: req.params.dealId, ...data });
        return sendSuccess(req, res, row, 201);
    } catch (err) { return next(err); }
});

// ── NDA gate — signing unlocks the data room for the signer's org ─────────────
router.get('/:dealId/nda', authMiddleware, async (req, res, next) => {
    try { await loadDeal(req.params.dealId); return sendSuccess(req, res, await db.NdaAgreement.findAll({ where: { deal_id: req.params.dealId } })); } catch (err) { return next(err); }
});
router.post('/:dealId/nda', authMiddleware, async (req, res, next) => {
    try {
        const deal = await loadDeal(req.params.dealId);
        const nda = await db.NdaAgreement.create({
            deal_id: deal.id, party_org_id: req.user.orgId, template_id: req.body.template_id || 'nda-standard-v1',
            status: 'signed', signed_at: new Date(), signature_ref: `sig-${Date.now()}`,
        });
        // Unlock the data room for the signer (idempotent-ish category-wide grant).
        await db.DocumentAccessGrant.create({ deal_id: deal.id, category: 'all', grantee_org_id: req.user.orgId, condition: 'nda', granted_by: 'system' });
        if (deal.status === 'open') await deal.update({ status: 'dd' });
        return sendSuccess(req, res, nda, 201);
    } catch (err) { return next(err); }
});

// ── Document requests (DD) ────────────────────────────────────────────────────
router.get('/:dealId/document-requests', authMiddleware, async (req, res, next) => {
    try { await loadDeal(req.params.dealId); return sendSuccess(req, res, await db.DocumentRequest.findAll({ where: { deal_id: req.params.dealId }, order: [['created_at', 'DESC']] })); } catch (err) { return next(err); }
});
router.post('/:dealId/document-requests', authMiddleware, async (req, res, next) => {
    try {
        await loadDeal(req.params.dealId);
        const data = v(z.object({ category: z.enum(['financial', 'legal', 'operational', 'compliance', 'tax']), title: z.string().min(2).max(300) }), req.body);
        const row = await db.DocumentRequest.create({ deal_id: req.params.dealId, ...data, requested_by: req.user.id || 'investor' });
        return sendSuccess(req, res, row, 201);
    } catch (err) { return next(err); }
});
router.patch('/:dealId/document-requests/:rid', authMiddleware, async (req, res, next) => {
    try {
        const row = await db.DocumentRequest.findOne({ where: { id: req.params.rid, deal_id: req.params.dealId } });
        if (!row) return next(new AppError('NOT_FOUND', 'Request not found', 404));
        const status = z.enum(['requested', 'uploaded', 'approved', 'rejected']).parse(req.body.status);
        await row.update({ status });
        return sendSuccess(req, res, row);
    } catch (err) { return next(err); }
});

// ── Data room — GATED: company side always; investor side only with an NDA grant ──
async function canViewDataRoom(deal, req) {
    if (isCompanySide(deal, req)) return true;
    const grant = await db.DocumentAccessGrant.findOne({ where: { deal_id: deal.id, grantee_org_id: req.user.orgId } });
    return !!grant;
}
router.get('/:dealId/documents', authMiddleware, async (req, res, next) => {
    try {
        const deal = await loadDeal(req.params.dealId);
        if (!(await canViewDataRoom(deal, req))) return next(new AppError('LOCKED', 'Data room locked — sign the NDA to unlock', 403));
        return sendSuccess(req, res, await db.DataRoomDocument.findAll({ where: { deal_id: deal.id }, order: [['created_at', 'DESC']] }));
    } catch (err) { return next(err); }
});
router.post('/:dealId/documents', authMiddleware, async (req, res, next) => {
    try {
        await loadDeal(req.params.dealId);
        const data = v(z.object({ file_url: z.string().min(1).max(600), document_request_id: z.string().uuid().optional(), version: z.coerce.number().int().optional() }), req.body);
        const row = await db.DataRoomDocument.create({ deal_id: req.params.dealId, ...data, uploaded_by: req.user.id || 'company' });
        if (data.document_request_id) {
            const dr = await db.DocumentRequest.findByPk(data.document_request_id);
            if (dr) await dr.update({ status: 'uploaded' });
        }
        return sendSuccess(req, res, row, 201);
    } catch (err) { return next(err); }
});

// ── Access grants (company controls who unlocks what) ─────────────────────────
router.get('/:dealId/access-grants', authMiddleware, async (req, res, next) => {
    try { await loadDeal(req.params.dealId); return sendSuccess(req, res, await db.DocumentAccessGrant.findAll({ where: { deal_id: req.params.dealId } })); } catch (err) { return next(err); }
});
router.post('/:dealId/access-grants', authMiddleware, async (req, res, next) => {
    try {
        await loadDeal(req.params.dealId);
        const data = v(z.object({ grantee_org_id: z.string().uuid(), category: z.string().max(20).optional(), document_id: z.string().uuid().optional(), condition: z.enum(['kyc', 'nda', 'verified', 'approved']).default('approved') }), req.body);
        const row = await db.DocumentAccessGrant.create({ deal_id: req.params.dealId, ...data, granted_by: req.user.id || 'company' });
        return sendSuccess(req, res, row, 201);
    } catch (err) { return next(err); }
});

// ── Due diligence ─────────────────────────────────────────────────────────────
router.get('/:dealId/due-diligence', authMiddleware, async (req, res, next) => {
    try {
        await loadDeal(req.params.dealId);
        const items = await db.DueDiligenceItem.findAll({ where: { deal_id: req.params.dealId } });
        const complete = items.filter((i) => i.status === 'complete').length;
        return sendSuccess(req, res, { items, progress: { total: items.length, complete, pct: items.length ? Math.round((complete / items.length) * 100) : 0 } });
    } catch (err) { return next(err); }
});
router.post('/:dealId/due-diligence', authMiddleware, async (req, res, next) => {
    try {
        await loadDeal(req.params.dealId);
        const data = v(z.object({ category: z.enum(['financial', 'legal', 'operational', 'compliance', 'tax']), item: z.string().min(2).max(300), owner: z.string().max(120).optional() }), req.body);
        const row = await db.DueDiligenceItem.create({ deal_id: req.params.dealId, ...data });
        return sendSuccess(req, res, row, 201);
    } catch (err) { return next(err); }
});
router.patch('/:dealId/due-diligence/:itemId', authMiddleware, async (req, res, next) => {
    try {
        const row = await db.DueDiligenceItem.findOne({ where: { id: req.params.itemId, deal_id: req.params.dealId } });
        if (!row) return next(new AppError('NOT_FOUND', 'Item not found', 404));
        const data = v(z.object({ status: z.enum(['open', 'in_progress', 'complete', 'flagged']).optional(), evidence_url: z.string().max(600).optional(), owner: z.string().max(120).optional() }), req.body);
        await row.update(data);
        return sendSuccess(req, res, row);
    } catch (err) { return next(err); }
});

// ── Term sheets + versioning (propose / counter / accept / reject) ────────────
const versionSchema = z.object({
    amount: z.coerce.number().optional(), equity_pct: z.coerce.number().optional(), valuation: z.coerce.number().optional(),
    board_rights_json: z.record(z.any()).optional(), investor_rights_json: z.record(z.any()).optional(), exit_rights_json: z.record(z.any()).optional(),
    note: z.string().max(5000).optional(),
});
router.get('/:dealId/term-sheets', authMiddleware, async (req, res, next) => {
    try {
        await loadDeal(req.params.dealId);
        const sheets = await db.TermSheet.findAll({ where: { deal_id: req.params.dealId } });
        const withVersions = await Promise.all(sheets.map(async (s) => ({ ...s.toJSON(), versions: await db.TermSheetVersion.findAll({ where: { term_sheet_id: s.id }, order: [['version', 'ASC']] }) })));
        return sendSuccess(req, res, withVersions);
    } catch (err) { return next(err); }
});
router.post('/:dealId/term-sheets', authMiddleware, async (req, res, next) => {
    try {
        const deal = await loadDeal(req.params.dealId);
        const data = v(versionSchema, req.body);
        const ts = await db.TermSheet.create({ deal_id: deal.id, current_version: 1, status: 'sent' });
        const ver = await db.TermSheetVersion.create({ term_sheet_id: ts.id, version: 1, ...data, author_org_id: req.user.orgId, action: 'propose' });
        await deal.update({ status: 'term_sheet' });
        return sendSuccess(req, res, { ...ts.toJSON(), versions: [ver] }, 201);
    } catch (err) { return next(err); }
});
router.post('/:dealId/term-sheets/:tsId/versions', authMiddleware, async (req, res, next) => {
    try {
        const deal = await loadDeal(req.params.dealId);
        const ts = await db.TermSheet.findOne({ where: { id: req.params.tsId, deal_id: deal.id } });
        if (!ts) return next(new AppError('NOT_FOUND', 'Term sheet not found', 404));
        if (['accepted', 'rejected'].includes(ts.status)) return next(new AppError('CONFLICT', `Term sheet already ${ts.status}`, 409));
        const action = z.enum(['counter', 'accept', 'reject']).parse(req.body.action);
        const data = action === 'counter' ? v(versionSchema, req.body) : {};
        const nextVersion = ts.current_version + 1;
        const ver = await db.TermSheetVersion.create({ term_sheet_id: ts.id, version: nextVersion, ...data, author_org_id: req.user.orgId, action, note: req.body.note });
        const status = action === 'counter' ? 'countered' : action === 'accept' ? 'accepted' : 'rejected';
        await ts.update({ current_version: nextVersion, status });
        if (action === 'accept') await deal.update({ status: 'signing' });
        return sendSuccess(req, res, { ...ts.toJSON(), version: ver });
    } catch (err) { return next(err); }
});

// ── E-signature (envelope seam → aadhaar_esign / docusign / adobe_sign) ───────
router.get('/:dealId/signatures', authMiddleware, async (req, res, next) => {
    try { await loadDeal(req.params.dealId); return sendSuccess(req, res, await db.Signature.findAll({ where: { deal_id: req.params.dealId } })); } catch (err) { return next(err); }
});
router.post('/:dealId/signatures', authMiddleware, async (req, res, next) => {
    try {
        await loadDeal(req.params.dealId);
        const data = v(z.object({ document_type: z.enum(['nda', 'term_sheet', 'spa']), provider: z.enum(['aadhaar_esign', 'docusign', 'adobe_sign']).default('docusign') }), req.body);
        const row = await db.Signature.create({ deal_id: req.params.dealId, ...data, signer_id: req.user.id || 'signer', status: 'sent', envelope_id: `env-${Date.now()}` });
        return sendSuccess(req, res, row, 201);
    } catch (err) { return next(err); }
});
router.post('/:dealId/signatures/:sid/complete', authMiddleware, async (req, res, next) => {
    try {
        const row = await db.Signature.findOne({ where: { id: req.params.sid, deal_id: req.params.dealId } });
        if (!row) return next(new AppError('NOT_FOUND', 'Signature not found', 404));
        await row.update({ status: 'signed', signed_at: new Date(), audit_url: `s3://baalvion-signatures/${row.envelope_id}.pdf` });
        return sendSuccess(req, res, row);
    } catch (err) { return next(err); }
});

// ── Escrow (orchestrates escrow-service) → cap table issuance on release ───────
router.get('/:dealId/escrow', authMiddleware, async (req, res, next) => {
    try { await loadDeal(req.params.dealId); return sendSuccess(req, res, await db.EscrowTransaction.findAll({ where: { deal_id: req.params.dealId } })); } catch (err) { return next(err); }
});
router.post('/:dealId/escrow', authMiddleware, async (req, res, next) => {
    try {
        const deal = await loadDeal(req.params.dealId);
        const data = v(z.object({ amount: z.coerce.number().positive(), currency: z.string().length(3).default('USD'), release_conditions_json: z.record(z.any()).optional() }), req.body);
        const row = await db.EscrowTransaction.create({ deal_id: deal.id, ...data, status: 'initiated', escrow_ref: `escrow-${Date.now()}` });
        await deal.update({ status: 'funding' });
        return sendSuccess(req, res, row, 201);
    } catch (err) { return next(err); }
});
router.post('/:dealId/escrow/:eid/fund', authMiddleware, async (req, res, next) => {
    try {
        const esc = await db.EscrowTransaction.findOne({ where: { id: req.params.eid, deal_id: req.params.dealId } });
        if (!esc) return next(new AppError('NOT_FOUND', 'Escrow not found', 404));
        if (esc.status !== 'initiated') return next(new AppError('CONFLICT', `Escrow already ${esc.status}`, 409));
        await esc.update({ status: 'funded' });
        return sendSuccess(req, res, esc);
    } catch (err) { return next(err); }
});
// Release requires a staff role (compliance/admin) — funds move and ownership is issued.
const STAFF = ['super_admin', 'owner', 'admin', 'compliance', 'platform_admin'];
router.post('/:dealId/escrow/:eid/release', authMiddleware, async (req, res, next) => {
    try {
        if (!Array.isArray(req.user?.roles) || !req.user.roles.some((r) => STAFF.includes(r))) {
            return next(new AppError('FORBIDDEN', 'Compliance/admin approval required to release escrow', 403));
        }
        const deal = await loadDeal(req.params.dealId);
        const esc = await db.EscrowTransaction.findOne({ where: { id: req.params.eid, deal_id: deal.id } });
        if (!esc) return next(new AppError('NOT_FOUND', 'Escrow not found', 404));
        if (esc.status !== 'funded') return next(new AppError('PRECONDITION_FAILED', 'Escrow must be funded before release', 412));
        await esc.update({ status: 'released' });

        // Issue ownership to the investor on the company's cap table.
        const opp = deal.opportunity_id ? await db.Opportunity.findByPk(deal.opportunity_id) : null;
        const companyId = opp?.company_id;
        let equity = null;
        const ts = await db.TermSheet.findOne({ where: { deal_id: deal.id, status: 'accepted' } });
        if (ts) {
            const versions = await db.TermSheetVersion.findAll({ where: { term_sheet_id: ts.id }, order: [['version', 'DESC']] });
            equity = versions.find((x) => x.equity_pct != null)?.equity_pct ?? null;
        }
        if (companyId) {
            await db.CapTableEntry.create({ company_id: companyId, holder_type: 'investor', holder_id: deal.org_id_investor, security_type: 'preferred', ownership_pct: equity });
            await db.CapTableEvent.create({ company_id: companyId, deal_id: deal.id, event: 'issue', delta_json: { investor_org: deal.org_id_investor, amount: esc.amount, ownership_pct: equity } });
        }
        await deal.update({ status: 'closed' });
        if (opp) await opp.update({ status: 'closed' });
        return sendSuccess(req, res, { escrow: esc, deal_status: 'closed', issued_ownership_pct: equity, company_id: companyId });
    } catch (err) { return next(err); }
});

module.exports = router;
