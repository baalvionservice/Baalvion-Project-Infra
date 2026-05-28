'use strict';
const workflowService = require('../service/workflowService');
const { scheduleContentPublish, cancelScheduledPublish } = require('../queues/schedulerQueue');
const { notifyWorkflowTransition } = require('../queues/notificationQueue');
const { CmsWorkflow } = require('../models');
const { sendSuccess, sendPaginated } = require('../utils/response');

const CMS_ROLE_LEVEL = { cms_admin: 100, cms_editor: 80, cms_publisher: 70, cms_reviewer: 60, cms_seo_manager: 50, cms_author: 40, cms_contributor: 20, cms_viewer: 10 };

function getUserLevel(req) {
    if (['super_admin', 'owner', 'admin'].includes(req.user?.role)) return 100;
    return CMS_ROLE_LEVEL[req.cmsRole] || 0;
}

const getWorkflow = async (req, res, next) => {
    try {
        const workflow = await workflowService.getWorkflow(req.params.websiteId, req.params.contentId);
        return sendSuccess(req, res, workflow);
    } catch (err) { return next(err); }
};

const transition = async (req, res, next) => {
    try {
        const { action, notes, scheduledAt } = req.validated;
        const userLevel = getUserLevel(req);

        const result = await workflowService.transition(
            req.params.websiteId, req.params.contentId,
            req.user.id, userLevel, action, notes, scheduledAt
        );

        if (action === 'schedule') {
            const jobId = await scheduleContentPublish(req.params.contentId, req.params.websiteId, scheduledAt);
            await CmsWorkflow.update({ scheduleJobId: jobId }, { where: { contentId: req.params.contentId } });
        }
        if (['unpublish', 'archive', 'restore_to_draft'].includes(action)) {
            await cancelScheduledPublish(req.params.contentId).catch(() => {});
        }

        await notifyWorkflowTransition({
            contentId: req.params.contentId, websiteId: req.params.websiteId,
            action, fromState: result.workflow.currentState, toState: result.workflow.currentState,
            actorId: req.user.id,
        });

        return sendSuccess(req, res, result);
    } catch (err) { return next(err); }
};

const getLog = async (req, res, next) => {
    try {
        const result = await workflowService.getApprovalLog(req.params.websiteId, req.params.contentId, req.query);
        return sendPaginated(req, res, result);
    } catch (err) { return next(err); }
};

const listPending = async (req, res, next) => {
    try {
        const result = await workflowService.listPendingApprovals(req.params.websiteId, req.query);
        return sendPaginated(req, res, result);
    } catch (err) { return next(err); }
};

module.exports = { getWorkflow, transition, getLog, listPending };
