'use strict';
// Luxury-resale core: consignment intake → quote → authentication → certificate of authenticity.
// Ownership of a request follows the SAME owner/guest-session/staff policy as orders & returns
// (see service/ownership.js). Money/quote fields are platform-set on admin transitions only —
// a seller never dictates payout. Certificate codes + integrity hashes are server-generated.
const crypto = require('crypto');
const {
    ConsignmentSellerProfile,
    ConsignmentRequest,
    ConsignmentItem,
    ItemAuthentication,
    CertificateOfAuthenticity,
    sequelize,
} = require('../models');
const { AppError } = require('../utils/errors');
const { parsePagination, buildPaginated } = require('../utils/pagination');
const ownership = require('./ownership');

// ──────────────────────────── reference / code generation ────────────────────────────
// Public-facing identifiers. Base36 of the epoch + a short random suffix keeps them short, unguessable
// enough for a reference, and collision-safe in practice (the unique index is the real guard).
function rand(n) { return crypto.randomBytes(n).toString('hex').slice(0, n).toUpperCase(); }
function generateReference() { return `CSN-${Date.now().toString(36).toUpperCase()}-${rand(4)}`; }
function generateCertificateCode() { return `COA-${Date.now().toString(36).toUpperCase()}-${rand(4)}`; }

// Canonical integrity hash over the public certificate fields. Verifiable later to detect tampering.
function certificateHash({ code, serialNumber, brand, model, conditionGrade, storeId }) {
    const canonical = JSON.stringify({ code, serialNumber: serialNumber || null, brand: brand || null, model: model || null, conditionGrade: conditionGrade || null, storeId });
    return crypto.createHash('sha256').update(canonical).digest('hex');
}

// ──────────────────────────── seller profiles ────────────────────────────
// Resolve (and upsert) the seller profile for a submission. Registered sellers are keyed by
// (storeId,userId); guests by (storeId,email). totalConsignments is bumped on each submission.
async function upsertSellerProfileForSubmission(storeId, { userId, email, displayName, phone }, t) {
    const where = userId != null ? { storeId, userId } : { storeId, email, userId: null };
    let profile = await ConsignmentSellerProfile.findOne({ where, transaction: t });
    if (!profile) {
        profile = await ConsignmentSellerProfile.create(
            { storeId, userId: userId ?? null, email, displayName: displayName || null, phone: phone || null, status: 'active', totalConsignments: 1 },
            { transaction: t },
        );
        return profile;
    }
    await profile.update({ totalConsignments: (profile.totalConsignments || 0) + 1 }, { transaction: t });
    return profile;
}

async function getSellerProfile(storeId, userId) {
    if (userId == null) return null;
    const profile = await ConsignmentSellerProfile.findOne({ where: { storeId, userId } });
    return profile ? profile.toJSON() : null;
}

// Self-service profile upsert (authenticated seller). Money totals are platform-owned and not
// accepted here. email defaults to the existing/contact value if omitted.
async function upsertSellerProfile(storeId, userId, body = {}) {
    if (userId == null) throw new AppError('UNAUTHORIZED', 'Authentication required', 401);
    let profile = await ConsignmentSellerProfile.findOne({ where: { storeId, userId } });
    if (!profile) {
        if (!body.email) throw new AppError('VALIDATION_ERROR', 'email is required to create a seller profile', 400);
        profile = await ConsignmentSellerProfile.create({
            storeId, userId, email: body.email,
            displayName: body.displayName || null, phone: body.phone || null,
            payoutMethod: body.payoutMethod || null, payoutDetails: body.payoutDetails || null,
            status: 'active',
        });
        return profile.toJSON();
    }
    const updates = {};
    for (const f of ['displayName', 'phone', 'payoutMethod', 'payoutDetails']) {
        if (body[f] !== undefined) updates[f] = body[f];
    }
    if (body.email !== undefined && body.email) updates.email = body.email;
    await profile.update(updates);
    return profile.toJSON();
}

// ──────────────────────────── submission ────────────────────────────
async function submitConsignment(storeId, body, actor) {
    const { contactEmail, contactName, contactPhone, notes, items } = body;
    if (!Array.isArray(items) || items.length === 0) {
        throw new AppError('VALIDATION_ERROR', 'At least one item is required', 400);
    }
    // Bind ownership: authenticated user OR signed guest session (mirrors guest orders/carts).
    const userId = actor && actor.userId != null ? actor.userId : null;
    const ownerSessionId = actor && actor.sessionId != null ? actor.sessionId : null;

    const request = await sequelize.transaction(async (t) => {
        const profile = await upsertSellerProfileForSubmission(storeId, { userId, email: contactEmail, displayName: contactName, phone: contactPhone }, t);
        const req = await ConsignmentRequest.create({
            storeId,
            sellerProfileId: profile.id,
            userId,
            contactEmail,
            contactName: contactName || null,
            contactPhone: contactPhone || null,
            reference: generateReference(),
            status: 'submitted',
            notes: notes || null,
            metadata: {},
            ownerSessionId,
            submittedAt: new Date(),
        }, { transaction: t });

        await ConsignmentItem.bulkCreate(items.map((i) => ({
            consignmentRequestId: req.id,
            brand: i.brand,
            model: i.model || null,
            category: i.category || null,
            color: i.color || null,
            material: i.material || null,
            conditionGrade: i.conditionGrade || null,
            askingPrice: i.askingPrice != null ? i.askingPrice : null,
            currency: i.currency || null,
            description: i.description || null,
            photoUrls: Array.isArray(i.photoUrls) ? i.photoUrls : [],
            accessories: Array.isArray(i.accessories) ? i.accessories : [],
            serialNumber: i.serialNumber || null,
        })), { transaction: t });

        return req;
    });

    return loadRequest(storeId, request.id);
}

// Load a request with its items (plain JSON). Used by create/get/transition responses.
async function loadRequest(storeId, id) {
    const req = await ConsignmentRequest.findOne({
        where: { id, storeId },
        include: [{ model: ConsignmentItem, as: 'items' }],
    });
    return req ? req.toJSON() : null;
}

// ──────────────────────────── reads ────────────────────────────
// Customer-facing "my consignments": scoped by the authenticated userId. Guests (no userId) get an
// empty page — there is no list-by-session here (a request is fetched directly by id + session).
async function listMyConsignments(storeId, userId, query = {}) {
    const { page, limit, offset } = parsePagination(query);
    if (userId == null) return buildPaginated([], 0, { page, limit });
    const where = { storeId, userId };
    if (query.status) where.status = query.status;
    const { rows, count } = await ConsignmentRequest.findAndCountAll({
        where, limit, offset, order: [['createdAt', 'DESC']],
        include: [{ model: ConsignmentItem, as: 'items' }],
    });
    return buildPaginated(rows.map((r) => r.toJSON()), count, { page, limit });
}

// Owner-or-guest-or-staff read of a single request (IDOR-safe via ownership.enforce).
async function getConsignment(storeId, id, actor) {
    const req = await ConsignmentRequest.findOne({
        where: { id, storeId },
        include: [{ model: ConsignmentItem, as: 'items' }],
    });
    if (!req) throw new AppError('NOT_FOUND', 'Consignment request not found', 404);
    await ownership.enforce(actor, req.userId, { resourceType: 'consignment', resourceId: id, storeId, action: 'consignment.read', ownerSessionId: req.ownerSessionId });
    return req.toJSON();
}

// Admin list (cross-customer, store-scoped). Filterable by status.
async function listConsignments(storeId, query = {}) {
    const { page, limit, offset } = parsePagination(query);
    const where = { storeId };
    if (query.status) where.status = query.status;
    const { rows, count } = await ConsignmentRequest.findAndCountAll({
        where, limit, offset, order: [['createdAt', 'DESC']],
        include: [{ model: ConsignmentItem, as: 'items' }],
    });
    return buildPaginated(rows.map((r) => r.toJSON()), count, { page, limit });
}

// ──────────────────────────── status machine ────────────────────────────
// Forward-only intake lifecycle (mirrors returnService.RETURN_TRANSITIONS). rejected/sold/withdrawn
// are terminal. Any jump not listed is a 409.
const CONSIGNMENT_TRANSITIONS = {
    submitted: ['quoted', 'rejected', 'withdrawn'],
    quoted: ['accepted', 'rejected', 'withdrawn'],
    accepted: ['received', 'withdrawn'],
    received: ['authenticating'],
    authenticating: ['authenticated', 'rejected'],
    authenticated: ['listed'],
    listed: ['sold'],
    rejected: [],
    sold: [],
    withdrawn: [],
};

async function updateConsignmentStatus(storeId, id, body, userId) {
    const { status } = body;
    const req = await ConsignmentRequest.findOne({ where: { id, storeId } });
    if (!req) throw new AppError('NOT_FOUND', 'Consignment request not found', 404);

    const allowed = CONSIGNMENT_TRANSITIONS[req.status] || [];
    if (!allowed.includes(status)) {
        throw new AppError('CONFLICT', `Cannot transition consignment from ${req.status} to ${status}`, 409);
    }

    const updates = { status, processedBy: userId, processedAt: new Date() };
    // Platform-set fields that may accompany the relevant transitions. The seller never sets these.
    if (body.quoteAmount !== undefined) updates.quoteAmount = body.quoteAmount;
    if (body.quoteCurrency !== undefined) updates.quoteCurrency = body.quoteCurrency;
    if (body.payoutType !== undefined) updates.payoutType = body.payoutType;
    if (body.commissionRate !== undefined) updates.commissionRate = body.commissionRate;
    if (body.reviewerNotes !== undefined) updates.reviewerNotes = body.reviewerNotes;
    if (body.listedProductId !== undefined) updates.listedProductId = body.listedProductId;

    await req.update(updates);
    return loadRequest(storeId, id);
}

// ──────────────────────────── authentication ────────────────────────────
// Record (or update) an item's authentication outcome. One authentication row per item — re-running
// updates the existing row. On a terminal decision (authenticated/rejected) stamp decidedAt + author.
async function recordAuthentication(storeId, requestId, itemId, body, userId) {
    const item = await ConsignmentItem.findOne({ where: { id: itemId, consignmentRequestId: requestId } });
    if (!item) throw new AppError('NOT_FOUND', 'Consignment item not found', 404);
    // Confirm the parent request belongs to this store (defense in depth — item has no storeId).
    const req = await ConsignmentRequest.findOne({ where: { id: requestId, storeId }, attributes: ['id'] });
    if (!req) throw new AppError('NOT_FOUND', 'Consignment request not found', 404);

    const isDecision = body.status === 'authenticated' || body.status === 'rejected';
    let auth = await ItemAuthentication.findOne({ where: { consignmentItemId: itemId, storeId } });
    const fields = {
        consignmentItemId: itemId,
        consignmentRequestId: requestId,
        storeId,
        status: body.status,
        authenticatorName: body.authenticatorName || null,
        method: body.method || null,
        findings: body.findings || null,
        confidence: body.confidence || null,
        photoUrls: Array.isArray(body.photoUrls) ? body.photoUrls : [],
        authenticatorId: isDecision ? userId : null,
        decidedAt: isDecision ? new Date() : null,
    };
    if (!auth) {
        auth = await ItemAuthentication.create(fields);
    } else {
        await auth.update(fields);
    }
    return auth.toJSON();
}

// ──────────────────────────── certificate ────────────────────────────
// Issue a certificate of authenticity. REQUIRES the item to have passed authentication. Generates a
// public verification code + a sha256 integrity hash over canonical fields. Idempotent-ish: a fresh
// certificate row is created each time, but a revoked/duplicate prior cert does not block issuance.
async function issueCertificate(storeId, requestId, itemId, body, userId) {
    const item = await ConsignmentItem.findOne({ where: { id: itemId, consignmentRequestId: requestId } });
    if (!item) throw new AppError('NOT_FOUND', 'Consignment item not found', 404);
    const req = await ConsignmentRequest.findOne({ where: { id: requestId, storeId }, attributes: ['id'] });
    if (!req) throw new AppError('NOT_FOUND', 'Consignment request not found', 404);

    const auth = await ItemAuthentication.findOne({ where: { consignmentItemId: itemId, storeId } });
    if (!auth || auth.status !== 'authenticated') {
        throw new AppError('CONFLICT', 'Item must be authenticated before a certificate can be issued', 409);
    }

    const code = generateCertificateCode();
    const serialNumber = body.serialNumber || item.serialNumber || null;
    const conditionGrade = item.conditionGrade || null;
    const verificationHash = certificateHash({ code, serialNumber, brand: item.brand, model: item.model, conditionGrade, storeId });

    const cert = await CertificateOfAuthenticity.create({
        consignmentItemId: itemId,
        itemAuthenticationId: auth.id,
        storeId,
        productId: body.productId || null,
        code,
        serialNumber,
        brand: item.brand,
        model: item.model || null,
        conditionGrade,
        issuedBy: userId,
        issuerName: body.issuerName || (auth.authenticatorName || null),
        issuedAt: new Date(),
        status: 'valid',
        verificationHash,
    });
    return cert.toJSON();
}

// ──────────────────────────── public verification ────────────────────────────
// PUBLIC endpoint — no auth. Returns only safe display fields and a recomputed-hash integrity check.
// Never leaks internal ids, seller info, request linkage, or the raw verification hash.
async function verifyCertificate(storeId, code) {
    const cert = await CertificateOfAuthenticity.findOne({ where: { storeId, code } });
    if (!cert) return { valid: false };
    if (cert.status !== 'valid') {
        return { valid: false, status: cert.status };
    }
    // Tamper check: the stored hash must match a fresh hash of the current canonical fields.
    const expected = certificateHash({ code: cert.code, serialNumber: cert.serialNumber, brand: cert.brand, model: cert.model, conditionGrade: cert.conditionGrade, storeId });
    if (cert.verificationHash && cert.verificationHash !== expected) {
        return { valid: false };
    }
    return {
        valid: true,
        certificate: {
            code: cert.code,
            brand: cert.brand,
            model: cert.model,
            conditionGrade: cert.conditionGrade,
            serialNumber: cert.serialNumber,
            issuerName: cert.issuerName,
            issuedAt: cert.issuedAt,
            status: cert.status,
        },
    };
}

module.exports = {
    submitConsignment,
    listMyConsignments,
    getConsignment,
    listConsignments,
    updateConsignmentStatus,
    recordAuthentication,
    issueCertificate,
    verifyCertificate,
    getSellerProfile,
    upsertSellerProfile,
    CONSIGNMENT_TRANSITIONS,
    certificateHash,
    // Exported for unit tests.
    _internal: { generateReference, generateCertificateCode },
};
