'use strict';
const express = require('express');
const router = express.Router();

router.use('/', require('./publicRoutes'));      // no-auth public catalog (matched first)
router.use('/', require('./developerRoutes'));   // verify (internal) + protected developer surface

module.exports = router;
