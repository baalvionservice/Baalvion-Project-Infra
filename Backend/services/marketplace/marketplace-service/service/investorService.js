'use strict';
// Investor domain logic — onboarding (AML + KYC), profile/preferences, accreditation.
const db = require('../models');
const config = require('../config/appConfig');
const { AppError } = require('../utils/errors');
const { parseListQuery, paginate } = require('../utils/query');
const { assertOwnerOrStaff } = require('../utils/authz');
const { screenAml, submitKyc } = require('../integrations/compliance');

const SORTABLE = ['created_at', 'updated_at', 'legal_name', 'type', 'status', 'country'];

async function list({ orgId, query }) {
    const { order, limit, offset, page } = parseListQuery(query, { sortable: SORTABLE });
    const where = { org_id: orgId };
    if (query.status) where.status = query.status;
    if (query.type) where.type = query.type;
    const { count, rows } = await db.Investor.findAndCountAll({ where, order, limit, offset });
    return paginate({ rows, count, page, limit });
}

// The investor record carries compliance state (KYC/AML/accreditation) — tenant-private, so
// only the owning org or staff may read it.
async function getById({ id, user }) {
    const row = await db.Investor.findByPk(id);
    if (!row) throw new AppError('NOT_FOUND', 'Investor not found', 404);
    assertOwnerOrStaff(row.org_id, user);
    return row;
}

// Onboarding — runs AML screening immediately and submits KYC.
async function create({ data, user }) {
    const org_id = user?.orgId || config.defaultOrgId;
    const aml = await screenAml({ legalName: data.legal_name, country: data.country });
    const kyc = await submitKyc({ subjectType: 'investor', subjectId: 'pending' });
    const row = await db.Investor.create({
        ...data,
        org_id,
        created_by: user?.id || 'self',
        status: 'submitted',
        aml_status: aml.status === 'clear' ? 'clear' : 'review',
        kyc_status: kyc,
    });
    return { investor: row, aml };
}

async function update({ id, data, user }) {
    const row = await db.Investor.findByPk(id);
    if (!row) throw new AppError('NOT_FOUND', 'Investor not found', 404);
    assertOwnerOrStaff(row.org_id, user);
    await row.update(data);
    return row;
}

async function remove({ id, user }) {
    const row = await db.Investor.findByPk(id);
    if (!row) throw new AppError('NOT_FOUND', 'Investor not found', 404);
    assertOwnerOrStaff(row.org_id, user);
    await row.update({ status: 'suspended' });
    return { id: row.id, status: 'suspended' };
}

async function upsertProfile({ id, data, user }) {
    const investor = await db.Investor.findByPk(id);
    if (!investor) throw new AppError('NOT_FOUND', 'Investor not found', 404);
    assertOwnerOrStaff(investor.org_id, user);
    const [row] = await db.InvestorProfile.upsert({ investor_id: id, ...data, updated_at: new Date() });
    return row;
}

async function upsertPreferences({ id, data, user }) {
    const investor = await db.Investor.findByPk(id);
    if (!investor) throw new AppError('NOT_FOUND', 'Investor not found', 404);
    assertOwnerOrStaff(investor.org_id, user);
    const [row] = await db.InvestmentPreference.upsert({ investor_id: id, ...data });
    return row;
}

async function submitAccreditation({ id, user }) {
    const investor = await db.Investor.findByPk(id);
    if (!investor) throw new AppError('NOT_FOUND', 'Investor not found', 404);
    assertOwnerOrStaff(investor.org_id, user);
    await investor.update({ accreditation_status: 'in_review' });
    return investor;
}

module.exports = {
    SORTABLE,
    list,
    getById,
    create,
    update,
    remove,
    upsertProfile,
    upsertPreferences,
    submitAccreditation,
};
