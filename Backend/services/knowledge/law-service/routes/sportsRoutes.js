'use strict';
const router = require('express').Router();
const ctrl = require('../controller/sportsController');

// Public, unauthenticated reads of published sports profiles only.
router.get('/hidden',               ctrl.hiddenSlugs);
router.get('/teams',                ctrl.listTeams);
router.get('/teams/:slug',          ctrl.getTeam);
router.get('/competitions',         ctrl.listCompetitions);
router.get('/competitions/:slug',   ctrl.getCompetition);

module.exports = router;
