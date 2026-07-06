'use strict';
// Notifications wiring (Phase 2, Step 17). Writes a db.Notification row + fires a
// realtime.publish event, mirroring the fire-and-forget pattern already used by
// shipmentController/billOfLadingController (`.catch(() => {})`). Never throws —
// a notification failure must not break the underlying verification action.
const db = require('../../models');

const TITLES = {
    verification_requested: 'Verification submitted',
    verification_approved: 'Verification approved',
    verification_rejected: 'Verification rejected',
    document_expiring: 'Document expiring soon',
    compliance_issue: 'Compliance issue detected',
    trust_score_updated: 'Trust score updated',
};

async function notifyOrg({ orgId, type, message, entityType = null, entityId = null }) {
    try {
        const org = await db.Organization.findByPk(orgId);
        if (!org) return null;
        const notification = await db.Notification.create({
            tenant_id: org.tenant_id,
            recipient_org_id: org.code || String(org.id),
            type,
            title: TITLES[type] || 'Verification update',
            message,
            entity_type: entityType,
            entity_id: entityId,
        });
        require('../../realtime').publish(`org:${org.code || org.id}`, type, { orgId, entityType, entityId, message }).catch(() => {});
        return notification;
    } catch (err) {
        // eslint-disable-next-line no-console
        console.error('[notify] notifyOrg failed:', err.message);
        return null;
    }
}

/** category checklist status transition -> notification type (undefined = no notification for this transition). */
function typeForCategoryStatus(status) {
    if (status === 'submitted' || status === 'under_review') return 'verification_requested';
    if (status === 'approved') return 'verification_approved';
    if (status === 'rejected') return 'verification_rejected';
    if (status === 'expired') return 'document_expiring';
    return null;
}

async function notifyChecklistTransition(orgId, category, previousStatus, newStatus) {
    if (previousStatus === newStatus) return null; // only notify on an actual change
    const type = category === 'compliance' && newStatus === 'rejected' ? 'compliance_issue' : typeForCategoryStatus(newStatus);
    if (!type) return null;
    return notifyOrg({
        orgId, type, entityType: 'verification_checklist_item', entityId: category,
        message: `${category} verification is now ${newStatus.replace('_', ' ')}`,
    });
}

async function notifyTrustScoreUpdated(orgId, score) {
    return notifyOrg({ orgId, type: 'trust_score_updated', entityType: 'trust_score', entityId: null, message: `Trust score updated to ${score}/100` });
}

module.exports = { notifyOrg, notifyChecklistTransition, notifyTrustScoreUpdated };
