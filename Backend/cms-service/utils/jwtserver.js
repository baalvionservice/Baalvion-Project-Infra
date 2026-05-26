const jwt = require('jsonwebtoken');
const config = require('../config/appConfig');

// CMS service only VERIFIES tokens — signing is done by auth-service only
const verifyAccessToken = (token) => jwt.verify(token, config.jwt.accessSecret);

module.exports = { verifyAccessToken };
