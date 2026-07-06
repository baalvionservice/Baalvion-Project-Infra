'use strict';
// Factory & Warehouse Verification business logic (Phase 2, Step 7). Owns the
// 'factory'/'warehouse' checklist categories.
const db = require('../../models');
const checklist = require('./checklist');

async function recomputeFacilityCategory(orgId, tenantId, facilityType) {
    const rows = await db.Facility.findAll({ where: { org_id: orgId, facility_type: facilityType } });
    return checklist.recomputeCategory({ orgId, tenantId, category: facilityType, childStatuses: rows.map((r) => r.status) });
}

async function submitFacility({ orgId, tenantId, facilityType, addressId = null, productionCapacity = null, warehouseCapacity = null, employeeCount = null, gpsLatitude = null, gpsLongitude = null, media = [], actor }) {
    const record = await db.Facility.create({
        tenant_id: tenantId, org_id: orgId, facility_type: facilityType, address_id: addressId,
        production_capacity: productionCapacity, warehouse_capacity: warehouseCapacity, employee_count: employeeCount,
        gps_latitude: gpsLatitude, gps_longitude: gpsLongitude, media, status: 'submitted', created_by: actor,
    });
    await recomputeFacilityCategory(orgId, tenantId, facilityType);
    return record;
}

async function requestInspection(record) {
    await record.update({ inspection_status: 'scheduled' });
    return record;
}

async function setInspectionResult(record, passed) {
    await record.update({ inspection_status: passed ? 'passed' : 'failed' });
    return record;
}

async function reviewFacility({ record, decision, reviewedBy, rejectionReason = null }) {
    await record.update({
        status: decision, reviewed_by: reviewedBy, reviewed_at: new Date(),
        rejection_reason: decision === 'rejected' ? rejectionReason : null, updated_by: reviewedBy,
    });
    await recomputeFacilityCategory(record.org_id, record.tenant_id, record.facility_type);
    return record;
}

module.exports = { recomputeFacilityCategory, submitFacility, requestInspection, setInspectionResult, reviewFacility };
