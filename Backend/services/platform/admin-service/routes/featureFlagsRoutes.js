'use strict';
// Feature-flags console routes. Intended mount: /v1/admin/feature-flags, registered
// in v1.js BEFORE the generic '/admin' mount so it is not shadowed by adminRoutes.
// Because this router does NOT inherit adminRoutes' gate, it applies its own
// requireSuperAdmin (every route is super-admin only, matching the rest of /admin/*).
// authMiddleware (RS256 verify) is already applied upstream in v1.js.
const router = require('express').Router();
const ctrl   = require('../controller/featureFlagsController');
const { requireSuperAdmin } = require('../middleware/authMiddleware');

router.use(requireSuperAdmin);

router.get('/',        ctrl.listFlags);
router.post('/',       ctrl.createFlag);
router.get('/:id',     ctrl.getFlag);
router.patch('/:id',   ctrl.updateFlag);   // also serves toggle ({ enabled })
router.delete('/:id',  ctrl.deleteFlag);

module.exports = router;
