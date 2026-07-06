'use strict';
/**
 * Bank Verification — HTTP surface (Phase 2 Trust/Verification/Compliance
 * Foundation, Step 5). The raw account number is accepted once on submit and never
 * echoed back — `sealedView` strips the ciphertext explicitly on every response,
 * since Sequelize's defaultScope attribute exclusion only applies to SELECTs, not
 * to the in-memory instance `.create()` returns.
 */
const db = require('../models');
const { sendSuccess, sendPaginated } = require('../utils/response');
const { AppError } = require('../utils/errors');
const { recordAudit } = require('../utils/audit');
const { isAdmin, fetchOrgOwned, callerTenantId, actorOf } = require('../service/verification/access');
const bankSvc = require('../service/verification/bank');
const { BankAccount } = db;

function sealedView(record) {
    const j = record.toJSON ? record.toJSON() : record;
    const { account_number_ciphertext, account_number_iv, account_number_tag, ...safe } = j;
    return safe;
}

async function fetchOwned(id, req, next) {
    const record = await BankAccount.findByPk(id);
    if (!record) { next(new AppError('NOT_FOUND', 'Bank account not found', 404)); return null; }
    if (isAdmin(req)) return record;
    const tenantId = callerTenantId(req);
    if (tenantId && record.tenant_id && record.tenant_id !== tenantId) {
        next(new AppError('NOT_FOUND', 'Bank account not found', 404)); return null;
    }
    return record;
}

const createBankAccount = async (req, res, next) => {
    try {
        const {
            org_id, bank_name, account_holder_name, account_number, swift_bic = null,
            iban = null, ifsc = null, currency = null, is_primary = false, document_id = null,
        } = req.body || {};
        const orgId = Number(org_id);
        const org = await fetchOrgOwned(orgId, req, next);
        if (!org) return undefined;

        if (!bank_name || !account_holder_name || !account_number) {
            return next(new AppError('VALIDATION_ERROR', '`bank_name`, `account_holder_name` and `account_number` are required', 422));
        }

        const record = await bankSvc.addBankAccount({
            orgId, tenantId: org.tenant_id, bankName: bank_name, accountHolderName: account_holder_name,
            accountNumber: account_number, swiftBic: swift_bic, iban, ifsc, currency,
            isPrimary: Boolean(is_primary), documentId: document_id, actor: actorOf(req),
        });

        await recordAudit({
            actorId: actorOf(req), action: 'bank_account.submitted', resourceType: 'bank_account',
            resourceId: record.id, tenantId: org.tenant_id, metadata: { orgId, last4: record.account_number_last4 },
        });

        return sendSuccess(req, res, sealedView(record), 201);
    } catch (err) {
        return next(err);
    }
};

const listBankAccounts = async (req, res, next) => {
    try {
        const { org_id, page = 1, limit = 20 } = req.query;
        if (!org_id) return next(new AppError('VALIDATION_ERROR', '`org_id` query param is required', 422));
        const orgId = Number(org_id);
        const org = await fetchOrgOwned(orgId, req, next);
        if (!org) return undefined;

        const offset = (Number(page) - 1) * Number(limit);
        const { count, rows } = await BankAccount.findAndCountAll({
            where: { org_id: orgId }, limit: Number(limit), offset, order: [['created_at', 'DESC']],
        });
        return sendPaginated(req, res, { items: rows.map(sealedView), total: count, page: Number(page), limit: Number(limit) });
    } catch (err) {
        return next(err);
    }
};

async function reviewDecision(req, res, next, decision) {
    if (!isAdmin(req)) return next(new AppError('FORBIDDEN', 'Admin or reviewer role required', 403));
    const record = await BankAccount.findByPk(req.params.id);
    if (!record) return next(new AppError('NOT_FOUND', 'Bank account not found', 404));
    const { rejection_reason = null } = req.body || {};
    await bankSvc.reviewBankAccount({ record, decision, reviewedBy: actorOf(req), rejectionReason: rejection_reason });
    await recordAudit({
        actorId: actorOf(req), action: `bank_account.${decision}`, resourceType: 'bank_account',
        resourceId: record.id, tenantId: record.tenant_id, metadata: { rejectionReason: rejection_reason },
    });
    return sendSuccess(req, res, sealedView(record));
}
const approveBankAccount = (req, res, next) => reviewDecision(req, res, next, 'approved').catch(next);
const rejectBankAccount = (req, res, next) => reviewDecision(req, res, next, 'rejected').catch(next);

const deleteBankAccount = async (req, res, next) => {
    try {
        const record = await fetchOwned(req.params.id, req, next);
        if (!record) return undefined;
        await bankSvc.removeBankAccount(record);
        await recordAudit({
            actorId: actorOf(req), action: 'bank_account.removed', resourceType: 'bank_account',
            resourceId: record.id, tenantId: record.tenant_id, metadata: {},
        });
        return sendSuccess(req, res, { id: record.id, deleted: true });
    } catch (err) {
        return next(err);
    }
};

module.exports = { createBankAccount, listBankAccounts, approveBankAccount, rejectBankAccount, deleteBankAccount };
