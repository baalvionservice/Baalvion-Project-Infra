'use strict';
const express = require('express');

const router = express.Router();

router.use('/tenants',     require('./tenantRoutes'));
router.use('/roles',       require('./roleRoutes'));
router.use('/permissions', require('./permissionRoutes'));
router.use('/assignments', require('./assignmentRoutes'));
router.use('/users',       require('./userRoutes'));
router.use('/policies',    require('./policyRoutes'));
// PDP — RBAC + ABAC decision endpoint(s).
router.use('/', require('./decisionRoutes'));

module.exports = router;
