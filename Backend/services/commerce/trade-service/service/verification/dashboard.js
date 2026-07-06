'use strict';
// Compliance Dashboard business logic (Phase 2, Step 16). Read-only aggregation
// across the modules already built — no new tables, mirrors the pattern of the
// existing generic dashboardController (Trade Operations, Prompt 3).
const db = require('../../models');

const REVIEWABLE_MODELS = {
    identity: db.IdentityVerification, company: db.CompanyVerification, stakeholder: db.CompanyStakeholder,
    tax: db.TaxRegistration, bank: db.BankAccount, address: db.VerifiedAddress, facility: db.Facility,
    product_certificate: db.ProductCertificate,
};

async function pendingVerifications() {
    const rows = await db.VerificationChecklistItem.findAll({
        attributes: ['category', 'status', [db.sequelize.fn('COUNT', db.sequelize.col('id')), 'count']],
        where: { status: ['submitted', 'under_review'] },
        group: ['category', 'status'],
        raw: true,
    });
    const total = rows.reduce((sum, r) => sum + Number(r.count), 0);
    return { total, by_category: rows };
}

async function expiredItemCount() {
    return db.VerificationChecklistItem.count({ where: { status: 'expired' } });
}

async function highRiskOrganizations() {
    const rows = await db.OrgRiskAssessment.findAll({ where: { is_current: true, risk_level: ['high', 'critical'] }, order: [['score', 'DESC']], limit: 20 });
    const counts = await db.OrgRiskAssessment.findAll({
        attributes: ['risk_level', [db.sequelize.fn('COUNT', db.sequelize.col('id')), 'count']],
        where: { is_current: true }, group: ['risk_level'], raw: true,
    });
    return { by_level: counts, top: rows };
}

async function fraudAlerts() {
    const openCount = await db.FraudSignal.count({ where: { status: 'open' } });
    const reviewingCount = await db.FraudSignal.count({ where: { status: 'reviewing' } });
    const bySeverity = await db.FraudSignal.findAll({
        attributes: ['severity', [db.sequelize.fn('COUNT', db.sequelize.col('id')), 'count']],
        where: { status: ['open', 'reviewing'] }, group: ['severity'], raw: true,
    });
    return { open: openCount, reviewing: reviewingCount, by_severity: bySeverity };
}

/** Average hours between submission and review decision, across every reviewable module. */
async function averageTurnaroundHours() {
    const durations = [];
    for (const model of Object.values(REVIEWABLE_MODELS)) {
        const rows = await model.findAll({ where: { reviewed_at: { [db.Sequelize.Op.ne]: null } }, attributes: ['createdAt', 'reviewed_at'] });
        rows.forEach((r) => durations.push((new Date(r.reviewed_at) - new Date(r.createdAt)) / 3600000));
    }
    if (!durations.length) return null;
    return Number((durations.reduce((sum, d) => sum + d, 0) / durations.length).toFixed(2));
}

async function countryStats() {
    const rows = await db.Organization.findAll({
        attributes: ['country', [db.sequelize.fn('COUNT', db.sequelize.col('id')), 'total_orgs'],
            [db.sequelize.fn('SUM', db.sequelize.literal('CASE WHEN verified_badge THEN 1 ELSE 0 END')), 'verified_orgs']],
        where: { country: { [db.Sequelize.Op.ne]: null } },
        group: ['country'],
        raw: true,
    });
    return rows.map((r) => ({
        country: r.country,
        total_orgs: Number(r.total_orgs),
        verified_orgs: Number(r.verified_orgs),
        verification_rate: Number(r.total_orgs) ? Number((Number(r.verified_orgs) / Number(r.total_orgs)).toFixed(2)) : 0,
    }));
}

async function getDashboard() {
    const [pending, expired, risk, fraud, turnaroundHours, countries] = await Promise.all([
        pendingVerifications(), expiredItemCount(), highRiskOrganizations(), fraudAlerts(), averageTurnaroundHours(), countryStats(),
    ]);
    return {
        pending_verifications: pending,
        expired_items: expired,
        high_risk_organizations: risk,
        fraud_alerts: fraud,
        average_turnaround_hours: turnaroundHours,
        country_stats: countries,
        generated_at: new Date().toISOString(),
    };
}

module.exports = { getDashboard, pendingVerifications, expiredItemCount, highRiskOrganizations, fraudAlerts, averageTurnaroundHours, countryStats };
