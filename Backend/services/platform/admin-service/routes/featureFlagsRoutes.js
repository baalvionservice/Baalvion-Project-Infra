'use strict';
// Feature-flags console routes. Intended mount: /v1/admin/feature-flags, registered
// in v1.js BEFORE the generic '/admin' mount so it is not shadowed by adminRoutes.
// Because this router does NOT inherit adminRoutes' gate, it applies its own admin-tier
// gate, matching the rest of /admin/*.
// authMiddleware (RS256 verify) is already applied upstream in v1.js.
const router = require('express').Router();
const ctrl   = require('../controller/featureFlagsController');
const { requireStaffAdmin } = require('../middleware/authMiddleware');

// Platform-staff tier: EXACT match on admin/super_admin, NOT hierarchical. `owner` is a
// self-service role (registration makes every user owner of their own org), so a
// hierarchical admin gate handed these surfaces to the entire public.
router.use(requireStaffAdmin);

router.get('/',        ctrl.listFlags);
router.post('/',       ctrl.createFlag);
router.get('/:id',     ctrl.getFlag);
router.patch('/:id',   ctrl.updateFlag);   // also serves toggle ({ enabled })
router.delete('/:id',  ctrl.deleteFlag);

module.exports = router;
