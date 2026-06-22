'use strict';
// Company domain logic. Controllers stay thin: they validate, call these functions, and shape
// the response. All persistence, business rules and authorization live here.
const db = require('../models');
const config = require('../config/appConfig');
const { AppError } = require('../utils/errors');
const { parseListQuery, paginate } = require('../utils/query');
const { assertOwnerOrStaff } = require('../utils/authz');
const { submitKyc } = require('../integrations/compliance');

const SORTABLE = ['created_at', 'updated_at', 'legal_name', 'stage', 'status', 'country'];

async function list({ orgId, query }) {
    const { order, limit, offset, page } = parseListQuery(query, { sortable: SORTABLE });
    const where = { org_id: orgId };
    if (query.status) where.status = query.status;
    if (query.stage) where.stage = query.stage;
    const { count, rows } = await db.Company.findAndCountAll({ where, order, limit, offset });
    return paginate({ rows, count, page, limit });
}

async function getById(id) {
    const row = await db.Company.findByPk(id);
    if (!row) throw new AppError('NOT_FOUND', 'Company not found', 404);
    const [profile, founders] = await Promise.all([
        db.CompanyProfile.findByPk(id),
        db.Founder.findAll({ where: { company_id: id } }),
    ]);
    return { ...row.toJSON(), profile, founders };
}

async function create({ data, user }) {
    const org_id = user?.orgId || config.defaultOrgId;
    return db.Company.create({ ...data, org_id, created_by: user?.id || 'self' });
}

async function update({ id, data, user }) {
    const row = await db.Company.findByPk(id);
    if (!row) throw new AppError('NOT_FOUND', 'Company not found', 404);
    assertOwnerOrStaff(row.org_id, user);
    await row.update(data);
    return row;
}

// Soft-delete / archive — preserves the record and its FK-linked history (opportunities,
// cap table) instead of cascade-deleting it. Returns the new state.
async function remove({ id, user }) {
    const row = await db.Company.findByPk(id);
    if (!row) throw new AppError('NOT_FOUND', 'Company not found', 404);
    assertOwnerOrStaff(row.org_id, user);
    await row.update({ status: 'suspended' });
    return { id: row.id, status: 'suspended' };
}

async function upsertProfile({ id, data, user }) {
    const company = await db.Company.findByPk(id);
    if (!company) throw new AppError('NOT_FOUND', 'Company not found', 404);
    assertOwnerOrStaff(company.org_id, user);
    const [row] = await db.CompanyProfile.upsert({ company_id: id, ...data, updated_at: new Date() });
    return row;
}

async function addFounder({ id, data, user }) {
    const company = await db.Company.findByPk(id);
    if (!company) throw new AppError('NOT_FOUND', 'Company not found', 404);
    assertOwnerOrStaff(company.org_id, user);
    return db.Founder.create({ ...data, company_id: id });
}

async function addDocument({ id, data, user }) {
    const company = await db.Company.findByPk(id);
    if (!company) throw new AppError('NOT_FOUND', 'Company not found', 404);
    assertOwnerOrStaff(company.org_id, user);
    return db.CompanyDocument.create({ ...data, company_id: id, uploaded_by: user?.id || 'self' });
}

async function capTable(id) {
    const [entries, events] = await Promise.all([
        db.CapTableEntry.findAll({ where: { company_id: id }, order: [['as_of', 'DESC']] }),
        db.CapTableEvent.findAll({ where: { company_id: id }, order: [['effective_at', 'DESC']] }),
    ]);
    return { entries, events };
}

// Submit for compliance/admin approval — triggers KYC. Only a draft/rejected record may submit.
async function submit({ id }) {
    const company = await db.Company.findByPk(id);
    if (!company) throw new AppError('NOT_FOUND', 'Company not found', 404);
    if (company.status !== 'draft' && company.status !== 'rejected') {
        throw new AppError('CONFLICT', `Company already ${company.status}`, 409);
    }
    const kyc = await submitKyc({ subjectType: 'company', subjectId: company.id });
    await company.update({ status: 'submitted', kyc_status: kyc });
    return company;
}

module.exports = {
    SORTABLE,
    list,
    getById,
    create,
    update,
    remove,
    upsertProfile,
    addFounder,
    addDocument,
    capTable,
    submit,
};
