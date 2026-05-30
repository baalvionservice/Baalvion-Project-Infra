'use strict';
const { CmsApprovalLog } = require('../models');

async function logWorkflowAction({ workflowId, contentId, actorId, action, fromState, toState, notes = null, metadata = {} }, transaction = null) {
    // When called from inside a workflow transaction, pass that transaction. The
    // cms_approval_logs INSERT performs an FK check (FOR KEY SHARE) on the
    // cms_workflows row the outer transaction just updated and holds locked —
    // running on a separate connection self-deadlocks until the pool times out.
    try {
        await CmsApprovalLog.create({ workflowId, contentId, actorId, action, fromState, toState, notes, metadata }, { transaction });
    } catch (err) {
        console.error('[Audit] Failed to write approval log:', err.message);
    }
}

module.exports = { logWorkflowAction };
