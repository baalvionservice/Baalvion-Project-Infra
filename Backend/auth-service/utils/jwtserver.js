const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');
const config = require('../config/appConfig');

const generateAccessToken = (user) => jwt.sign(
    {
        jti: uuidv4(),
        id: user.id,
        email: user.email,
        orgId: user.orgId,
        role: user.role,
        permissions: user.permissions || [],
        sessionId: user.sessionId,
    },
    config.jwt.accessSecret,
    { expiresIn: config.jwt.accessExpiresIn }
);

const generateRefreshToken = (user) => jwt.sign(
    {
        jti: uuidv4(),
        id: user.id,
        orgId: user.orgId,
        sessionId: user.sessionId,
    },
    config.jwt.refreshSecret,
    { expiresIn: config.jwt.refreshExpiresIn }
);

const verifyAccessToken = (token) => jwt.verify(token, config.jwt.accessSecret);

const verifyRefreshToken = (token) => jwt.verify(token, config.jwt.refreshSecret);

module.exports = {
    generateAccessToken,
    generateRefreshToken,
    verifyAccessToken,
    verifyRefreshToken,
};
