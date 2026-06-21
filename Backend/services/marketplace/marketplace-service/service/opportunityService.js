'use strict';
// Opportunity domain logic — public discovery, publishing lifecycle, AI recommendations.
const db = require('../models');
const { AppError } = require('../utils/errors');
const { parseListQuery, paginate } = require('../utils/query');
const { assertOwnerOrStaff } = require('../utils/authz');
const { recommendForInvestor } = require('../modules/matching/service');

const SORTABLE = ['published_at', 'created_at', 'updated_at', 'title', 'amount_sought', 'min_ticket', 'deadline'];

// Public discovery — only live, public rounds, filterable by round + company facets.
async function listPublic({ query }) {
    const { order, limit, offset, page } = parseListQuery(query, {
        sortable: SORTABLE,
        defaultSort: ['published_at', 'DESC'],
    });

    const where = { status: 'live', visibility: 'public' };
    if (query.round) where.round = query.round;
    if (query.max_min_ticket) where.min_ticket = { [db.Sequelize.Op.lte]: Number(query.max_min_ticket) };

    const companyWhere = {};
    if (query.industry) companyWhere.industry_code = query.industry;
    if (query.stage) companyWhere.stage = query.stage;
    if (query.country) companyWhere.country = query.country;

    const { count, rows } = await db.Opportunity.findAndCountAll({
        where,
        include: [{
            model: db.Company,
            as: 'company',
            required: true,
            where: Object.keys(companyWhere).length ? companyWhere : undefined,
        }],
        order,
        limit,
        offset,
        distinct: true,
    });
    return paginate({ rows, count, page, limit });
}

async function getById(id) {
    const row = await db.Opportunity.findByPk(id, { include: [{ model: db.Company, as: 'company' }] });
    if (!row) throw new AppError('NOT_FOUND', 'Opportunity not found', 404);
    return row;
}

// Company publishes a round (created as a draft). Only the owning org (or staff) may create a
// round for a company.
async function create({ data, user }) {
    const company = await db.Company.findByPk(data.company_id);
    if (!company) throw new AppError('NOT_FOUND', 'Company not found', 404);
    assertOwnerOrStaff(company.org_id, user);
    return db.Opportunity.create({ ...data, org_id: company.org_id, status: 'draft' });
}

async function update({ id, data, user }) {
    const opp = await db.Opportunity.findByPk(id);
    if (!opp) throw new AppError('NOT_FOUND', 'Opportunity not found', 404);
    assertOwnerOrStaff(opp.org_id, user);
    if (opp.status !== 'draft') {
        throw new AppError('CONFLICT', 'Only a draft opportunity can be edited; unpublish or close it first', 409);
    }
    await opp.update(data);
    return opp;
}

// Delete a draft outright; archive a live/closed round by closing it (keeps deal history).
async function remove({ id, user }) {
    const opp = await db.Opportunity.findByPk(id);
    if (!opp) throw new AppError('NOT_FOUND', 'Opportunity not found', 404);
    assertOwnerOrStaff(opp.org_id, user);
    if (opp.status === 'draft') {
        await opp.destroy();
        return { id, deleted: true };
    }
    await opp.update({ status: 'closed' });
    return { id, status: 'closed' };
}

// Go live — only the owning org (or staff), and only once the company is approved.
async function publish({ id, user }) {
    const opp = await db.Opportunity.findByPk(id);
    if (!opp) throw new AppError('NOT_FOUND', 'Opportunity not found', 404);
    assertOwnerOrStaff(opp.org_id, user);
    const company = await db.Company.findByPk(opp.company_id);
    if (!company || company.status !== 'approved') {
        throw new AppError('PRECONDITION_FAILED', 'Company must be approved before publishing', 412);
    }
    await opp.update({ status: 'live', published_at: new Date() });
    return opp;
}

// AI-recommended opportunities for an investor (resolves investor from org when not given).
async function recommended({ investorId, orgId, limit }) {
    let id = investorId;
    if (!id) {
        const inv = await db.Investor.findOne({ where: { org_id: orgId } });
        id = inv?.id;
    }
    if (!id) return { items: [], note: 'No investor profile for caller — pass ?investorId' };
    return recommendForInvestor(id, { limit: limit || 20 });
}

module.exports = { SORTABLE, listPublic, getById, create, update, remove, publish, recommended };
