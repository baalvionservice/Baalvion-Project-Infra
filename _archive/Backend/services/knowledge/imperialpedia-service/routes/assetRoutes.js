const router = require('express').Router();
const ctrl = require('../controller/imperialpediaController');
const { authMiddleware } = require('../middleware/authMiddleware');

router.get('/', ctrl.listAssets);
router.post('/', authMiddleware, ctrl.createAsset);
router.get('/:symbol', ctrl.getAsset);
router.get('/:symbol/summaries', ctrl.listAssetSummaries);

module.exports = router;
