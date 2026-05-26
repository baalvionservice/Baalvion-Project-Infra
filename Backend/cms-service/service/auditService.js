'use strict';
const { CmsApprovalLog } = require('../models');

async function logWorkflowAction({ workflowId, contentId, actorId, action, fromState, toState, notes = null, metadata = {} }) {
    try {
        await CmsApprovalLog.create({ workflowId, contentId, actorId, action, fromState, toState, notes, metadata });
    } catch (err) {
        console.error('[Audit] Failed to write approval log:', err.message);
    }
}

module.exports = { logWorkflowAction };
