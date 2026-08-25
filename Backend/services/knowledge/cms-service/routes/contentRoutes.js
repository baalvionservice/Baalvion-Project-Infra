'use strict';
const { Router } = require('express');
const ctrl = require('../controller/contentController');
const wfCtrl = require('../controller/workflowController');
const revCtrl = require('../controller/revisionController');
const commentCtrl = require('../controller/commentModerationController');
const { loadCmsRole, requireCmsRole } = require('../middleware/cmsAccess');
const { validate } = require('../middleware/validate');
const { createContentSchema, updateContentSchema, autosaveContentSchema, bulkUpdateSchema, requestDeletionSchema } = require('../validators/contentSchemas');
const { transitionSchema } = require('../validators/workflowSchemas');
const { moderateCommentSchema, upsertPollSchema } = require('../validators/engagementSchemas');

const router = Router({ mergeParams: true }); // receives websiteId from parent

// Content list + create — /cms/websites/:websiteId/content
router.get('/', loadCmsRole, requireCmsRole('cms_viewer'), ctrl.list);
router.post('/', loadCmsRole, requireCmsRole('cms_contributor'), validate(createContentSchema), ctrl.create);
router.post('/bulk', loadCmsRole, requireCmsRole('cms_editor'), validate(bulkUpdateSchema), ctrl.bulk);
router.post('/import-wire', loadCmsRole, requireCmsRole('cms_editor'), ctrl.importWire);

// Pending approvals — /cms/websites/:websiteId/content/pending
router.get('/pending', loadCmsRole, requireCmsRole('cms_reviewer'), wfCtrl.listPending);

// Pending reader comments — /cms/websites/:websiteId/content/comments/pending
router.get('/comments/pending', loadCmsRole, requireCmsRole('cms_reviewer'), commentCtrl.listPending);
router.patch('/comments/:commentId/moderate', loadCmsRole, requireCmsRole('cms_reviewer'), validate(moderateCommentSchema), commentCtrl.moderate);

// Deletion requests — /cms/websites/:websiteId/content/deletion-requests. Contributors/authors
// can't DELETE (requires cms_editor+ below); this is their alternative + the editor's queue.
router.get('/deletion-requests', loadCmsRole, requireCmsRole('cms_editor'), ctrl.listDeletionRequests);

// Single content — /cms/websites/:websiteId/content/:contentId
router.get('/:contentId', loadCmsRole, requireCmsRole('cms_viewer'), ctrl.getOne);
router.get('/:contentId/preview-token', loadCmsRole, requireCmsRole('cms_viewer'), ctrl.getPreviewToken);
router.patch('/:contentId', loadCmsRole, requireCmsRole('cms_contributor'), validate(updateContentSchema), ctrl.update);
router.put('/:contentId/autosave', loadCmsRole, requireCmsRole('cms_contributor'), validate(autosaveContentSchema), ctrl.autosave);
router.post('/:contentId/duplicate', loadCmsRole, requireCmsRole('cms_contributor'), ctrl.duplicate);
router.delete('/:contentId', loadCmsRole, requireCmsRole('cms_editor'), ctrl.remove);
router.post('/:contentId/request-deletion', loadCmsRole, requireCmsRole('cms_contributor'), validate(requestDeletionSchema), ctrl.requestDeletion);
router.post('/:contentId/dismiss-deletion-request', loadCmsRole, requireCmsRole('cms_editor'), ctrl.dismissDeletionRequest);

// Workflow — /cms/websites/:websiteId/content/:contentId/workflow
router.get('/:contentId/workflow', loadCmsRole, requireCmsRole('cms_viewer'), wfCtrl.getWorkflow);
router.post('/:contentId/workflow/transition', loadCmsRole, requireCmsRole('cms_contributor'), validate(transitionSchema), wfCtrl.transition);
router.get('/:contentId/workflow/log', loadCmsRole, requireCmsRole('cms_viewer'), wfCtrl.getLog);

// Poll — /cms/websites/:websiteId/content/:contentId/poll (at most one per content item)
router.get('/:contentId/poll', loadCmsRole, requireCmsRole('cms_viewer'), ctrl.getPoll);
router.put('/:contentId/poll', loadCmsRole, requireCmsRole('cms_contributor'), validate(upsertPollSchema), ctrl.putPoll);
router.delete('/:contentId/poll', loadCmsRole, requireCmsRole('cms_contributor'), ctrl.deletePoll);

// Revisions — /cms/websites/:websiteId/content/:contentId/revisions
router.get('/:contentId/revisions', loadCmsRole, requireCmsRole('cms_viewer'), revCtrl.list);
router.get('/:contentId/revisions/:revisionId', loadCmsRole, requireCmsRole('cms_viewer'), revCtrl.getOne);
router.post('/:contentId/revisions/:revisionId/restore', loadCmsRole, requireCmsRole('cms_editor'), revCtrl.restore);

module.exports = router;
