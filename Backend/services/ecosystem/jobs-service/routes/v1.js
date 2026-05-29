const { Router } = require('express');
const jobsRoutes = require('./jobsRoutes');
const campusRoutes = require('./campusRoutes');
const referenceRoutes = require('./referenceRoutes');
const workspaceRoutes = require('./workspaceRoutes');
const meRoutes = require('./meRoutes');

const router = Router();

router.use('/', referenceRoutes);
router.use('/', meRoutes);
router.use('/', jobsRoutes);
router.use('/', workspaceRoutes);
router.use('/campus', campusRoutes);

module.exports = router;
