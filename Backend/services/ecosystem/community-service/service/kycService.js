'use strict';
// One-time identity verification ("KYC once"). Documents are stored AES-256-GCM encrypted,
// only platform admins can open them (every open is logged), and they are purged after the
// retention window once a decision is made. Approved status is what the order gate trusts.
const { Op } = require('sequelize');
const db = require('../models');
const crypto = require('../utils/kycCrypto');
const { AppError } = require('../utils/errors');
const { parseDataUrl } = require('../validators/kyc');
const events = require('./notifyEvents');

const VALIDITY_MONTHS = Number(process.env.KYC_VALIDITY_MONTHS || 24);
const PAGE_MAX = 200;

const toCase = (r, { admin = false } = {}) => ({
    id: r.id, status: r.status, fullName: r.full_name, nationality: r.nationality, idType: r.id_type,
    idNumberLast4: r.id_number_last4, submittedAt: r.createdAt, reviewedAt: r.reviewed_at,
    expiresAt: r.expires_at, rejectionReason: r.rejection_reason, documentsPurged: !!r.documents_purged_at,
    ...(admin ? { userId: r.user_id, dateOfBirth: r.date_of_birth, label: r.email_label } : {}),
});

function requireConfigured() {
    if (!crypto.isConfigured()) throw new AppError('KYC_UNAVAILABLE', 'Identity verification is not available right now', 503);
}

// Lazily flips an elapsed approval to expired so every reader sees one truth.
async function refreshExpiry(row) {
    if (row && row.status === 'approved' && row.expires_at && new Date(row.expires_at) < new Date()) {
        await row.update({ status: 'expired' });
    }
    return row;
}

async function getMine(userId) {
    const row = await refreshExpiry(await db.KycVerification.findOne({ where: { user_id: userId } }));
    return row ? toCase(row) : null;
}

async function submit(userId, label, data) {
    requireConfigured();
    const existing = await refreshExpiry(await db.KycVerification.findOne({ where: { user_id: userId } }));
    if (existing && (existing.status === 'approved' || existing.status === 'submitted')) {
        throw new AppError('CONFLICT', existing.status === 'approved' ? 'You are already verified' : 'Your verification is already under review', 409);
    }
    const id = parseDataUrl(data.idDocument);
    const selfie = parseDataUrl(data.selfie);
    const fields = {
        email_label: label, full_name: data.fullName, date_of_birth: data.dateOfBirth, nationality: data.nationality,
        id_type: data.idType, id_number_last4: data.idNumberLast4.toUpperCase(), status: 'submitted',
        rejection_reason: null, reviewed_by: null, reviewed_at: null, expires_at: null, documents_purged_at: null,
    };

    return db.sequelize.transaction(async (t) => {
        const row = existing
            ? await existing.update(fields, { transaction: t })
            : await db.KycVerification.create({ ...fields, user_id: userId }, { transaction: t });
        await db.KycDocument.destroy({ where: { verification_id: row.id }, transaction: t });
        for (const [kind, file] of [['id', id], ['selfie', selfie]]) {
            const enc = crypto.encrypt(file.bytes);
            await db.KycDocument.create({
                verification_id: row.id, kind, mime: file.mime, size_bytes: file.bytes.length,
                iv: enc.iv, auth_tag: enc.authTag, ciphertext: enc.ciphertext,
            }, { transaction: t });
        }
        return row;
    }).then((row) => {
        events.kycSubmitted(row);
        return toCase(row);
    });
}

// ── Gate lookup (server-to-server) ───────────────────────────────────────────
async function statusForUser(userId) {
    const row = await refreshExpiry(await db.KycVerification.findOne({ where: { user_id: userId } }));
    const approved = !!row && row.status === 'approved';
    return { approved, status: row ? row.status : 'none', expiresAt: approved ? row.expires_at : null };
}

// ── Admin ────────────────────────────────────────────────────────────────────
async function adminList({ status, limit, offset }) {
    const where = status ? { status } : {};
    const { rows, count } = await db.KycVerification.findAndCountAll({
        where, order: [['created_at', 'ASC']], limit: Math.min(Number(limit) || 50, PAGE_MAX), offset: Number(offset) || 0,
    });
    return { items: rows.map((r) => toCase(r, { admin: true })), total: count };
}

async function adminDocument(adminId, id, kind) {
    requireConfigured();
    const doc = await db.KycDocument.findOne({ where: { verification_id: id, kind } });
    if (!doc) throw new AppError('NOT_FOUND', 'Document not found (it may have been purged)', 404);
    await db.KycAccessLog.create({ verification_id: id, admin_id: adminId, action: kind === 'id' ? 'view_id' : 'view_selfie' });
    return { mime: doc.mime, bytes: crypto.decrypt({ iv: doc.iv, authTag: doc.auth_tag, ciphertext: doc.ciphertext }) };
}

async function adminDecide(adminId, id, { status, reason }) {
    const row = await db.KycVerification.findByPk(id);
    if (!row) throw new AppError('NOT_FOUND', 'Case not found', 404);
    if (row.status !== 'submitted') throw new AppError('CONFLICT', 'This case has already been decided', 409);
    const expires = new Date();
    expires.setMonth(expires.getMonth() + VALIDITY_MONTHS);
    await row.update({
        status, rejection_reason: status === 'rejected' ? reason : null, reviewed_by: adminId, reviewed_at: new Date(),
        expires_at: status === 'approved' ? expires : null,
    });
    await db.KycAccessLog.create({ verification_id: id, admin_id: adminId, action: status === 'approved' ? 'approve' : 'reject' });
    events.kycDecided(row);
    return toCase(row, { admin: true });
}

// Run on a schedule (see scripts/purge-kyc-documents.js): drops ciphertext for decided cases
// older than the retention window. The case row and decision stay as the audit trail.
async function purgeDecidedDocuments(retentionDays) {
    const cutoff = new Date(Date.now() - retentionDays * 86400000);
    const stale = await db.KycVerification.findAll({
        where: { status: { [Op.in]: ['approved', 'rejected', 'expired'] }, reviewed_at: { [Op.lt]: cutoff }, documents_purged_at: null },
        attributes: ['id'],
    });
    for (const v of stale) {
        await db.KycDocument.destroy({ where: { verification_id: v.id } });
        await db.KycVerification.update({ documents_purged_at: new Date() }, { where: { id: v.id } });
    }
    return stale.length;
}

module.exports = { getMine, submit, statusForUser, adminList, adminDocument, adminDecide, purgeDecidedDocuments };
