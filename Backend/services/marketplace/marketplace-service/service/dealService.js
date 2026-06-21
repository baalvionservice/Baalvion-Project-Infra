'use strict';
// Deal-room domain logic — the full lifecycle: open → NDA-gated data room → due diligence →
// term-sheet negotiation (versioned) → e-signature → escrow → cap-table issuance on release.
// Controllers validate + delegate; every rule and side effect lives here.
const db = require('../models');
const { AppError } = require('../utils/errors');
const { parseListQuery, paginate } = require('../utils/query');
const { isStaff } = require('../utils/authz');

const SORTABLE = ['created_at', 'updated_at', 'status'];

async function loadDeal(id) {
    const deal = await db.Deal.findByPk(id);
    if (!deal) throw new AppError('NOT_FOUND', 'Deal not found', 404);
    return deal;
}

const isCompanySide = (deal, user) => user?.orgId === deal.org_id_company;

// Confidential deal room: the caller must be one of the two principal orgs, an explicitly
// added deal member (advisor/legal/observer), or platform/compliance staff. Loads and returns
// the deal so the caller can reuse it. Used as the router-level guard for every /:dealId route.
async function assertDealAccess(dealId, user) {
    const deal = await loadDeal(dealId);
    if (isStaff(user)) return deal;
    const orgId = user?.orgId;
    if (orgId && (orgId === deal.org_id_company || orgId === deal.org_id_investor)) return deal;
    const member = orgId ? await db.DealMember.findOne({ where: { deal_id: deal.id, org_id: orgId } }) : null;
    if (member) return deal;
    throw new AppError('FORBIDDEN', 'You are not a party to this deal', 403);
}

async function canViewDataRoom(deal, user) {
    if (isCompanySide(deal, user)) return true;
    const grant = await db.DocumentAccessGrant.findOne({ where: { deal_id: deal.id, grantee_org_id: user?.orgId } });
    return !!grant;
}

// ── Lifecycle ─────────────────────────────────────────────────────────────────
async function create({ data, user }) {
    const deal = await db.Deal.create({ ...data, org_id_investor: user.orgId, status: 'open' });
    await db.DealMessage.create({ deal_id: deal.id, sender_id: 'system', kind: 'system', body: 'Deal opened — investor expressed interest.' });
    return deal;
}

async function list({ orgId, query }) {
    const { order, limit, offset, page } = parseListQuery(query, { sortable: SORTABLE });
    const { Op } = db.Sequelize;
    const where = { [Op.or]: [{ org_id_investor: orgId }, { org_id_company: orgId }] };
    if (query.status) where.status = query.status;
    const { count, rows } = await db.Deal.findAndCountAll({ where, order, limit, offset });
    return paginate({ rows, count, page, limit });
}

async function updateStatus({ id, status }) {
    const deal = await loadDeal(id);
    await deal.update({ status });
    return deal;
}

// ── Chat (durable store; realtime delivery handled by deal-room-service) ────────
async function listMessages(dealId) {
    await loadDeal(dealId);
    return db.DealMessage.findAll({ where: { deal_id: dealId }, order: [['created_at', 'ASC']], limit: 500 });
}

async function addMessage({ dealId, data, user }) {
    await loadDeal(dealId);
    return db.DealMessage.create({
        deal_id: dealId,
        sender_id: user?.id || 'user',
        body: data.body,
        attachments_json: data.attachments_json || [],
    });
}

// ── Members ─────────────────────────────────────────────────────────────────
async function listMembers(dealId) {
    await loadDeal(dealId);
    return db.DealMember.findAll({ where: { deal_id: dealId } });
}

async function addMember({ dealId, data }) {
    await loadDeal(dealId);
    return db.DealMember.create({ deal_id: dealId, ...data });
}

// ── NDA gate — signing unlocks the data room for the signer's org ─────────────
async function listNda(dealId) {
    await loadDeal(dealId);
    return db.NdaAgreement.findAll({ where: { deal_id: dealId } });
}

async function signNda({ dealId, templateId, user }) {
    const deal = await loadDeal(dealId);
    const nda = await db.NdaAgreement.create({
        deal_id: deal.id,
        party_org_id: user.orgId,
        template_id: templateId || 'nda-standard-v1',
        status: 'signed',
        signed_at: new Date(),
        signature_ref: `sig-${Date.now()}`,
    });
    await db.DocumentAccessGrant.create({ deal_id: deal.id, category: 'all', grantee_org_id: user.orgId, condition: 'nda', granted_by: 'system' });
    if (deal.status === 'open') await deal.update({ status: 'dd' });
    return nda;
}

// ── Document requests (DD) ────────────────────────────────────────────────────
async function listDocumentRequests(dealId) {
    await loadDeal(dealId);
    return db.DocumentRequest.findAll({ where: { deal_id: dealId }, order: [['created_at', 'DESC']] });
}

async function addDocumentRequest({ dealId, data, user }) {
    await loadDeal(dealId);
    return db.DocumentRequest.create({ deal_id: dealId, ...data, requested_by: user?.id || 'investor' });
}

async function updateDocumentRequest({ dealId, requestId, status }) {
    const row = await db.DocumentRequest.findOne({ where: { id: requestId, deal_id: dealId } });
    if (!row) throw new AppError('NOT_FOUND', 'Request not found', 404);
    await row.update({ status });
    return row;
}

// ── Data room — GATED: company side always; investor side only with an NDA grant ──
async function listDataRoom({ dealId, user }) {
    const deal = await loadDeal(dealId);
    if (!(await canViewDataRoom(deal, user))) {
        throw new AppError('LOCKED', 'Data room locked — sign the NDA to unlock', 403);
    }
    return db.DataRoomDocument.findAll({ where: { deal_id: deal.id }, order: [['created_at', 'DESC']] });
}

async function addDataRoomDocument({ dealId, data, user }) {
    await loadDeal(dealId);
    const row = await db.DataRoomDocument.create({ deal_id: dealId, ...data, uploaded_by: user?.id || 'company' });
    if (data.document_request_id) {
        const dr = await db.DocumentRequest.findByPk(data.document_request_id);
        if (dr) await dr.update({ status: 'uploaded' });
    }
    return row;
}

// ── Access grants (company controls who unlocks what) ─────────────────────────
async function listAccessGrants(dealId) {
    await loadDeal(dealId);
    return db.DocumentAccessGrant.findAll({ where: { deal_id: dealId } });
}

async function addAccessGrant({ dealId, data, user }) {
    await loadDeal(dealId);
    return db.DocumentAccessGrant.create({ deal_id: dealId, ...data, granted_by: user?.id || 'company' });
}

// ── Due diligence ─────────────────────────────────────────────────────────────
async function dueDiligence(dealId) {
    await loadDeal(dealId);
    const items = await db.DueDiligenceItem.findAll({ where: { deal_id: dealId } });
    const complete = items.filter((i) => i.status === 'complete').length;
    return { items, progress: { total: items.length, complete, pct: items.length ? Math.round((complete / items.length) * 100) : 0 } };
}

async function addDueDiligenceItem({ dealId, data }) {
    await loadDeal(dealId);
    return db.DueDiligenceItem.create({ deal_id: dealId, ...data });
}

async function updateDueDiligenceItem({ dealId, itemId, data }) {
    const row = await db.DueDiligenceItem.findOne({ where: { id: itemId, deal_id: dealId } });
    if (!row) throw new AppError('NOT_FOUND', 'Item not found', 404);
    await row.update(data);
    return row;
}

// ── Term sheets + versioning (propose / counter / accept / reject) ────────────
async function listTermSheets(dealId) {
    await loadDeal(dealId);
    const sheets = await db.TermSheet.findAll({ where: { deal_id: dealId } });
    return Promise.all(sheets.map(async (s) => ({
        ...s.toJSON(),
        versions: await db.TermSheetVersion.findAll({ where: { term_sheet_id: s.id }, order: [['version', 'ASC']] }),
    })));
}

async function createTermSheet({ dealId, data, user }) {
    const deal = await loadDeal(dealId);
    const ts = await db.TermSheet.create({ deal_id: deal.id, current_version: 1, status: 'sent' });
    const ver = await db.TermSheetVersion.create({ term_sheet_id: ts.id, version: 1, ...data, author_org_id: user.orgId, action: 'propose' });
    await deal.update({ status: 'term_sheet' });
    return { ...ts.toJSON(), versions: [ver] };
}

async function addTermSheetVersion({ dealId, termSheetId, body, user }) {
    const deal = await loadDeal(dealId);
    const ts = await db.TermSheet.findOne({ where: { id: termSheetId, deal_id: deal.id } });
    if (!ts) throw new AppError('NOT_FOUND', 'Term sheet not found', 404);
    if (['accepted', 'rejected'].includes(ts.status)) {
        throw new AppError('CONFLICT', `Term sheet already ${ts.status}`, 409);
    }
    const { action, note } = body;
    const data = action === 'counter'
        ? { amount: body.amount, equity_pct: body.equity_pct, valuation: body.valuation, board_rights_json: body.board_rights_json, investor_rights_json: body.investor_rights_json, exit_rights_json: body.exit_rights_json }
        : {};
    const nextVersion = ts.current_version + 1;
    const ver = await db.TermSheetVersion.create({ term_sheet_id: ts.id, version: nextVersion, ...data, author_org_id: user.orgId, action, note });
    const status = action === 'counter' ? 'countered' : action === 'accept' ? 'accepted' : 'rejected';
    await ts.update({ current_version: nextVersion, status });
    if (action === 'accept') await deal.update({ status: 'signing' });
    return { ...ts.toJSON(), version: ver };
}

// ── E-signature (envelope seam → aadhaar_esign / docusign / adobe_sign) ───────
async function listSignatures(dealId) {
    await loadDeal(dealId);
    return db.Signature.findAll({ where: { deal_id: dealId } });
}

async function createSignature({ dealId, data, user }) {
    await loadDeal(dealId);
    return db.Signature.create({ deal_id: dealId, ...data, signer_id: user?.id || 'signer', status: 'sent', envelope_id: `env-${Date.now()}` });
}

async function completeSignature({ dealId, signatureId }) {
    const row = await db.Signature.findOne({ where: { id: signatureId, deal_id: dealId } });
    if (!row) throw new AppError('NOT_FOUND', 'Signature not found', 404);
    await row.update({ status: 'signed', signed_at: new Date(), audit_url: `s3://baalvion-signatures/${row.envelope_id}.pdf` });
    return row;
}

// ── Escrow (orchestrates escrow-service) → cap-table issuance on release ───────
async function listEscrow(dealId) {
    await loadDeal(dealId);
    return db.EscrowTransaction.findAll({ where: { deal_id: dealId } });
}

async function createEscrow({ dealId, data }) {
    const deal = await loadDeal(dealId);
    const row = await db.EscrowTransaction.create({ deal_id: deal.id, ...data, status: 'initiated', escrow_ref: `escrow-${Date.now()}` });
    await deal.update({ status: 'funding' });
    return row;
}

async function fundEscrow({ dealId, escrowId }) {
    const esc = await db.EscrowTransaction.findOne({ where: { id: escrowId, deal_id: dealId } });
    if (!esc) throw new AppError('NOT_FOUND', 'Escrow not found', 404);
    if (esc.status !== 'initiated') throw new AppError('CONFLICT', `Escrow already ${esc.status}`, 409);
    await esc.update({ status: 'funded' });
    return esc;
}

// Release requires a staff role (compliance/admin). Funds move and ownership is issued onto
// the company's cap table from the accepted term sheet's latest equity figure.
async function releaseEscrow({ dealId, escrowId, user }) {
    if (!isStaff(user)) {
        throw new AppError('FORBIDDEN', 'Compliance/admin approval required to release escrow', 403);
    }
    const deal = await loadDeal(dealId);
    const esc = await db.EscrowTransaction.findOne({ where: { id: escrowId, deal_id: deal.id } });
    if (!esc) throw new AppError('NOT_FOUND', 'Escrow not found', 404);
    if (esc.status !== 'funded') throw new AppError('PRECONDITION_FAILED', 'Escrow must be funded before release', 412);
    await esc.update({ status: 'released' });

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
    return { escrow: esc, deal_status: 'closed', issued_ownership_pct: equity, company_id: companyId };
}

module.exports = {
    SORTABLE,
    loadDeal,
    assertDealAccess,
    isCompanySide,
    canViewDataRoom,
    create,
    list,
    updateStatus,
    listMessages,
    addMessage,
    listMembers,
    addMember,
    listNda,
    signNda,
    listDocumentRequests,
    addDocumentRequest,
    updateDocumentRequest,
    listDataRoom,
    addDataRoomDocument,
    listAccessGrants,
    addAccessGrant,
    dueDiligence,
    addDueDiligenceItem,
    updateDueDiligenceItem,
    listTermSheets,
    createTermSheet,
    addTermSheetVersion,
    listSignatures,
    createSignature,
    completeSignature,
    listEscrow,
    createEscrow,
    fundEscrow,
    releaseEscrow,
};
