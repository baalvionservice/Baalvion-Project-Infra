const { Router } = require('express');
const jobsRoutes = require('./jobsRoutes');
const campusRoutes = require('./campusRoutes');
const referenceRoutes = require('./referenceRoutes');
const workspaceRoutes = require('./workspaceRoutes');
const meRoutes = require('./meRoutes');
const marketplaceRoutes = require('./marketplaceRoutes');

const router = Router();

// Order matters. workspaceRoutes calls `router.use(authMiddleware)` internally while
// being mounted at '/', so it runs its auth gate against EVERY path that reaches it —
// anything mounted after it is authenticated whether it wants to be or not. Campus goes
// first so its public placement showcase stays public.
router.use('/', referenceRoutes);
router.use('/', meRoutes);
router.use('/', jobsRoutes);
router.use('/', marketplaceRoutes);
router.use('/campus', campusRoutes);
router.use('/', workspaceRoutes);

module.exports = router;
