'use strict';
/**
 * Clearance Stage Ledger — party visibility (Clearance Compression).
 *
 * The ledger records WHOSE time a clearance stage burned, so it is exactly the
 * kind of record a counterparty is entitled to see on their own trade — and
 * exactly the kind they must not see on anyone else's. Tenant isolation alone
 * doesn't express that: a buyer and a seller can share a tenant, and a party's
 * org code is not the same identifier as the gateway tenant id.
 *
 * So this module resolves a ledger subject back to its trade operation and
 * defers the actual yes/no to the SAME policy the trade operations dashboard
 * uses (service/dashboard/rbac.js). One rule, two call sites.
 *
 * Fail-closed throughout: a subject with no resolvable operation is visible
 * only to tenant-wide roles (admin / logistics / bank).
 */
const { Op } = require('sequelize');
const db = require('../../models');
const rbac = require('../dashboard/rbac');

/**
 * The trade operation a ledger subject belongs to, or null when the subject is
 * missing, orphaned, or outside the caller's tenant (the model hooks scope the
 * lookups, so a cross-tenant id simply reads as "not found").
 */
async function operationForSubject({ subjectType, subjectId } = {}) {
    if (!subjectId) return null;

    if (subjectType === 'trade_operation') {
        return db.TradeOperation.findByPk(subjectId);
    }
    if (subjectType === 'shipment') {
        const shipment = await db.TradeShipment.findByPk(subjectId, {
            include: [{ model: db.TradeOperation, as: 'tradeOperation' }],
        });
        return (shipment && shipment.tradeOperation) || null;
    }
    if (subjectType === 'consignment') {
        const consignment = await db.Consignment.findByPk(subjectId, {
            include: [{ model: db.TradeOperation, as: 'tradeOperation' }],
        });
        return (consignment && consignment.tradeOperation) || null;
    }
    return null;
}

/**
 * Whether the caller may see (or drive) this subject's clearance clock.
 * Tenant-wide roles short-circuit before the extra query.
 */
async function isSubjectInScope(subject, access, partyOrgIds = []) {
    if (access && access.scope === 'all') return true;
    const operation = await operationForSubject(subject);
    return rbac.isOperationInScope(operation, access, partyOrgIds);
}

/**
 * The subject ids a party may aggregate over in the bottleneck view: every trade
 * operation it is a party to, plus the shipments and consignments hanging off
 * them (the ledger's subject_id is polymorphic across all three).
 *
 * Returns null for tenant-wide roles, meaning "no subject filter". Returns an
 * EMPTY ARRAY when the caller is party to nothing — callers must treat that as
 * "match no rows", never as "no filter".
 */
async function partySubjectIds(access, partyOrgIds = []) {
    if (access && access.scope === 'all') return null;
    const ids = (partyOrgIds || []).filter(Boolean);
    if (!ids.length) return [];

    const sides = [];
    if (access.scope === 'buyer' || access.scope === 'party') sides.push({ buyer_org_id: { [Op.in]: ids } });
    if (access.scope === 'seller' || access.scope === 'party') sides.push({ seller_org_id: { [Op.in]: ids } });
    if (!sides.length) return [];

    const operations = await db.TradeOperation.findAll({
        where: { [Op.or]: sides }, attributes: ['id'],
    });
    const operationIds = operations.map((o) => o.id);
    if (!operationIds.length) return [];

    const [shipments, consignments] = await Promise.all([
        db.TradeShipment.findAll({ where: { trade_operation_id: { [Op.in]: operationIds } }, attributes: ['id'] }),
        db.Consignment.findAll({ where: { trade_operation_id: { [Op.in]: operationIds } }, attributes: ['id'] }),
    ]);

    return [
        ...operationIds,
        ...shipments.map((s) => s.id),
        ...consignments.map((c) => c.id),
    ];
}

module.exports = { operationForSubject, isSubjectInScope, partySubjectIds };
