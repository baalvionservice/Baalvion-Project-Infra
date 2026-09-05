'use strict';
// Canonical Consignment routes (Compression, Phase 1).
// Mounted at /v1/consignments. /schema is public (integrators build against it);
// everything else needs a gateway identity, with tenant scoping in the controller
// + RLS at the DB. There is deliberately no route that writes a derived document.
const router = require('express').Router();
const { authMiddleware } = require('../middleware/authMiddleware');
const ctrl = require('../controller/consignmentController');

// Static routes FIRST so they are not shadowed by '/:id'.
router.get('/schema',     ctrl.getSchema);
router.post('/preview',   authMiddleware, ctrl.preview);

router.get('/',           authMiddleware, ctrl.list);
router.post('/',          authMiddleware, ctrl.create);

router.get('/:id',                        authMiddleware, ctrl.get);
router.patch('/:id',                      authMiddleware, ctrl.update);
router.post('/:id/regenerate',            authMiddleware, ctrl.regenerate);
router.post('/:id/lock',                  authMiddleware, ctrl.lock);
router.get('/:id/declaration',            authMiddleware, ctrl.getDeclaration);
router.get('/:id/documents/:doc_type',    authMiddleware, ctrl.getDocument);

module.exports = router;
