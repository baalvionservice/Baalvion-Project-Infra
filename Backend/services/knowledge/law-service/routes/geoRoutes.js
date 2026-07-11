'use strict';
const router = require('express').Router();
const ctrl = require('../controller/geoController');

router.get('/states',          ctrl.listStates);
router.get('/states/summary',  ctrl.statesSummary);
router.get('/cities',          ctrl.listCities);
router.get('/cities/summary',  ctrl.citiesSummary);

module.exports = router;
