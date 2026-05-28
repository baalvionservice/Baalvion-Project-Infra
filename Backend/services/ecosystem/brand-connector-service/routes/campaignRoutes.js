const router = require('express').Router();
const ctrl = require('../controller/brandConnectorController');
const { authMiddleware } = require('../middleware/authMiddleware');

router.get('/', ctrl.listCampaigns);
router.post('/', authMiddleware, ctrl.createCampaign);
router.get('/:id', ctrl.getCampaign);
router.patch('/:id', authMiddleware, ctrl.updateCampaign);
router.delete('/:id', authMiddleware, ctrl.deleteCampaign);
router.post('/:id/publish', authMiddleware, ctrl.publishCampaign);
router.post('/:id/apply', authMiddleware, ctrl.applyToCampaign);
router.get('/:id/applications', authMiddleware, ctrl.listApplications);
router.patch('/:id/applications/:appId', authMiddleware, ctrl.reviewApplication);

module.exports = router;
