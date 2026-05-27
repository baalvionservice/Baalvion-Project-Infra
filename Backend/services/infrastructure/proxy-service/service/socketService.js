const { Server } = require('socket.io');
const { verifyAccessToken } = require('../utils/jwtserver'); // canonical authority (auth-node-backed)
const config = require('../config/appConfig');
const eventBus = require('./eventBus');

const initializeSocketServer = (httpServer) => {
    const io = new Server(httpServer, {
        path: config.websocket.path,
        cors: {
            origin: config.corsOrigins,
            credentials: true,
        },
    });

    io.use((socket, next) => {
        const token = socket.handshake.auth?.token || socket.handshake.query?.token;

        if (!token) {
            return next(new Error('Authentication token required'));
        }

        try {
            const payload = verifyAccessToken(token); // RS256-only (HS256 rejected — utils/jwtserver allowHs256Fallback:false)
            socket.user = payload;
            return next();
        } catch (error) {
            return next(new Error('Invalid websocket token'));
        }
    });

    io.on('connection', (socket) => {
        // canonical org claim is org_id (normalizeClaims also exposes organizationId)
        const orgId = socket.user?.org_id ?? socket.user?.organizationId ?? socket.user?.orgId;
        if (orgId) {
            socket.join(`org:${orgId}`);
        }
    });

    eventBus.attachSocketServer(io);
    return io;
};

module.exports = {
    initializeSocketServer,
};