'use strict';
// Luxury-resale core: consignment intake → quote → authentication → certificate of authenticity.
// Ownership of a request follows the SAME owner/guest-session/staff policy as orders & returns
// (see service/ownership.js). Money/quote fields are platform-set on admin transitions only —
// a seller never dictates payout. Certificate codes + integrity hashes are server-generated.
const crypto = require('crypto');
const { Op } = require('sequelize');
const {
    ConsignmentSellerProfile,
    ConsignmentRequest,
    ConsignmentItem,
    ItemAuthentication,
    CertificateOfAuthenticity,
    ItemOwnershipRecord,
    sequelize,
} = require('../models');
const { AppError } = require('../utils/errors');
const { parsePagination, buildPaginated } = require('../utils/pagination');
const ownership = require('./ownership');
const { putObject } = require('@baalvion/upload');

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

// Render a certificate of authenticity to PDF. Same lazy-require guard as report-service's PDF
// export, so a missing install degrades to NOT_IMPLEMENTED instead of a hard crash.
function renderCertificatePdf(cert) {
    let PDFDocument;
    try { PDFDocument = require('pdfkit'); }
    catch { throw new AppError('NOT_IMPLEMENTED', 'Certificate PDF generation requires the optional "pdfkit" dependency (pnpm add pdfkit)', 501); }

    return new Promise((resolve, reject) => {
        try {
            const doc = new PDFDocument({ size: 'A4', margin: 50 });
            const chunks = [];
            doc.on('data', (d) => chunks.push(d));
            doc.on('end', () => resolve(Buffer.concat(chunks)));
            doc.on('error', reject);

            doc.fontSize(20).text('Certificate of Authenticity', { align: 'center' });
            doc.moveDown(0.3);
            doc.fontSize(10).fillColor('#666').text(cert.code, { align: 'center' }).fillColor('#000');
            doc.moveDown(2);

            const row = (label, value) => {
                if (!value) return;
                doc.fontSize(10).fillColor('#666').text(label, 50, doc.y, { continued: false });
                doc.fontSize(13).fillColor('#000').text(String(value));
                doc.moveDown(0.8);
            };
            row('Brand', cert.brand);
            row('Model', cert.model);
            row('Serial number', cert.serialNumber);
            row('Condition grade', cert.conditionGrade);
            row('Issued by', cert.issuerName);
            row('Issued on', cert.issuedAt ? new Date(cert.issuedAt).toISOString().slice(0, 10) : null);

            doc.moveDown(1.5);
            doc.fontSize(9).fillColor('#999').text(`Verification hash: ${cert.verificationHash || ''}`, { align: 'center' });
            doc.text('Verify this certificate using the code above at the certificate verification page.', { align: 'center' });

            doc.end();
        } catch (err) { reject(err); }
    });
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

        const createdItems = await ConsignmentItem.bulkCreate(items.map((i) => ({
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

        // First chain-of-custody event: the seller's own submission. This is the start of the
        // item's tracked provenance on the platform — everything before this is self-reported by
        // the seller in the item description, not a verified ownership record.
        const submissionLabel = contactName || contactEmail;
        await ItemOwnershipRecord.bulkCreate(createdItems.map((item) => ({
            storeId,
            consignmentItemId: item.id,
            eventType: 'consignor_submission',
            ownerLabel: submissionLabel,
            eventDate: new Date(),
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

// Owner-or-guest-or-staff: the full authenticity timeline for one item — ownership/custody events,
// the authentication decision, and certificate issuance, merged into a single chronological feed.
// This is the "product authenticity timeline" surfaced on the storefront; nothing here is
// fabricated — every entry traces to a real row (ItemOwnershipRecord / ItemAuthentication /
// CertificateOfAuthenticity), so an item with no authentication yet simply has fewer entries.
async function getItemTimeline(storeId, requestId, itemId, actor) {
    const req = await ConsignmentRequest.findOne({ where: { id: requestId, storeId }, attributes: ['id', 'userId', 'ownerSessionId'] });
    if (!req) throw new AppError('NOT_FOUND', 'Consignment request not found', 404);
    await ownership.enforce(actor, req.userId, { resourceType: 'consignment', resourceId: requestId, storeId, action: 'timeline.read', ownerSessionId: req.ownerSessionId });

    const item = await ConsignmentItem.findOne({ where: { id: itemId, consignmentRequestId: requestId } });
    if (!item) throw new AppError('NOT_FOUND', 'Consignment item not found', 404);

    const [ownershipRecords, authentications, certificates] = await Promise.all([
        ItemOwnershipRecord.findAll({ where: { storeId, consignmentItemId: itemId }, order: [['eventDate', 'ASC']] }),
        ItemAuthentication.findAll({ where: { storeId, consignmentItemId: itemId } }),
        CertificateOfAuthenticity.findAll({ where: { storeId, consignmentItemId: itemId } }),
    ]);

    const events = [
        ...ownershipRecords.map((r) => ({
            type: r.eventType, date: r.eventDate || r.createdAt, label: r.ownerLabel, location: r.location, notes: r.notes,
        })),
        ...authentications.filter((a) => a.status === 'authenticated' || a.status === 'rejected').map((a) => ({
            type: `authentication_${a.status}`, date: a.decidedAt || a.updatedAt, label: a.authenticatorName, confidence: a.confidence, notes: a.findings,
        })),
        ...certificates.filter((c) => c.status === 'valid').map((c) => ({
            type: 'certificate_issued', date: c.issuedAt, label: c.issuerName, code: c.code, certificateId: c.id,
        })),
    ].sort((a, b) => new Date(a.date || 0).getTime() - new Date(b.date || 0).getTime());

    return { itemId, events };
}

// Ops-only: record a chain-of-custody event that isn't already auto-generated (e.g. a verified
// prior-owner declaration, or the item leaving custody on sale/return). Auto-generated events
// ('consignor_submission', 'platform_custody') are never accepted here — those are system-derived.
const MANUAL_OWNERSHIP_EVENT_TYPES = ['prior_ownership', 'sold', 'returned'];
async function addOwnershipRecord(storeId, requestId, itemId, body, userId) {
    const item = await ConsignmentItem.findOne({ where: { id: itemId, consignmentRequestId: requestId } });
    if (!item) throw new AppError('NOT_FOUND', 'Consignment item not found', 404);
    const req = await ConsignmentRequest.findOne({ where: { id: requestId, storeId }, attributes: ['id'] });
    if (!req) throw new AppError('NOT_FOUND', 'Consignment request not found', 404);
    if (!MANUAL_OWNERSHIP_EVENT_TYPES.includes(body.eventType)) {
        throw new AppError('VALIDATION_ERROR', `eventType must be one of ${MANUAL_OWNERSHIP_EVENT_TYPES.join(', ')}`, 400);
    }

    const record = await ItemOwnershipRecord.create({
        storeId,
        consignmentItemId: itemId,
        eventType: body.eventType,
        ownerLabel: body.ownerLabel || null,
        eventDate: body.eventDate ? new Date(body.eventDate) : new Date(),
        location: body.location || null,
        notes: body.notes || null,
        recordedBy: userId,
    });
    return record.toJSON();
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

    // Second chain-of-custody event: the item physically arrives in the Maison's care. Best-effort —
    // the status transition itself already succeeded above, so a custody-log hiccup must not fail it.
    if (status === 'received') {
        try {
            const items = await ConsignmentItem.findAll({ where: { consignmentRequestId: id }, attributes: ['id'] });
            await ItemOwnershipRecord.bulkCreate(items.map((item) => ({
                storeId,
                consignmentItemId: item.id,
                eventType: 'platform_custody',
                ownerLabel: 'Amarisé Maison Avenue',
                eventDate: new Date(),
            })));
        } catch (err) {
            console.error(JSON.stringify({ evt: 'consignment.custody_record_failed', storeId, requestId: id, error: err.message }));
        }
    }

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

    // Render + store the downloadable PDF. Best-effort: issuance already succeeded (the cert row
    // + verification code exist), so a rendering/storage hiccup here must not fail the request —
    // it just leaves pdfUrl null until a retry (getCertificateForDownload surfaces that as 404).
    try {
        const pdf = await renderCertificatePdf(cert);
        const key = `certificates/${storeId}/${itemId}/${cert.code}.pdf`;
        await putObject(key, pdf, 'application/pdf');
        await cert.update({ pdfUrl: key });
    } catch (err) {
        console.error(JSON.stringify({ evt: 'certificate.pdf_generation_failed', storeId, certificateId: cert.id, error: err.message }));
    }

    return cert.toJSON();
}

// Customer-facing: certificates for items the AUTHENTICATED user consigned (their own submission
// history — see getCertificateForDownload's note on why this is seller/consignor-scoped, not
// buyer-scoped). No guest-session variant: certificate issuance always follows an admin/ops review
// of a submitted consignment, so a "mine" list only makes sense for a signed-in seller.
async function listMyCertificates(storeId, userId) {
    if (userId == null) return [];
    const certs = await CertificateOfAuthenticity.findAll({
        where: { storeId },
        include: [
            {
                model: ConsignmentItem, as: 'item', required: true,
                include: [{ model: ConsignmentRequest, as: 'request', required: true, where: { userId, storeId } }],
            },
            { model: ItemAuthentication, as: 'authentication', required: false },
        ],
        order: [['issuedAt', 'DESC']],
    });
    return certs.map((c) => c.toJSON());
}

// Owner(consignor)/guest/staff: fetch a certificate's PDF S3 key for download (IDOR-safe via
// ownership.enforce). Ownership follows the SELLER who consigned the item — certificates are
// currently only linked to the consigning request, not to whoever may later buy the listed item.
async function getCertificateForDownload(storeId, certId, actor) {
    const cert = await CertificateOfAuthenticity.findOne({ where: { id: certId, storeId } });
    if (!cert) throw new AppError('NOT_FOUND', 'Certificate not found', 404);
    const item = await ConsignmentItem.findOne({ where: { id: cert.consignmentItemId } });
    if (!item) throw new AppError('NOT_FOUND', 'Certificate not found', 404);
    const req = await ConsignmentRequest.findOne({ where: { id: item.consignmentRequestId, storeId } });
    if (!req) throw new AppError('NOT_FOUND', 'Certificate not found', 404);

    await ownership.enforce(actor, req.userId, { resourceType: 'certificate', resourceId: certId, storeId, action: 'certificate.read', ownerSessionId: req.ownerSessionId });
    if (!cert.pdfUrl) throw new AppError('NOT_FOUND', 'Certificate PDF not yet available', 404);
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
    getItemTimeline,
    addOwnershipRecord,
    listConsignments,
    updateConsignmentStatus,
    recordAuthentication,
    issueCertificate,
    verifyCertificate,
    listMyCertificates,
    getCertificateForDownload,
    getSellerProfile,
    upsertSellerProfile,
    CONSIGNMENT_TRANSITIONS,
    certificateHash,
    // Exported for unit tests.
    _internal: { generateReference, generateCertificateCode },
};
