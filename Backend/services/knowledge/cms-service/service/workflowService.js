'use strict';
const { Op } = require('sequelize');
const { CmsContent, CmsWorkflow, CmsApprovalLog, CmsWebsite, sequelize } = require('../models');
const { AppError } = require('../utils/errors');
const cache = require('./cacheService');
const auditService = require('./auditService');
const revisionService = require('./revisionService');
const revalidateService = require('./revalidateService');
const { emitSafe, CmsEvents } = require('../platform/events');
const { logger } = require('../platform/logger');
const { parsePagination, buildPaginated } = require('../utils/pagination');

// Valid state transitions: action → { from, to, requiredLevel }
// Level mapping: cms_admin:100 cms_editor:80 cms_publisher:70 cms_reviewer:60 cms_seo_manager:50 cms_author:40 cms_contributor:20 cms_viewer:10
const TRANSITIONS = {
    submit_for_review:  { from: ['draft', 'changes_requested'],          to: 'pending_review',      requiredLevel: 20 },
    approve:            { from: ['pending_review'],                       to: 'approved',             requiredLevel: 60 },
    request_changes:    { from: ['pending_review', 'approved', 'compliance_review'], to: 'changes_requested', requiredLevel: 60, requiresNote: true },
    // Compliance gate (regulated content e.g. IR): a Reviewer routes an approved item to
    // Compliance, who signs off (→approved, publishable) or rejects (→changes_requested).
    submit_for_compliance: { from: ['approved', 'pending_review'],        to: 'compliance_review',    requiredLevel: 60 },
    compliance_approve: { from: ['compliance_review'],                    to: 'approved',             requiredLevel: 65 },
    compliance_reject:  { from: ['compliance_review'],                    to: 'changes_requested',    requiredLevel: 65, requiresNote: true },
    publish:            { from: ['approved', 'draft'],                    to: 'published',            requiredLevel: 70 },
    schedule:           { from: ['approved'],                             to: 'scheduled',            requiredLevel: 70, requiresScheduledAt: true },
    unpublish:          { from: ['published'],                            to: 'draft',                requiredLevel: 70 },
    archive:            { from: ['published', 'draft', 'changes_requested', 'approved', 'scheduled', 'compliance_review'], to: 'archived', requiredLevel: 80 },
    restore_to_draft:   { from: ['archived', 'changes_requested'],       to: 'draft',                requiredLevel: 40 },
};

const CMS_ROLE_LEVEL = { cms_admin: 100, cms_editor: 80, cms_publisher: 70, cms_compliance: 65, cms_reviewer: 60, cms_seo_manager: 50, cms_author: 40, cms_contributor: 20, cms_viewer: 10 };

function resolveLevel(req) {
    // Platform admins bypass — assigned max level
    if (['super_admin', 'owner', 'admin'].includes(req.user?.role)) return 100;
    return CMS_ROLE_LEVEL[req.cmsRole] || 0;
}

async function transition(websiteId, contentId, userId, userLevel, action, notes, scheduledAt) {
    const def = TRANSITIONS[action];
    if (!def) throw new AppError('WORKFLOW_INVALID_ACTION', `Unknown workflow action: ${action}`, 400);

    if (userLevel < def.requiredLevel) throw new AppError('FORBIDDEN', `Insufficient role to perform action: ${action}`, 403);

    if (def.requiresNote && !notes?.trim()) throw new AppError('VALIDATION_ERROR', 'Notes are required for this action', 400);

    if (def.requiresScheduledAt && !scheduledAt) throw new AppError('VALIDATION_ERROR', 'scheduledAt is required for schedule action', 400);

    const result = await sequelize.transaction(async (t) => {
        const workflow = await CmsWorkflow.findOne({ where: { contentId }, transaction: t, lock: t.LOCK.UPDATE });
        if (!workflow) throw new AppError('NOT_FOUND', 'Workflow not found for this content', 404);

        const content = await CmsContent.findOne({ where: { id: contentId, websiteId }, transaction: t });
        if (!content) throw new AppError('NOT_FOUND', 'Content not found', 404);

        if (!def.from.includes(workflow.currentState)) {
            throw new AppError('WORKFLOW_INVALID_TRANSITION', `Cannot perform '${action}' when content is in state '${workflow.currentState}'`, 400);
        }

        const fromState = workflow.currentState;
        const toState = def.to;
        const now = new Date();

        const wfUpdate = { currentState: toState };
        const contentUpdate = { status: toState };

        if (action === 'submit_for_review') { wfUpdate.submittedBy = userId; wfUpdate.submittedAt = now; }
        if (action === 'approve') { wfUpdate.approvedBy = userId; wfUpdate.approvedAt = now; }
        if (action === 'request_changes') { wfUpdate.reviewedBy = userId; wfUpdate.reviewedAt = now; wfUpdate.comments = notes; }
        if (action === 'publish') { wfUpdate.publishedBy = userId; wfUpdate.publishedAt = now; contentUpdate.publishedAt = now; }
        if (action === 'schedule') {
            wfUpdate.scheduledPublishAt = scheduledAt;
            contentUpdate.scheduledAt = scheduledAt;
            // schedule_job_id will be set by the queue after job creation
        }
        if (action === 'unpublish') { contentUpdate.publishedAt = null; }

        await workflow.update(wfUpdate, { transaction: t });
        await content.update({ ...contentUpdate, lastEditedBy: userId }, { transaction: t });

        // Snapshot revision on meaningful state changes — MUST run on the same
        // transaction `t`, or its content.increment() deadlocks against this txn's
        // own row lock on the content (pool timeout → rollback).
        if (['submit_for_review', 'approve', 'publish'].includes(action)) {
            await revisionService.createRevision(contentId, userId, `State changed to ${toState}`, t);
        }

        // Audit log INSERT does an FK check on the locked cms_workflows row — same
        // transaction required to avoid self-deadlock / pool timeout.
        await auditService.logWorkflowAction({ workflowId: workflow.id, contentId, actorId: userId, action, fromState, toState, notes }, t);

        await cache.del(cache.keys.content(contentId));

        return { workflow: workflow.toJSON(), content: content.toJSON() };
    });

    // Post-commit domain events. Fully fire-and-forget (the slug lookup included),
    // so neither the lookup nor the publish adds latency to the transition response,
    // and a failure here can never affect the committed state machine.
    if (action === 'publish' || action === 'unpublish' || action === 'archive') {
        const eventType = action === 'publish' ? CmsEvents.CONTENT_PUBLISHED : CmsEvents.CONTENT_UNPUBLISHED;
        const content = result.content;
        void (async () => {
            const website = await CmsWebsite.findByPk(websiteId, { attributes: ['slug', 'domain'] });
            const websiteSlug = website ? website.slug : null;
            // Bust the public delivery cache so published edits appear immediately on the
            // live site instead of waiting out the 10-minute public TTL.
            if (websiteSlug) {
                try { await cache.delPattern(`cms:public:${websiteSlug}:*`); } catch { /* fail-open */ }
                // Tell the website's frontend to revalidate build-cached (ISR) pages now.
                try {
                    const { paths, urls } = revalidateService.pathsForContent(content, website && website.domain);
                    revalidateService.dispatch(websiteSlug, { paths, urls });
                } catch { /* fail-open — never affects the committed transition */ }
            }
            emitSafe(eventType, {
                websiteId,
                websiteSlug,
                contentId,
                slug: content.slug,
                contentType: content.contentType ?? null,
                state: result.workflow.currentState,
                action,
            }, { tenantId: websiteSlug });
            // SEO indexing trigger: notify search engines immediately on publish.
            if (action === 'publish') {
                try { require('./seoPingService').pingForWebsite(website); } catch { /* fail-open */ }
            }
        })().catch((err) => {
            // Event emission must never affect the request, but a dropped event
            // (e.g. the slug lookup hit a DB error) should still be observable.
            try { logger('workflow').warn({ err: err && err.message, contentId, action }, 'post-commit event emission failed'); } catch { /* logging must never throw */ }
        });
    }

    return result;
}

async function getWorkflow(websiteId, contentId) {
    const content = await CmsContent.findOne({ where: { id: contentId, websiteId } });
    if (!content) throw new AppError('NOT_FOUND', 'Content not found', 404);

    const workflow = await CmsWorkflow.findOne({ where: { contentId } });
    if (!workflow) throw new AppError('NOT_FOUND', 'Workflow not found', 404);

    return workflow.toJSON();
}

async function getApprovalLog(websiteId, contentId, query = {}) {
    const content = await CmsContent.findOne({ where: { id: contentId, websiteId } });
    if (!content) throw new AppError('NOT_FOUND', 'Content not found', 404);

    const workflow = await CmsWorkflow.findOne({ where: { contentId } });
    if (!workflow) throw new AppError('NOT_FOUND', 'Workflow not found', 404);

    const { page, limit, offset } = parsePagination(query);
    const { rows, count } = await CmsApprovalLog.findAndCountAll({
        where: { workflowId: workflow.id },
        order: [['createdAt', 'DESC']],
        limit, offset,
    });
    return buildPaginated(rows, count, { page, limit });
}

async function listPendingApprovals(websiteId, query = {}) {
    const { page, limit, offset } = parsePagination(query);
    const { rows, count } = await CmsContent.findAndCountAll({
        where: { websiteId, status: 'pending_review' },
        order: [['updatedAt', 'DESC']],
        attributes: { exclude: ['contentBlocks'] },
        limit, offset,
    });
    return buildPaginated(rows, count, { page, limit });
}

async function listScheduled(websiteId) {
    return CmsContent.findAll({
        where: { websiteId, status: 'scheduled', scheduledAt: { [Op.lte]: new Date() } },
        include: [{ model: CmsWorkflow, as: 'workflow' }],
    });
}

module.exports = { transition, getWorkflow, getApprovalLog, listPendingApprovals, listScheduled, TRANSITIONS };
