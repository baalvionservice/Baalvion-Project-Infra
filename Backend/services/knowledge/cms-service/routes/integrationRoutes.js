'use strict';
const { Router } = require('express');
const ctrl = require('../controller/integrationController');
const { loadCmsRole, requireCmsRole } = require('../middleware/cmsAccess');
const { validate } = require('../middleware/validate');
const { upsertIntegrationSchema } = require('../validators/integrationSchemas');

// Mounted at /cms/websites/:websiteId/integrations (mergeParams to see :websiteId).
const router = Router({ mergeParams: true });

router.get('/', loadCmsRole, requireCmsRole('cms_admin'), ctrl.list);
router.put('/:provider', loadCmsRole, requireCmsRole('cms_admin'), validate(upsertIntegrationSchema), ctrl.upsert);
router.post('/:provider/test', loadCmsRole, requireCmsRole('cms_admin'), ctrl.test);
router.delete('/:provider', loadCmsRole, requireCmsRole('cms_admin'), ctrl.remove);

module.exports = router;
