'use strict';
const { Router } = require('express');
const { authMiddleware } = require('../middleware/authMiddleware');
const websiteRoutes = require('./websiteRoutes');
const taxonomyRoutes = require('./taxonomyRoutes');
const contentRoutes = require('./contentRoutes');
const mediaRoutes = require('./mediaRoutes');
const publicRoutes = require('./publicRoutes');

const router = Router();

// Health
router.get('/health', (req, res) => res.json({ status: 'ok', service: 'cms-service', timestamp: new Date().toISOString() }));

// Public (unauthenticated) content delivery
router.use('/public', publicRoutes);

// All CMS management APIs require auth
router.use('/cms/websites', authMiddleware, websiteRoutes);

// Media library (org-scoped, global across the org's websites)
router.use('/cms/media', authMiddleware, mediaRoutes);

// Website-scoped taxonomy and content routes
router.use('/cms/websites/:websiteId', authMiddleware, taxonomyRoutes);
router.use('/cms/websites/:websiteId/content', authMiddleware, contentRoutes);

module.exports = router;
