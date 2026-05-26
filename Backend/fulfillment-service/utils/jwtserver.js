'use strict';
const jwt = require('jsonwebtoken');
const config = require('../config/appConfig');
const verifyAccessToken = (token) => jwt.verify(token, config.jwt.accessSecret);
module.exports = { verifyAccessToken };
