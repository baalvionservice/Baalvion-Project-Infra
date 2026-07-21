const { Router } = require('express');
const communitiesRoutes = require('./communitiesRoutes');
const invitesRoutes = require('./invitesRoutes');
const joinRequestRoutes = require('./joinRequestRoutes');
const adminRoutes = require('./adminRoutes');
const contentRoutes = require('./contentRoutes');
const billingRoutes = require('./billingRoutes');
const chatRoutes = require('./chatRoutes');
const directMessageRoutes = require('./directMessageRoutes');

const router = Router();

router.use('/community', communitiesRoutes);
router.use('/community', invitesRoutes);
router.use('/community', joinRequestRoutes);
router.use('/community', adminRoutes);
router.use('/community', contentRoutes);
router.use('/community', billingRoutes);
router.use('/community', chatRoutes);
router.use('/community', directMessageRoutes);

module.exports = router;
