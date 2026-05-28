const router = require('express').Router();
const ctrl = require('../controller/realEstateController');
const { authMiddleware } = require('../middleware/authMiddleware');

router.use('/properties', require('./propertyRoutes'));
router.use('/agents', require('./agentRoutes'));
router.use('/viewings', require('./viewingRoutes'));
router.use('/inquiries', require('./inquiryRoutes'));
router.use('/favorites', require('./favoriteRoutes'));

// Analytics (auth)
router.get('/analytics/listings', authMiddleware, ctrl.getListingAnalytics);

module.exports = router;
