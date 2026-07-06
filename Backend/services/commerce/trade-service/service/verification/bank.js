'use strict';
// Bank Verification business logic (Phase 2, Step 5). Owns the 'bank' checklist
// category recompute + envelope encryption of the raw account number (reusing the
// same AES-256-GCM helper the Document Management engine uses).
const crypto = require('crypto');
const db = require('../../models');
const encryption = require('../../lib/encryption');
const config = require('../../config/appConfig');
const checklist = require('./checklist');
const fraud = require('./fraud');

async function recomputeBank(orgId, tenantId) {
    const rows = await db.BankAccount.findAll({ where: { org_id: orgId } });
    return checklist.recomputeCategory({ orgId, tenantId, category: 'bank', childStatuses: rows.map((r) => r.status) });
}

// Deterministic fingerprint for duplicate-account detection (Step 11 Fraud
// Detection) — a fresh random IV means the AES-256-GCM ciphertext itself never
// matches across rows, so it can't be used to find duplicates.
function fingerprintAccountNumber(accountNumber) {
    const key = config.documents.encryptionKey || 'dev-fraud-fingerprint-key';
    return crypto.createHmac('sha256', key).update(String(accountNumber)).digest('hex');
}

function sealAccountNumber(accountNumber) {
    const sealed = encryption.encrypt(Buffer.from(String(accountNumber), 'utf8'));
    return {
        account_number_ciphertext: sealed.ciphertext.toString('base64'),
        account_number_iv: sealed.iv,
        account_number_tag: sealed.tag,
        account_number_algo: sealed.algo,
        account_number_fingerprint: fingerprintAccountNumber(accountNumber),
        account_number_last4: String(accountNumber).slice(-4),
    };
}

async function addBankAccount({ orgId, tenantId, bankName, accountHolderName, accountNumber, swiftBic = null, iban = null, ifsc = null, currency = null, isPrimary = false, documentId = null, actor }) {
    return db.sequelize.transaction(async (t) => {
        if (isPrimary) {
            await db.BankAccount.update({ is_primary: false }, { where: { org_id: orgId, is_primary: true }, transaction: t });
        }
        const record = await db.BankAccount.create({
            tenant_id: tenantId, org_id: orgId, bank_name: bankName, account_holder_name: accountHolderName,
            ...sealAccountNumber(accountNumber), swift_bic: swiftBic, iban, ifsc, currency,
            is_primary: isPrimary, document_id: documentId, status: 'submitted', created_by: actor,
        }, { transaction: t });
        return record;
    }).then(async (record) => {
        fraud.checkDuplicateBankAccount(orgId, tenantId, record.account_number_fingerprint).catch((err) => console.error('[fraud] checkDuplicateBankAccount failed:', err.message));
        await recomputeBank(orgId, tenantId);
        return record;
    });
}

async function reviewBankAccount({ record, decision, reviewedBy, rejectionReason = null }) {
    await record.update({
        status: decision, reviewed_by: reviewedBy, reviewed_at: new Date(),
        verified_at: decision === 'approved' ? new Date() : null,
        rejection_reason: decision === 'rejected' ? rejectionReason : null, updated_by: reviewedBy,
    });
    await recomputeBank(record.org_id, record.tenant_id);
    return record;
}

async function removeBankAccount(record) {
    const { org_id: orgId, tenant_id: tenantId } = record;
    await record.destroy();
    await recomputeBank(orgId, tenantId);
}

module.exports = { recomputeBank, addBankAccount, reviewBankAccount, removeBankAccount };
