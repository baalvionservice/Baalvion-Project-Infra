'use strict';
const { Router } = require('express');
const ctrl = require('../controller/websiteController');
const { loadCmsRole, requireCmsRole } = require('../middleware/cmsAccess');
const { validate } = require('../middleware/validate');
const { createWebsiteSchema, updateWebsiteSchema, addMemberSchema, updateMemberRoleSchema } = require('../validators/websiteSchemas');

const router = Router();

// /cms/websites
router.get('/', ctrl.list);
router.post('/', validate(createWebsiteSchema), ctrl.create);

// /cms/websites/:websiteId
router.get('/:websiteId', loadCmsRole, ctrl.getOne);
router.patch('/:websiteId', loadCmsRole, requireCmsRole('cms_admin'), validate(updateWebsiteSchema), ctrl.update);
router.delete('/:websiteId', requireCmsRole('cms_admin'), ctrl.remove);

// /cms/websites/:websiteId/members
router.get('/:websiteId/members/user-search', loadCmsRole, requireCmsRole('cms_admin'), ctrl.searchUsers);
router.get('/:websiteId/members', loadCmsRole, requireCmsRole('cms_editor'), ctrl.listMembers);
router.post('/:websiteId/members', loadCmsRole, requireCmsRole('cms_admin'), validate(addMemberSchema), ctrl.addMember);
router.patch('/:websiteId/members/:userId', loadCmsRole, requireCmsRole('cms_admin'), validate(updateMemberRoleSchema), ctrl.updateMemberRole);
router.delete('/:websiteId/members/:userId', loadCmsRole, requireCmsRole('cms_admin'), ctrl.removeMember);

module.exports = router;
