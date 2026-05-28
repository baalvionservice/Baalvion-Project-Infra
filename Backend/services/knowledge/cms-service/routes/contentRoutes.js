'use strict';
const { Router } = require('express');
const ctrl = require('../controller/contentController');
const wfCtrl = require('../controller/workflowController');
const revCtrl = require('../controller/revisionController');
const { loadCmsRole, requireCmsRole } = require('../middleware/cmsAccess');
const { validate } = require('../middleware/validate');
const { createContentSchema, updateContentSchema, autosaveContentSchema, bulkUpdateSchema } = require('../validators/contentSchemas');
const { transitionSchema } = require('../validators/workflowSchemas');

const router = Router({ mergeParams: true }); // receives websiteId from parent

// Content list + create — /cms/websites/:websiteId/content
router.get('/', loadCmsRole, requireCmsRole('cms_viewer'), ctrl.list);
router.post('/', loadCmsRole, requireCmsRole('cms_contributor'), validate(createContentSchema), ctrl.create);
router.post('/bulk', loadCmsRole, requireCmsRole('cms_editor'), validate(bulkUpdateSchema), ctrl.bulk);

// Pending approvals — /cms/websites/:websiteId/content/pending
router.get('/pending', loadCmsRole, requireCmsRole('cms_reviewer'), wfCtrl.listPending);

// Single content — /cms/websites/:websiteId/content/:contentId
router.get('/:contentId', loadCmsRole, requireCmsRole('cms_viewer'), ctrl.getOne);
router.patch('/:contentId', loadCmsRole, requireCmsRole('cms_contributor'), validate(updateContentSchema), ctrl.update);
router.put('/:contentId/autosave', loadCmsRole, requireCmsRole('cms_contributor'), validate(autosaveContentSchema), ctrl.autosave);
router.delete('/:contentId', loadCmsRole, requireCmsRole('cms_editor'), ctrl.remove);

// Workflow — /cms/websites/:websiteId/content/:contentId/workflow
router.get('/:contentId/workflow', loadCmsRole, requireCmsRole('cms_viewer'), wfCtrl.getWorkflow);
router.post('/:contentId/workflow/transition', loadCmsRole, requireCmsRole('cms_contributor'), validate(transitionSchema), wfCtrl.transition);
router.get('/:contentId/workflow/log', loadCmsRole, requireCmsRole('cms_viewer'), wfCtrl.getLog);

// Revisions — /cms/websites/:websiteId/content/:contentId/revisions
router.get('/:contentId/revisions', loadCmsRole, requireCmsRole('cms_viewer'), revCtrl.list);
router.get('/:contentId/revisions/:revisionId', loadCmsRole, requireCmsRole('cms_viewer'), revCtrl.getOne);
router.post('/:contentId/revisions/:revisionId/restore', loadCmsRole, requireCmsRole('cms_editor'), revCtrl.restore);

module.exports = router;
