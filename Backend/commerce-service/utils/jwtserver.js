'use strict';
const jwt = require('jsonwebtoken');
const config = require('../config/appConfig');

// commerce-service ONLY verifies tokens — signing is auth-service's responsibility
const verifyAccessToken = (token) => jwt.verify(token, config.jwt.accessSecret);

module.exports = { verifyAccessToken };
