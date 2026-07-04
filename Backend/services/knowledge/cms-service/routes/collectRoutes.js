'use strict';
const { Router } = require('express');
const cors = require('cors');
const collectController = require('../controller/collectController');
const { validate } = require('../middleware/validate');
const { collectSchema } = require('../validators/analyticsSchemas');

// Public first-party event beacon. Fires cross-origin from every managed site, so
// CORS is permissive (no credentials); the actual per-site origin allowlist is
// enforced in ingestService against the website's configured domain.
const router = Router();

router.use(cors({ origin: true, credentials: false, methods: ['POST', 'OPTIONS'] }));

// POST /api/v1/collect  — { site, events: [...] }
router.post('/', validate(collectSchema), collectController.collect);

module.exports = router;
