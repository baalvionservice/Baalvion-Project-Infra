'use strict';
// Fraud Detection business logic (Phase 2, Step 11). Detection never blocks the
// underlying business action — a failure here is logged, not thrown, mirroring
// utils/audit.js's recordAudit contract. Duplicate checks are triggered from the
// write paths of tax/bank/company/identity verification; excessive-failed-logins
// and suspicious-document scans are run by the Continuous Monitoring job (Step 19)
// or on demand via POST /v1/fraud_signals/scan.
const db = require('../../models');
const { runAs } = require('../../middleware/tenantContext');

const FAILED_LOGIN_THRESHOLD = 5;

// Duplicate-detection is inherently cross-tenant (that's the whole point — catching
// the same tax ID/bank account/identity reused under a *different* tenant), but
// every tenant-carrying model is auto-scoped to the caller's tenant by the hooks in
// models/index.js. runAs({ bypass: true }, ...) is the same escape hatch system
// jobs/seeds use to intentionally look across tenants for this one lookup.
const crossTenant = (fn) => runAs({ bypass: true }, fn);

async function raiseSignal({ orgId = null, userId = null, tenantId = 'T-DEMO', signalType, severity = 'medium', details = {} }) {
    try {
        const [signal] = await db.FraudSignal.findOrCreate({
            where: { org_id: orgId, signal_type: signalType, status: 'open' },
            defaults: { tenant_id: tenantId, org_id: orgId, user_id: userId, signal_type: signalType, severity, details },
        });
        return signal;
    } catch (err) {
        // eslint-disable-next-line no-console
        console.error('[fraud] raiseSignal failed:', err.message);
        return null;
    }
}

async function resolveSignal(orgId, signalType) {
    await db.FraudSignal.update({ status: 'dismissed' }, { where: { org_id: orgId, signal_type: signalType, status: 'open' } });
}

async function checkDuplicateTaxId(orgId, tenantId, taxIdTypeId, taxIdValue) {
    const dup = await crossTenant(() => db.TaxRegistration.findOne({ where: { tax_id_type_id: taxIdTypeId, tax_id_value: taxIdValue, org_id: { [db.Sequelize.Op.ne]: orgId } } }));
    if (dup) {
        await raiseSignal({ orgId, tenantId, signalType: 'duplicate_tax_id', severity: 'high', details: { taxIdTypeId, matchedOrgId: dup.org_id } });
    }
    return Boolean(dup);
}

async function checkDuplicateBankAccount(orgId, tenantId, fingerprint) {
    if (!fingerprint) return false;
    const dup = await crossTenant(() => db.BankAccount.unscoped().findOne({ where: { account_number_fingerprint: fingerprint, org_id: { [db.Sequelize.Op.ne]: orgId } } }));
    if (dup) {
        await raiseSignal({ orgId, tenantId, signalType: 'duplicate_bank_account', severity: 'high', details: { matchedOrgId: dup.org_id } });
    }
    return Boolean(dup);
}

async function checkDuplicateCompany(orgId, tenantId, registrationNumber) {
    if (!registrationNumber) return false;
    const dup = await crossTenant(() => db.CompanyVerification.findOne({ where: { registration_number: registrationNumber, org_id: { [db.Sequelize.Op.ne]: orgId } } }));
    if (dup) {
        await raiseSignal({ orgId, tenantId, signalType: 'duplicate_company', severity: 'high', details: { registrationNumber, matchedOrgId: dup.org_id } });
    }
    return Boolean(dup);
}

async function checkMultiAccountSameIdentity(userId, tenantId, orgId, { fullName, dateOfBirth, nationality }) {
    if (!fullName) return false;
    const where = { full_name: fullName, user_id: { [db.Sequelize.Op.ne]: userId } };
    if (dateOfBirth) where.date_of_birth = dateOfBirth;
    if (nationality) where.nationality = nationality;
    const dup = await crossTenant(() => db.IdentityVerification.findOne({ where }));
    if (dup) {
        await raiseSignal({ orgId, userId, tenantId, signalType: 'multi_account_same_identity', severity: 'critical', details: { matchedUserId: dup.user_id } });
    }
    return Boolean(dup);
}

async function checkExcessiveFailedLogins(user) {
    if (!user || user.failed_login_attempts < FAILED_LOGIN_THRESHOLD) return false;
    await raiseSignal({ userId: user.id, tenantId: user.tenant_id, signalType: 'excessive_failed_logins', severity: 'high', details: { failedAttempts: user.failed_login_attempts } });
    return true;
}

async function scanSuspiciousDocuments(orgId, tenantId, documentIds) {
    if (!documentIds.length) return false;
    const quarantined = await db.TradeDocument.findAll({ where: { id: documentIds, status: 'quarantined' } });
    if (quarantined.length) {
        await raiseSignal({ orgId, tenantId, signalType: 'suspicious_document', severity: 'critical', details: { documentIds: quarantined.map((d) => d.id) } });
    }
    return quarantined.length > 0;
}

module.exports = {
    FAILED_LOGIN_THRESHOLD, raiseSignal, resolveSignal, checkDuplicateTaxId, checkDuplicateBankAccount,
    checkDuplicateCompany, checkMultiAccountSameIdentity, checkExcessiveFailedLogins, scanSuspiciousDocuments,
};
