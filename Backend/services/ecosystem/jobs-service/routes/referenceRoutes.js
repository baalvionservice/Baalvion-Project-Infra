'use strict';
const { Router } = require('express');
const ctrl = require('../controller/referenceController');

const router = Router();

router.get('/countries',                    ctrl.listCountries);
router.get('/countries/:slug',              ctrl.getCountryBySlug);
router.get('/departments',                  ctrl.listDepartments);
router.get('/compliance-profiles/:id',      ctrl.getComplianceProfile);
router.get('/roles/:countrySlug',           ctrl.listRolesByCountry);

module.exports = router;
