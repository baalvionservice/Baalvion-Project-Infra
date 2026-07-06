'use strict';
/**
 * Factory & Warehouse Verification — HTTP surface (Phase 2 Trust/Verification/
 * Compliance Foundation, Step 7).
 */
const db = require('../models');
const { sendSuccess, sendPaginated } = require('../utils/response');
const { AppError } = require('../utils/errors');
const { recordAudit } = require('../utils/audit');
const { isAdmin, fetchOrgOwned, callerTenantId, actorOf } = require('../service/verification/access');
const facilitySvc = require('../service/verification/facility');
const { Facility } = db;

async function fetchOwned(id, req, next) {
    const record = await Facility.findByPk(id);
    if (!record) { next(new AppError('NOT_FOUND', 'Facility not found', 404)); return null; }
    if (isAdmin(req)) return record;
    const tenantId = callerTenantId(req);
    if (tenantId && record.tenant_id && record.tenant_id !== tenantId) {
        next(new AppError('NOT_FOUND', 'Facility not found', 404)); return null;
    }
    return record;
}

const createFacility = async (req, res, next) => {
    try {
        const {
            org_id, facility_type, address_id = null, production_capacity = null, warehouse_capacity = null,
            employee_count = null, gps_latitude = null, gps_longitude = null, media = [],
        } = req.body || {};
        const orgId = Number(org_id);
        const org = await fetchOrgOwned(orgId, req, next);
        if (!org) return undefined;

        if (!facility_type || !Facility.FACILITY_TYPES.includes(facility_type)) {
            return next(new AppError('INVALID_FACILITY_TYPE', '`facility_type` is required', 422, { allowed: Facility.FACILITY_TYPES }));
        }

        const record = await facilitySvc.submitFacility({
            orgId, tenantId: org.tenant_id, facilityType: facility_type, addressId: address_id,
            productionCapacity: production_capacity, warehouseCapacity: warehouse_capacity,
            employeeCount: employee_count, gpsLatitude: gps_latitude, gpsLongitude: gps_longitude, media, actor: actorOf(req),
        });

        await recordAudit({
            actorId: actorOf(req), action: 'facility.submitted', resourceType: 'facility',
            resourceId: record.id, tenantId: org.tenant_id, metadata: { orgId, facilityType: facility_type },
        });

        return sendSuccess(req, res, record, 201);
    } catch (err) {
        return next(err);
    }
};

const listFacilities = async (req, res, next) => {
    try {
        const { org_id, facility_type, page = 1, limit = 20 } = req.query;
        if (!org_id) return next(new AppError('VALIDATION_ERROR', '`org_id` query param is required', 422));
        const orgId = Number(org_id);
        const org = await fetchOrgOwned(orgId, req, next);
        if (!org) return undefined;

        const where = { org_id: orgId };
        if (facility_type) where.facility_type = facility_type;
        const offset = (Number(page) - 1) * Number(limit);
        const { count, rows } = await Facility.findAndCountAll({
            where, limit: Number(limit), offset, order: [['created_at', 'DESC']],
        });
        return sendPaginated(req, res, { items: rows, total: count, page: Number(page), limit: Number(limit) });
    } catch (err) {
        return next(err);
    }
};

const requestInspection = async (req, res, next) => {
    try {
        const record = await fetchOwned(req.params.id, req, next);
        if (!record) return undefined;
        await facilitySvc.requestInspection(record);
        await recordAudit({
            actorId: actorOf(req), action: 'facility.inspection_requested', resourceType: 'facility',
            resourceId: record.id, tenantId: record.tenant_id, metadata: {},
        });
        return sendSuccess(req, res, record);
    } catch (err) {
        return next(err);
    }
};

const setInspectionResult = async (req, res, next) => {
    try {
        if (!isAdmin(req)) return next(new AppError('FORBIDDEN', 'Admin or reviewer role required', 403));
        const record = await Facility.findByPk(req.params.id);
        if (!record) return next(new AppError('NOT_FOUND', 'Facility not found', 404));
        const { passed } = req.body || {};
        if (typeof passed !== 'boolean') return next(new AppError('VALIDATION_ERROR', '`passed` (boolean) is required', 422));
        await facilitySvc.setInspectionResult(record, passed);
        await recordAudit({
            actorId: actorOf(req), action: 'facility.inspection_result', resourceType: 'facility',
            resourceId: record.id, tenantId: record.tenant_id, metadata: { passed },
        });
        return sendSuccess(req, res, record);
    } catch (err) {
        return next(err);
    }
};

async function reviewDecision(req, res, next, decision) {
    if (!isAdmin(req)) return next(new AppError('FORBIDDEN', 'Admin or reviewer role required', 403));
    const record = await Facility.findByPk(req.params.id);
    if (!record) return next(new AppError('NOT_FOUND', 'Facility not found', 404));
    const { rejection_reason = null } = req.body || {};
    await facilitySvc.reviewFacility({ record, decision, reviewedBy: actorOf(req), rejectionReason: rejection_reason });
    await recordAudit({
        actorId: actorOf(req), action: `facility.${decision}`, resourceType: 'facility',
        resourceId: record.id, tenantId: record.tenant_id, metadata: { rejectionReason: rejection_reason },
    });
    return sendSuccess(req, res, record);
}
const approveFacility = (req, res, next) => reviewDecision(req, res, next, 'approved').catch(next);
const rejectFacility = (req, res, next) => reviewDecision(req, res, next, 'rejected').catch(next);

module.exports = { createFacility, listFacilities, requestInspection, setInspectionResult, approveFacility, rejectFacility };
