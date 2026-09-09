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

// Stage 1-2.
router.get('/signals', loadCmsRole, requireCmsRole('cms_viewer'), ctrl.listSignals);
router.post('/intake', loadCmsRole, requireCmsRole('cms_editor'), ctrl.runIntake);
router.post('/cluster', loadCmsRole, requireCmsRole('cms_editor'), ctrl.runClustering);

// Stage 3 — briefs.
router.get('/briefs', loadCmsRole, requireCmsRole('cms_viewer'), ctrl.listBriefs);
router.get('/briefs/:briefId', loadCmsRole, requireCmsRole('cms_viewer'), ctrl.getBrief);
router.post('/briefs', loadCmsRole, requireCmsRole('cms_editor'), ctrl.runBriefing);

// Stage 4 — drafts.
router.get('/drafts', loadCmsRole, requireCmsRole('cms_viewer'), ctrl.listDrafts);
router.get('/drafts/:draftId', loadCmsRole, requireCmsRole('cms_viewer'), ctrl.getDraft);
router.post('/drafts', loadCmsRole, requireCmsRole('cms_editor'), ctrl.runDrafting);

// Stage 4b — original art, without which the publish gate refuses every draft.
router.post('/art', loadCmsRole, requireCmsRole('cms_editor'), ctrl.runArt);

// Stage 5 — gates. Evaluating is a read of the rules and stays at viewer level so
// a contributor can see why their piece is held; approving publishes, and does not.
router.post('/drafts/:draftId/gate', loadCmsRole, requireCmsRole('cms_viewer'), ctrl.gateDraft);
router.post('/drafts/:draftId/approve', loadCmsRole, requireCmsRole('cms_editor'), ctrl.approveDraft);
router.post('/drafts/:draftId/reject', loadCmsRole, requireCmsRole('cms_editor'), ctrl.rejectDraft);

// What the desk actually published, by section and region -- the counterpart to
// the policy's intent.
router.get('/coverage', loadCmsRole, requireCmsRole('cms_viewer'), ctrl.getCoverage);

// The whole run, and the configuration check that explains a short one.
router.get('/preflight', loadCmsRole, requireCmsRole('cms_viewer'), ctrl.preflight);
router.post('/run', loadCmsRole, requireCmsRole('cms_editor'), ctrl.runPipeline);

module.exports = router;
