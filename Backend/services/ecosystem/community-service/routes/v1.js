const { Router } = require('express');
const communitiesRoutes = require('./communitiesRoutes');
const invitesRoutes = require('./invitesRoutes');
const joinRequestRoutes = require('./joinRequestRoutes');
const adminRoutes = require('./adminRoutes');
const contentRoutes = require('./contentRoutes');
const billingRoutes = require('./billingRoutes');
const chatRoutes = require('./chatRoutes');
const directMessageRoutes = require('./directMessageRoutes');
const nightlifeRoutes = require('./nightlifeRoutes');
const gigsRoutes = require('./gigsRoutes');
const bountyRoutes = require('./bountyRoutes');
const eduRoutes = require('./eduRoutes');
const kycRoutes = require('./kycRoutes');
const notificationRoutes = require('./notificationRoutes');
const mediaRoutes = require('./mediaRoutes');
const consoleRoutes = require('./consoleRoutes');

const { auditAdmin } = require('../middleware/auditAdmin');

const router = Router();

// One audit hook for every staff route. It must be mounted exactly once: each sub-router below
// shares the /community/admin prefix, so registering it per router would record every action N times.
router.use('/community/admin', auditAdmin);

router.use('/community', communitiesRoutes);
router.use('/community', invitesRoutes);
router.use('/community', joinRequestRoutes);
router.use('/community', adminRoutes);
router.use('/community', contentRoutes);
router.use('/community', billingRoutes);
router.use('/community', chatRoutes);
router.use('/community', directMessageRoutes);
router.use('/community', nightlifeRoutes);
router.use('/community', gigsRoutes);
router.use('/community', bountyRoutes);
router.use('/community', eduRoutes);
router.use('/community', kycRoutes);
router.use('/community', notificationRoutes);
router.use('/community', mediaRoutes);
router.use('/community', consoleRoutes);

module.exports = router;
