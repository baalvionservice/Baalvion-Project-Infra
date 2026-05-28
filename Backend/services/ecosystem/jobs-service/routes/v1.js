const { Router } = require('express');
const jobsRoutes = require('./jobsRoutes');
const campusRoutes = require('./campusRoutes');
const referenceRoutes = require('./referenceRoutes');

const router = Router();

router.use('/', referenceRoutes);
router.use('/', jobsRoutes);
router.use('/campus', campusRoutes);

module.exports = router;
