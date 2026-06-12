'use strict';
const { Router } = require('express');
const ctrl = require('../controller/websiteController');
const { loadCmsRole, requireCmsRole } = require('../middleware/cmsAccess');
const { resolveWebsiteParam } = require('../middleware/resolveWebsite');
const { validate } = require('../middleware/validate');
const { createWebsiteSchema, updateWebsiteSchema, addMemberSchema, updateMemberRoleSchema } = require('../validators/websiteSchemas');

const router = Router();

// /cms/websites
router.get('/', ctrl.list);
router.post('/', validate(createWebsiteSchema), ctrl.create);

// /cms/websites/:websiteId — loadCmsRole resolves a slug in :websiteId to the
// canonical UUID. The delete route has no loadCmsRole, so it gets the standalone
// resolveWebsiteParam (same route layer, so the rewrite reaches the controller).
router.get('/:websiteId/stats', loadCmsRole, ctrl.getStats);
router.get('/:websiteId', loadCmsRole, ctrl.getOne);
router.patch('/:websiteId', loadCmsRole, requireCmsRole('cms_admin'), validate(updateWebsiteSchema), ctrl.update);
router.delete('/:websiteId', resolveWebsiteParam, requireCmsRole('cms_admin'), ctrl.remove);

// /cms/websites/:websiteId/members
router.get('/:websiteId/members/user-search', loadCmsRole, requireCmsRole('cms_admin'), ctrl.searchUsers);
router.get('/:websiteId/members', loadCmsRole, requireCmsRole('cms_editor'), ctrl.listMembers);
router.post('/:websiteId/members', loadCmsRole, requireCmsRole('cms_admin'), validate(addMemberSchema), ctrl.addMember);
router.patch('/:websiteId/members/:userId', loadCmsRole, requireCmsRole('cms_admin'), validate(updateMemberRoleSchema), ctrl.updateMemberRole);
router.delete('/:websiteId/members/:userId', loadCmsRole, requireCmsRole('cms_admin'), ctrl.removeMember);

module.exports = router;
