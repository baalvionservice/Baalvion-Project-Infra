'use strict';
// Deal-room domain logic — the full lifecycle: open → NDA-gated data room → due diligence →
// term-sheet negotiation (versioned) → e-signature → escrow → cap-table issuance on release.
// Controllers validate + delegate; every rule and side effect lives here.
const db = require('../models');
const { AppError } = require('../utils/errors');
const { parseListQuery, paginate } = require('../utils/query');
const { isStaff } = require('../utils/authz');
const audit = require('../utils/audit');
const esign = require('../integrations/esign');
const escrowProvider = require('../integrations/escrow');
const notify = require('../integrations/notify');
const storage = require('../integrations/storage');
const { guardUpload } = require('@baalvion/upload/validate.js');

const SORTABLE = ['created_at', 'updated_at', 'status'];

// Deal lifecycle. `closed` is reachable only from `funding`, and only through releaseEscrow —
// updateStatus refuses it, so no party can mark its own deal closed.
const TRANSITIONS = {
    open: ['dd', 'negotiating', 'term_sheet', 'withdrawn'],
    dd: ['negotiating', 'term_sheet', 'withdrawn'],
    negotiating: ['dd', 'term_sheet', 'withdrawn'],
    term_sheet: ['negotiating', 'signing', 'withdrawn'],
    signing: ['term_sheet', 'funding', 'withdrawn'],
    funding: ['closed', 'withdrawn'],
    closed: [],
    withdrawn: [],
};

function assertTransition(from, to) {
    if (from === to) return;
    if (!(TRANSITIONS[from] || []).includes(to)) {
        throw new AppError('INVALID_TRANSITION', `A deal cannot move from ${from} to ${to}`, 409);
    }
}

// Every lifecycle move goes through here, so the service's own side effects obey the same
// machine the API does.
async function transition(deal, to) {
    assertTransition(deal.status, to);
    if (deal.status !== to) await deal.update({ status: to });
    return deal;
}

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
    let deal;
    try {
        deal = await loadDeal(dealId);
    } catch (err) {
        // RLS hides other parties' rows, so a stranger gets NOT_FOUND here rather than reaching
        // the membership check below. Without this the whole denial path is silent and someone
        // walking deal ids leaves no trace at all.
        if (err.code === 'NOT_FOUND') {
            audit.record({ action: 'deal.access.denied', user, dealId, outcome: 'deny', severity: 'medium', metadata: { reason: 'not_visible' } });
        }
        throw err;
    }
    if (isStaff(user)) return deal;
    const orgId = user?.orgId;
    if (orgId && (orgId === deal.org_id_company || orgId === deal.org_id_investor)) return deal;
    const member = orgId ? await db.DealMember.findOne({ where: { deal_id: deal.id, org_id: orgId } }) : null;
    if (member) return deal;
    audit.record({ action: 'deal.access.denied', user, dealId: deal.id, outcome: 'deny', severity: 'medium' });
    throw new AppError('FORBIDDEN', 'You are not a party to this deal', 403);
}

// What the caller may see in the data room, as a category scope rather than a yes/no:
//   'all'  — the company side, or a holder of an 'all' grant (what signing the NDA issues)
//   Set    — the categories they hold live grants for
//   null   — nothing; the room stays locked
// Grants have always carried a category; documents only gained one in migration 008, so before
// that this could not be anything but all-or-nothing.
async function dataRoomScope(deal, user) {
    if (isCompanySide(deal, user)) return 'all';
    if (!user?.orgId) return null;
    const { Op } = db.Sequelize;
    const grants = await db.DocumentAccessGrant.findAll({
        where: {
            deal_id: deal.id,
            grantee_org_id: user.orgId,
            [Op.or]: [{ expires_at: null }, { expires_at: { [Op.gt]: new Date() } }],
        },
    });
    if (!grants.length) return null;
    if (grants.some((g) => !g.category || g.category === 'all')) return 'all';
    return new Set(grants.map((g) => g.category));
}

async function canViewDataRoom(deal, user) {
    return (await dataRoomScope(deal, user)) !== null;
}

/**
 * Who to tell on the other side of a deal.
 *
 * Company side resolves to the founders on record; investor side to the investor's contact email.
 * Returns an empty list when we hold no address — better to send nothing than to guess one, and
 * the caller treats notification as advisory anyway.
 */
async function counterpartyEmails(deal, actingOrgId) {
    const toCompany = actingOrgId !== deal.org_id_company;
    try {
        if (toCompany) {
            const opp = deal.opportunity_id ? await db.Opportunity.findByPk(deal.opportunity_id) : null;
            if (!opp?.company_id) return [];
            const founders = await db.Founder.findAll({ where: { company_id: opp.company_id } });
            return founders.map((f) => f.email).filter(Boolean);
        }
        const investor = await db.Investor.findOne({ where: { org_id: deal.org_id_investor } });
        if (!investor) return [];
        const profile = await db.InvestorProfile.findByPk(investor.id);
        return [profile?.contact_email].filter(Boolean);
    } catch {
        return [];
    }
}

/**
 * Tell the other side something happened.
 *
 * MUST be awaited by the caller. Resolving the recipients is a DATABASE read, and every request
 * runs inside the pinned tenant transaction (middleware/tenantConnection). Firing this without
 * awaiting meant the query ran after the response had finished and the transaction had committed
 * — it threw, was swallowed by the catch, and every notification silently resolved to zero
 * recipients. Only the HTTP send inside is fire-and-forget.
 */
async function notifyCounterparty(deal, actingOrgId, templateName, data, idempotencyKey) {
    const recipients = await counterpartyEmails(deal, actingOrgId);
    for (const to of recipients) {
        notify.send({ to, templateName, data: { deal_id: deal.id, ...data }, idempotencyKey: `${idempotencyKey}:${to}` });
    }
}

// ── Lifecycle ─────────────────────────────────────────────────────────────────
async function create({ data, user }) {
    if (!user?.orgId) throw new AppError('NO_ORG', 'Your account is not linked to an organisation', 403);
    const opp = await db.Opportunity.findByPk(data.opportunity_id);
    if (!opp || opp.status !== 'live') throw new AppError('NOT_FOUND', 'Opportunity not found or no longer open', 404);
    // A round past its deadline is closed in fact even if nobody has flipped its status yet.
    if (opp.deadline && new Date(opp.deadline) < new Date(new Date().toISOString().slice(0, 10))) {
        throw new AppError('ROUND_CLOSED', 'This round has passed its deadline', 409);
    }
    // The counterparty is whoever owns the round — never the caller's word for it.
    const orgIdCompany = opp.org_id;
    if (orgIdCompany === user.orgId) throw new AppError('SELF_DEAL', 'You cannot open a deal on your own round', 409);

    // Re-expressing interest returns the existing room rather than forking the negotiation.
    const existing = await db.Deal.findOne({ where: { opportunity_id: opp.id, org_id_investor: user.orgId } });
    if (existing) return existing;

    const deal = await db.Deal.create({
        opportunity_id: opp.id,
        org_id_company: orgIdCompany,
        org_id_investor: user.orgId,
        lead_investor_id: data.lead_investor_id || null,
        status: 'open',
    });
    await db.DealMessage.create({ deal_id: deal.id, sender_id: 'system', kind: 'system', body: 'Deal opened — investor expressed interest.' });
    audit.record({ action: 'deal.opened', user, dealId: deal.id, metadata: { opportunity_id: opp.id, counterparty_org: orgIdCompany } });
    await notifyCounterparty(deal, user.orgId, 'deal-room-opened', { round: opp.title }, `deal.opened:${deal.id}`);
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

async function updateStatus({ id, status, user }) {
    const deal = await loadDeal(id);
    if (status === 'closed') {
        audit.record({ action: 'deal.status.change_denied', user, dealId: deal.id, outcome: 'deny', severity: 'high', metadata: { from: deal.status, to: status } });
        throw new AppError('FORBIDDEN', 'A deal closes only when escrow is released', 403);
    }
    const from = deal.status;
    try {
        await transition(deal, status);
    } catch (err) {
        audit.record({ action: 'deal.status.change_denied', user, dealId: deal.id, outcome: 'deny', severity: 'medium', metadata: { from, to: status } });
        throw err;
    }
    audit.record({ action: 'deal.status.changed', user, dealId: deal.id, metadata: { from, to: status } });
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
        sender_org_id: user?.orgId || null,
        body: data.body,
        attachments_json: data.attachments_json || [],
    });
}

// ── Members ─────────────────────────────────────────────────────────────────
async function listMembers(dealId) {
    await loadDeal(dealId);
    return db.DealMember.findAll({ where: { deal_id: dealId } });
}

async function addMember({ dealId, data, user }) {
    const deal = await loadDeal(dealId);
    // A member row is itself an access grant (assertDealAccess honours it). A party may bring in
    // its own people; only the company side — which owns the confidential material — or staff may
    // admit an outside org such as counsel.
    const ownOrg = !!user?.orgId && data.org_id === user.orgId;
    if (!ownOrg && !isCompanySide(deal, user) && !isStaff(user)) {
        throw new AppError('FORBIDDEN', 'You can only add members from your own organisation', 403);
    }
    const row = await db.DealMember.create({ deal_id: dealId, ...data });
    audit.record({ action: 'deal.member.added', user, dealId, resourceType: 'deal_member', resourceId: row.id, metadata: { member_org: data.org_id, role: data.role } });
    return row;
}

// ── NDA gate — signing unlocks the data room for the signer's org ─────────────
async function listNda(dealId) {
    await loadDeal(dealId);
    return db.NdaAgreement.findAll({ where: { deal_id: dealId } });
}

async function signNda({ dealId, templateId, user }) {
    const deal = await loadDeal(dealId);
    if (!user?.orgId) throw new AppError('NO_ORG', 'Your account is not linked to an organisation', 403);
    const existing = await db.NdaAgreement.findOne({ where: { deal_id: deal.id, party_org_id: user.orgId, status: 'signed' } });
    if (existing) return existing;
    const nda = await db.NdaAgreement.create({
        deal_id: deal.id,
        party_org_id: user.orgId,
        template_id: templateId || 'nda-standard-v1',
        status: 'signed',
        signed_at: new Date(),
        signature_ref: `sig-${Date.now()}`,
    });
    await db.DocumentAccessGrant.create({ deal_id: deal.id, category: 'all', grantee_org_id: user.orgId, condition: 'nda', granted_by: 'system' });
    if (deal.status === 'open') await transition(deal, 'dd');
    audit.record({ action: 'deal.nda.signed', user, dealId: deal.id, resourceType: 'nda_agreement', resourceId: nda.id, severity: 'medium' });
    return nda;
}

// ── Document requests (DD) ────────────────────────────────────────────────────
async function listDocumentRequests(dealId) {
    await loadDeal(dealId);
    return db.DocumentRequest.findAll({ where: { deal_id: dealId }, order: [['created_at', 'DESC']] });
}

async function addDocumentRequest({ dealId, data, user }) {
    const deal = await loadDeal(dealId);
    const row = await db.DocumentRequest.create({ deal_id: dealId, ...data, requested_by: user?.id || 'investor' });
    await notifyCounterparty(deal, user?.orgId, 'deal-document-requested', { title: data.title, category: data.category }, `docreq:${row.id}`);
    return row;
}

// Who may move a request depends on which way the document is travelling: the company answers it
// (`uploaded`), the side that asked signs it off (`approved`/`rejected`). Without this split the
// requester can ask for the audited accounts and then mark them approved itself, and the diligence
// record stops being evidence of anything.
const REQUEST_STATUS_ACTOR = { uploaded: 'company', approved: 'requester', rejected: 'requester' };

async function updateDocumentRequest({ dealId, requestId, status, user }) {
    const deal = await loadDeal(dealId);
    const row = await db.DocumentRequest.findOne({ where: { id: requestId, deal_id: dealId } });
    if (!row) throw new AppError('NOT_FOUND', 'Request not found', 404);
    const side = REQUEST_STATUS_ACTOR[status];
    const companySide = isCompanySide(deal, user);
    const allowed = isStaff(user)
        || (side === 'company' && companySide)
        || (side === 'requester' && !companySide)
        || (side === undefined && false); // 'requested' is set on creation only
    if (!allowed) {
        audit.record({ action: 'deal.document_request.update_denied', user, dealId, outcome: 'deny', severity: 'medium', metadata: { status } });
        throw new AppError('FORBIDDEN', `You cannot move this request to ${status}`, 403);
    }
    await row.update({ status });
    audit.record({ action: 'deal.document_request.updated', user, dealId, resourceType: 'document_request', resourceId: row.id, metadata: { status } });
    return row;
}

// ── Data room — GATED: company side always; investor side only with an NDA grant ──
async function listDataRoom({ dealId, user }) {
    const deal = await loadDeal(dealId);
    const scope = await dataRoomScope(deal, user);
    if (scope === null) {
        throw new AppError('LOCKED', 'Data room locked — sign the NDA to unlock', 403);
    }
    const where = { deal_id: deal.id };
    if (scope !== 'all') {
        // Only the categories they actually hold a grant for. Uncategorised documents stay out:
        // a NULL category cannot be shown to have been covered by a scoped grant.
        where.category = Array.from(scope);
    }
    return db.DataRoomDocument.findAll({ where, order: [['created_at', 'DESC']] });
}

async function addDataRoomDocument({ dealId, data, user }) {
    const deal = await loadDeal(dealId);
    // The data room is the COMPANY's disclosure to the investor — canViewDataRoom is built on
    // exactly that asymmetry. Letting the other side write into it means an investor could plant
    // a document and then close out its own request for it. (Investor-side material — proof of
    // funds, KYC — needs its own store; it does not belong in the company's room.)
    if (!isCompanySide(deal, user) && !isStaff(user)) {
        audit.record({ action: 'deal.document.upload_denied', user, dealId, outcome: 'deny', severity: 'high' });
        throw new AppError('FORBIDDEN', 'Only the company side can add documents to this data room', 403);
    }
    const row = await db.DataRoomDocument.create({ deal_id: dealId, ...data, uploaded_by: user?.id || 'company' });
    if (data.document_request_id) {
        // Scoped to this deal — a request id from another room must not be satisfiable from here.
        const dr = await db.DocumentRequest.findOne({ where: { id: data.document_request_id, deal_id: dealId } });
        if (dr) await dr.update({ status: 'uploaded' });
    }
    audit.record({ action: 'deal.document.uploaded', user, dealId, resourceType: 'data_room_document', resourceId: row.id, metadata: { version: row.version } });
    await notifyCounterparty(deal, user?.orgId, 'deal-document-shared', { category: data.category }, `doc:${row.id}`);
    return row;
}

/**
 * Store an uploaded document in the data room.
 *
 * The bytes pass through this service on purpose: it is the only point where they can be
 * magic-byte validated and malware scanned. `guardUpload` refuses a file whose real content does
 * not match its declared type, and — via requireScannerInProduction — refuses to accept anything
 * at all in production without a scanner configured, rather than waving it through.
 */
async function uploadDataRoomDocument({ dealId, file, data, user }) {
    const deal = await loadDeal(dealId);
    if (!isCompanySide(deal, user) && !isStaff(user)) {
        audit.record({ action: 'deal.document.upload_denied', user, dealId, outcome: 'deny', severity: 'high' });
        throw new AppError('FORBIDDEN', 'Only the company side can add documents to this data room', 403);
    }
    if (!file || !file.buffer?.length) {
        throw new AppError('NO_FILE', 'No file was uploaded', 400);
    }

    const verdict = await guardUpload(file.buffer, {
        declaredMime: file.mimetype,
        filename: file.originalname,
    });
    if (!verdict.ok) {
        audit.record({
            action: 'deal.document.upload_rejected', user, dealId, outcome: 'deny',
            severity: verdict.code === 'MALWARE_DETECTED' ? 'critical' : 'medium',
            metadata: { code: verdict.code, filename: file.originalname, declared: file.mimetype, detected: verdict.detected },
        });
        throw new AppError(verdict.code, verdict.message, verdict.status);
    }

    const key = storage.buildKey({ dealId, filename: file.originalname });
    await storage.put(key, file.buffer, file.mimetype);

    const row = await db.DataRoomDocument.create({
        deal_id: dealId,
        category: data.category || null,
        document_request_id: data.document_request_id || null,
        // Kept in sync with storage_key so older readers of file_url still resolve.
        file_url: key,
        storage_key: key,
        filename: file.originalname,
        mime: file.mimetype,
        size_bytes: file.buffer.length,
        uploaded_by: user?.id || 'company',
    });

    if (data.document_request_id) {
        const dr = await db.DocumentRequest.findOne({ where: { id: data.document_request_id, deal_id: dealId } });
        if (dr) await dr.update({ status: 'uploaded' });
    }
    audit.record({ action: 'deal.document.uploaded', user, dealId, resourceType: 'data_room_document', resourceId: row.id, metadata: { filename: file.originalname, mime: file.mimetype, size: file.buffer.length, category: data.category } });
    await notifyCounterparty(deal, user?.orgId, 'deal-document-shared', { filename: file.originalname, category: data.category }, `doc:${row.id}`);
    return row;
}

/**
 * Read a document back, permission-checked AT THE MOMENT OF THE READ.
 *
 * Deliberately not a presigned URL: one of those is a bearer link that outlives the check, so
 * revoking an NDA grant would not revoke access to a URL already handed out. Every download is
 * re-authorised against the caller's current category scope, and recorded — in a data room, who
 * opened what and when is exactly the thing you need afterwards.
 */
async function downloadDataRoomDocument({ dealId, documentId, user }) {
    const deal = await loadDeal(dealId);
    const scope = await dataRoomScope(deal, user);
    if (scope === null) {
        audit.record({ action: 'deal.document.download_denied', user, dealId, resourceId: documentId, outcome: 'deny', severity: 'high', metadata: { reason: 'no_grant' } });
        throw new AppError('LOCKED', 'Data room locked — sign the NDA to unlock', 403);
    }
    const doc = await db.DataRoomDocument.findOne({ where: { id: documentId, deal_id: dealId } });
    if (!doc) throw new AppError('NOT_FOUND', 'Document not found', 404);
    if (scope !== 'all' && !(doc.category && scope.has(doc.category))) {
        audit.record({ action: 'deal.document.download_denied', user, dealId, resourceId: documentId, outcome: 'deny', severity: 'high', metadata: { reason: 'category_not_granted', category: doc.category } });
        throw new AppError('FORBIDDEN', 'You do not have access to this category of document', 403);
    }
    if (!doc.storage_key) {
        throw new AppError('NOT_STORED', 'This record references an external file rather than a stored document', 409);
    }

    const body = await storage.get(doc.storage_key);
    audit.record({ action: 'deal.document.downloaded', user, dealId, resourceType: 'data_room_document', resourceId: doc.id, severity: 'medium', metadata: { filename: doc.filename, category: doc.category, size: doc.size_bytes } });
    return { body, filename: doc.filename || 'document', mime: doc.mime || 'application/octet-stream' };
}

// ── Access grants (company controls who unlocks what) ─────────────────────────
async function listAccessGrants(dealId) {
    await loadDeal(dealId);
    return db.DocumentAccessGrant.findAll({ where: { deal_id: dealId } });
}

async function addAccessGrant({ dealId, data, user }) {
    const deal = await loadDeal(dealId);
    // A grant is what unlocks the company's confidential documents. Without this check the
    // investor could grant its own org and walk straight past the NDA gate.
    if (!isCompanySide(deal, user) && !isStaff(user)) {
        // An attempt to self-issue a grant is an attempted NDA bypass — record it.
        audit.record({ action: 'deal.access.grant_denied', user, dealId, outcome: 'deny', severity: 'high', metadata: { grantee_org: data.grantee_org_id } });
        throw new AppError('FORBIDDEN', 'Only the company side can grant data-room access', 403);
    }
    const row = await db.DocumentAccessGrant.create({ deal_id: dealId, ...data, granted_by: user?.id || 'company' });
    audit.record({ action: 'deal.access.granted', user, dealId, resourceType: 'document_access_grant', resourceId: row.id, severity: 'medium', metadata: { grantee_org: data.grantee_org_id, category: data.category, condition: data.condition } });
    return row;
}

// ── Due diligence ─────────────────────────────────────────────────────────────
async function dueDiligence(dealId) {
    await loadDeal(dealId);
    const items = await db.DueDiligenceItem.findAll({ where: { deal_id: dealId } });
    const complete = items.filter((i) => i.status === 'complete').length;
    return { items, progress: { total: items.length, complete, pct: items.length ? Math.round((complete / items.length) * 100) : 0 } };
}

async function addDueDiligenceItem({ dealId, data, user }) {
    await loadDeal(dealId);
    const row = await db.DueDiligenceItem.create({ deal_id: dealId, ...data });
    audit.record({ action: 'deal.due_diligence.added', user, dealId, resourceType: 'due_diligence_item', resourceId: row.id, metadata: { category: data.category } });
    return row;
}

async function updateDueDiligenceItem({ dealId, itemId, data, user }) {
    const row = await db.DueDiligenceItem.findOne({ where: { id: itemId, deal_id: dealId } });
    if (!row) throw new AppError('NOT_FOUND', 'Item not found', 404);
    await row.update(data);
    audit.record({ action: 'deal.due_diligence.updated', user, dealId, resourceType: 'due_diligence_item', resourceId: row.id, metadata: data });
    return row;
}

// The round advertises a minimum ticket; a term sheet below it is not a deal the company offered.
// Enforced on every version, since a counter can walk the number down just as easily as an
// opening offer can start there.
async function assertMeetsRoundTerms(deal, amount) {
    if (amount == null || !deal.opportunity_id) return;
    const opp = await db.Opportunity.findByPk(deal.opportunity_id);
    // FAIL CLOSED. Under RLS this read can come back empty — a closed round drops out of the
    // public carve-out and is invisible to the investor's tenant. Treating "cannot read it" as
    // "no minimum applies" silently disables the rule at exactly the moment it stops being
    // checkable, so refuse instead.
    if (!opp) {
        throw new AppError('ROUND_UNAVAILABLE', 'The round backing this deal is no longer readable — terms cannot be validated', 409);
    }
    const min = opp.min_ticket != null ? Number(opp.min_ticket) : null;
    if (min != null && Number.isFinite(min) && Number(amount) < min) {
        throw new AppError('BELOW_MIN_TICKET', `This round's minimum ticket is ${min}`, 409);
    }
}

/**
 * An investor may only reach a term sheet once they are actually cleared to invest.
 *
 * `accreditation_status`, `kyc_status` and `aml_status` have existed on the investor record since
 * the schema was written and gated NOTHING — an unverified, unaccredited party could open a room,
 * unlock a data room and put terms on the table. For a private placement that is the one check
 * that has to hold.
 *
 * Deliberately checked at the TERM SHEET, not at deal creation: expressing interest and reading
 * what a company chooses to share is not the regulated act. Committing capital is.
 */
async function assertInvestorCleared(deal, user) {
    if (isStaff(user)) return;
    // Only the investor side is gated this way; the company is not investing.
    if (isCompanySide(deal, user)) return;
    const investor = await db.Investor.findOne({ where: { org_id: deal.org_id_investor } });
    if (!investor) {
        throw new AppError('NOT_ONBOARDED', 'Complete investor onboarding before proposing terms', 403);
    }
    const blocking = [];
    if (investor.accreditation_status !== 'verified') blocking.push(`accreditation is ${investor.accreditation_status || 'not started'}`);
    if (investor.kyc_status !== 'verified') blocking.push(`KYC is ${investor.kyc_status || 'not started'}`);
    if (investor.aml_status === 'hit') blocking.push('AML screening returned a hit');
    if (blocking.length) {
        audit.record({ action: 'deal.term_sheet.blocked_unverified', user, dealId: deal.id, outcome: 'deny', severity: 'high', metadata: { reasons: blocking } });
        throw new AppError('INVESTOR_NOT_CLEARED', `Cannot propose terms — ${blocking.join('; ')}.`, 403);
    }
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
    if (!user?.orgId) throw new AppError('NO_ORG', 'Your account is not linked to an organisation', 403);
    const { Op } = db.Sequelize;
    const live = await db.TermSheet.findOne({ where: { deal_id: deal.id, status: { [Op.notIn]: ['accepted', 'rejected'] } } });
    if (live) throw new AppError('CONFLICT', 'A term sheet is already on the table — counter it instead', 409);
    await assertInvestorCleared(deal, user);
    await assertMeetsRoundTerms(deal, data.amount);
    const ts = await db.TermSheet.create({ deal_id: deal.id, current_version: 1, status: 'sent' });
    const ver = await db.TermSheetVersion.create({ term_sheet_id: ts.id, version: 1, ...data, author_org_id: user.orgId, action: 'propose' });
    await transition(deal, 'term_sheet');
    audit.record({ action: 'deal.term_sheet.proposed', user, dealId: deal.id, resourceType: 'term_sheet', resourceId: ts.id, severity: 'medium', metadata: { amount: data.amount, equity_pct: data.equity_pct, valuation: data.valuation } });
    await notifyCounterparty(deal, user.orgId, 'deal-term-sheet-proposed', { amount: data.amount, equity_pct: data.equity_pct }, `ts:${ts.id}:1`);
    return { ...ts.toJSON(), versions: [ver] };
}

async function addTermSheetVersion({ dealId, termSheetId, body, user }) {
    const deal = await loadDeal(dealId);
    const ts = await db.TermSheet.findOne({ where: { id: termSheetId, deal_id: deal.id } });
    if (!ts) throw new AppError('NOT_FOUND', 'Term sheet not found', 404);
    if (['accepted', 'rejected'].includes(ts.status)) {
        throw new AppError('CONFLICT', `Term sheet already ${ts.status}`, 409);
    }
    if (!user?.orgId) throw new AppError('NO_ORG', 'Your account is not linked to an organisation', 403);
    // You answer the other side's paper, never your own — otherwise a party proposes terms and
    // accepts them in the same breath.
    const live = await db.TermSheetVersion.findOne({ where: { term_sheet_id: ts.id }, order: [['version', 'DESC']] });
    if (live && live.author_org_id === user.orgId) {
        throw new AppError('FORBIDDEN', 'The counterparty has to respond to your last version', 403);
    }
    await assertInvestorCleared(deal, user);
    if (body.action === 'counter') await assertMeetsRoundTerms(deal, body.amount);
    const { action, note } = body;
    const data = action === 'counter'
        ? { amount: body.amount, equity_pct: body.equity_pct, valuation: body.valuation, board_rights_json: body.board_rights_json, investor_rights_json: body.investor_rights_json, exit_rights_json: body.exit_rights_json }
        : {};
    const nextVersion = ts.current_version + 1;
    const ver = await db.TermSheetVersion.create({ term_sheet_id: ts.id, version: nextVersion, ...data, author_org_id: user.orgId, action, note });
    const status = action === 'counter' ? 'countered' : action === 'accept' ? 'accepted' : 'rejected';
    await ts.update({ current_version: nextVersion, status });
    if (action === 'accept') await transition(deal, 'signing');
    audit.record({ action: `deal.term_sheet.${action}ed`, user, dealId: deal.id, resourceType: 'term_sheet', resourceId: ts.id, severity: 'medium', metadata: { version: nextVersion, ...data } });
    await notifyCounterparty(deal, user.orgId, `deal-term-sheet-${action}ed`, { version: nextVersion, ...data }, `ts:${ts.id}:${nextVersion}`);
    return { ...ts.toJSON(), version: ver };
}

// ── E-signature (envelope seam → aadhaar_esign / docusign / adobe_sign) ───────
async function listSignatures(dealId) {
    await loadDeal(dealId);
    return db.Signature.findAll({ where: { deal_id: dealId } });
}

// The envelope id comes from the PROVIDER. It used to be `env-${Date.now()}`, which meant the
// row looked identical to a real signature and referred to nothing.
async function createSignature({ dealId, data, user }) {
    await loadDeal(dealId);
    const envelope = await esign.createEnvelope({
        documentType: data.document_type,
        dealId,
        signerId: user?.id,
        signerEmail: user?.email,
    });
    const row = await db.Signature.create({
        deal_id: dealId,
        document_type: data.document_type,
        provider: envelope.provider,
        signer_id: user?.id || 'signer',
        status: 'sent',
        envelope_id: envelope.envelopeId,
    });
    audit.record({ action: 'deal.signature.started', user, dealId, resourceType: 'signature', resourceId: row.id, severity: 'medium', metadata: { document_type: data.document_type, provider: envelope.provider, envelope_id: envelope.envelopeId } });
    return { ...row.toJSON(), signing_url: envelope.signingUrl };
}

/**
 * A signature is completed by the PROVIDER, never by a party clicking a button in our UI. This
 * previously flipped the row to `signed` and stamped an s3:// audit URL that pointed nowhere — a
 * meaningless mark on the document that transfers equity. It is now reachable only from the
 * provider callback, and only with the provider's own audit trail.
 */
async function completeSignatureFromProvider({ envelopeId, auditUrl, signedAt }) {
    const row = await db.Signature.findOne({ where: { envelope_id: envelopeId } });
    if (!row) throw new AppError('NOT_FOUND', 'No signature for that envelope', 404);
    if (row.status === 'signed') return row;
    if (!auditUrl) throw new AppError('NO_AUDIT_TRAIL', 'The provider supplied no audit trail for this signature', 422);
    await row.update({ status: 'signed', signed_at: signedAt ? new Date(signedAt) : new Date(), audit_url: auditUrl });
    audit.record({ action: 'deal.signature.completed', dealId: row.deal_id, resourceType: 'signature', resourceId: row.id, severity: 'high', metadata: { document_type: row.document_type, envelope_id: envelopeId, audit_url: auditUrl, source: 'provider_callback' } });
    return row;
}

// ── Escrow (orchestrates escrow-service) → cap-table issuance on release ───────
async function listEscrow(dealId) {
    await loadDeal(dealId);
    return db.EscrowTransaction.findAll({ where: { deal_id: dealId } });
}

// The economics of a closed deal come from the accepted term sheet, not from whatever the
// caller types into the escrow form. Fields are carried down from the newest version that
// set them, since accept/reject versions leave them null.
async function acceptedTerms(dealId) {
    const ts = await db.TermSheet.findOne({ where: { deal_id: dealId, status: 'accepted' } });
    if (!ts) return null;
    const versions = await db.TermSheetVersion.findAll({ where: { term_sheet_id: ts.id }, order: [['version', 'DESC']] });
    return {
        term_sheet_id: ts.id,
        amount: versions.find((v) => v.amount != null)?.amount ?? null,
        equity_pct: versions.find((v) => v.equity_pct != null)?.equity_pct ?? null,
    };
}

async function createEscrow({ dealId, data, user }) {
    const deal = await loadDeal(dealId);
    const terms = await acceptedTerms(deal.id);
    if (!terms) throw new AppError('PRECONDITION_FAILED', 'Escrow needs an accepted term sheet first', 412);
    const open = await db.EscrowTransaction.findOne({ where: { deal_id: deal.id, status: ['initiated', 'funded'] } });
    if (open) throw new AppError('CONFLICT', 'An escrow is already open on this deal', 409);
    // Derive from the accepted terms when the caller does not state an amount; when they do,
    // it must agree exactly.
    if (data.amount == null) {
        if (terms.amount == null) throw new AppError('NO_AMOUNT', 'The accepted term sheet carries no amount to escrow', 409);
        data = { ...data, amount: terms.amount };
    } else if (terms.amount != null && Number(data.amount) !== Number(terms.amount)) {
        throw new AppError('AMOUNT_MISMATCH', `Escrow must match the accepted term sheet (${terms.amount})`, 409);
    }
    // The reference comes from the escrow provider — it is what money actually moves against.
    const opened = await escrowProvider.openEscrow({
        dealId: deal.id, amount: data.amount, currency: data.currency || 'USD',
        payerOrgId: deal.org_id_investor, payeeOrgId: deal.org_id_company,
    });
    const row = await db.EscrowTransaction.create({ deal_id: deal.id, ...data, status: 'initiated', escrow_ref: opened.escrowRef });
    await transition(deal, 'funding');
    audit.record({ action: 'deal.escrow.initiated', user, dealId: deal.id, resourceType: 'escrow_transaction', resourceId: row.id, severity: 'high', metadata: { amount: row.amount, currency: row.currency, escrow_ref: row.escrow_ref } });
    return row;
}

/**
 * Marks an escrow funded. Reachable ONLY from the verified provider webhook — this used to be a
 * plain endpoint any party could call, so a deal reached `funded`, then compliance released it,
 * and equity was issued onto the cap table against money that never arrived.
 */
async function confirmEscrowFunding({ escrowRef, amount }) {
    const esc = await db.EscrowTransaction.findOne({ where: { escrow_ref: escrowRef } });
    if (!esc) throw new AppError('NOT_FOUND', 'No escrow for that reference', 404);
    if (esc.status === 'funded' || esc.status === 'released') return esc;
    if (esc.status !== 'initiated') throw new AppError('CONFLICT', `Escrow is ${esc.status}`, 409);
    // The provider must confirm the full amount. A part-funded escrow is not a funded one, and
    // releasing it would issue full ownership for partial money.
    if (amount != null && Number(amount) < Number(esc.amount)) {
        throw new AppError('UNDERFUNDED', `Provider confirmed ${amount} against ${esc.amount} — escrow stays unfunded`, 409);
    }
    await esc.update({ status: 'funded' });
    audit.record({ action: 'deal.escrow.funded', dealId: esc.deal_id, resourceType: 'escrow_transaction', resourceId: esc.id, severity: 'high', metadata: { amount: esc.amount, currency: esc.currency, escrow_ref: escrowRef, source: 'provider_webhook' } });
    return esc;
}

// Issuing new equity DILUTES everyone already on the register — the new investor's percentage
// comes out of the existing holders, it is not added alongside them. Writing only the new row
// (what this did before) leaves a register whose percentages exceed 100 after the second round.
//
// Post-money: every existing holder is scaled by (1 - newPct/100), then the new holder is added
// at newPct. Percentages are this register's unit; `shares` is only rescaled where the register
// already tracks it, so we never invent a share count with no basis.
async function issueOwnership({ companyId, deal, escrow, equityPct }) {
    const pct = Number(equityPct);
    const holderId = String(deal.org_id_investor);
    if (!Number.isFinite(pct) || pct <= 0 || pct >= 100) {
        // Nothing defensible to issue — record the event so the gap is visible rather than
        // silently writing a bad row.
        await db.CapTableEvent.create({
            company_id: companyId, deal_id: deal.id, event: 'issue',
            delta_json: { investor_org: holderId, amount: escrow.amount, ownership_pct: equityPct, warning: 'no usable equity_pct on the accepted term sheet — no entry written' },
        });
        return null;
    }

    const existing = await db.CapTableEntry.findAll({ where: { company_id: companyId } });
    const retained = (100 - pct) / 100;
    const before = existing.reduce((t, r) => t + Number(r.ownership_pct || 0), 0);

    for (const row of existing) {
        const update = { ownership_pct: Number((Number(row.ownership_pct || 0) * retained).toFixed(4)) };
        if (row.shares != null) update.shares = Number((Number(row.shares) * retained).toFixed(4));
        await row.update(update);
    }

    const entry = await db.CapTableEntry.create({
        company_id: companyId, holder_type: 'investor', holder_id: holderId,
        security_type: 'preferred', ownership_pct: Number(pct.toFixed(4)),
    });

    const after = (await db.CapTableEntry.findAll({ where: { company_id: companyId } }))
        .reduce((t, r) => t + Number(r.ownership_pct || 0), 0);

    await db.CapTableEvent.create({
        company_id: companyId, deal_id: deal.id, event: 'issue',
        delta_json: {
            investor_org: holderId, amount: escrow.amount, ownership_pct: pct,
            dilution_factor: Number(retained.toFixed(6)), holders_diluted: existing.length,
            total_pct_before: Number(before.toFixed(4)), total_pct_after: Number(after.toFixed(4)),
        },
    });
    return { entry_id: entry.id, holders_diluted: existing.length, total_pct_after: Number(after.toFixed(4)) };
}

// Release requires a staff role (compliance/admin). Funds move and ownership is issued onto
// the company's cap table from the accepted term sheet's latest equity figure.
async function releaseEscrow({ dealId, escrowId, user }) {
    if (!isStaff(user)) {
        audit.record({ action: 'deal.escrow.release_denied', user, dealId, outcome: 'deny', severity: 'high' });
        throw new AppError('FORBIDDEN', 'Compliance/admin approval required to release escrow', 403);
    }
    const deal = await loadDeal(dealId);
    const esc = await db.EscrowTransaction.findOne({ where: { id: escrowId, deal_id: deal.id } });
    if (!esc) throw new AppError('NOT_FOUND', 'Escrow not found', 404);
    if (esc.status !== 'funded') throw new AppError('PRECONDITION_FAILED', 'Escrow must be funded before release', 412);
    // Instruct the provider FIRST. Recording a release we never asked for would leave the ledger
    // claiming the money moved while it sat in escrow.
    await escrowProvider.releaseEscrow({ escrowRef: esc.escrow_ref });
    await esc.update({ status: 'released' });

    const opp = deal.opportunity_id ? await db.Opportunity.findByPk(deal.opportunity_id) : null;
    const companyId = opp?.company_id;
    const equity = (await acceptedTerms(deal.id))?.equity_pct ?? null;
    let dilution = null;
    if (companyId) dilution = await issueOwnership({ companyId, deal, escrow: esc, equityPct: equity });
    await transition(deal, 'closed');
    if (opp) await opp.update({ status: 'closed' });
    audit.record({ action: 'deal.escrow.released', user, dealId: deal.id, resourceType: 'escrow_transaction', resourceId: esc.id, severity: 'critical', metadata: { amount: esc.amount, currency: esc.currency, company_id: companyId, issued_ownership_pct: equity, investor_org: deal.org_id_investor } });
    return { escrow: esc, deal_status: 'closed', issued_ownership_pct: equity, company_id: companyId, dilution };
}

module.exports = {
    SORTABLE,
    TRANSITIONS,
    assertTransition,
    transition,
    acceptedTerms,
    assertMeetsRoundTerms,
    assertInvestorCleared,
    issueOwnership,
    loadDeal,
    assertDealAccess,
    isCompanySide,
    canViewDataRoom,
    counterpartyEmails,
    dataRoomScope,
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
    uploadDataRoomDocument,
    downloadDataRoomDocument,
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
    completeSignatureFromProvider,
    listEscrow,
    createEscrow,
    confirmEscrowFunding,
    releaseEscrow,
};
