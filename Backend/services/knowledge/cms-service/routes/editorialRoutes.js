'use strict';
const { Router } = require('express');
const ctrl = require('../controller/editorialController');
const { loadCmsRole, requireCmsRole } = require('../middleware/cmsAccess');

const router = Router({ mergeParams: true }); // receives websiteId from parent

// Reading the rules needs only viewer access; changing them is an editor decision
// -- the charter and the policy together determine what the site publishes and
// how much of it, which is not a contributor-level call.
router.get('/charter', loadCmsRole, requireCmsRole('cms_viewer'), ctrl.getCharter);
router.put('/charter', loadCmsRole, requireCmsRole('cms_editor'), ctrl.putCharter);

router.get('/policy', loadCmsRole, requireCmsRole('cms_viewer'), ctrl.getPolicy);
router.put('/policy', loadCmsRole, requireCmsRole('cms_editor'), ctrl.putPolicy);

// Live quota / cadence state for the newsroom dashboard.
router.get('/quota', loadCmsRole, requireCmsRole('cms_viewer'), ctrl.getQuota);

router.get('/signals', loadCmsRole, requireCmsRole('cms_viewer'), ctrl.listSignals);
router.post('/intake', loadCmsRole, requireCmsRole('cms_editor'), ctrl.runIntake);
router.post('/cluster', loadCmsRole, requireCmsRole('cms_editor'), ctrl.runClustering);

module.exports = router;
