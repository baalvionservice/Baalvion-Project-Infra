const { Server } = require('socket.io');
const jwt = require('jsonwebtoken');
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
            const payload = jwt.verify(token, config.jwt.accessSecret);
            socket.user = payload;
            return next();
        } catch (error) {
            return next(new Error('Invalid websocket token'));
        }
    });

    io.on('connection', (socket) => {
        if (socket.user?.orgId) {
            socket.join(`org:${socket.user.orgId}`);
        }
    });

    eventBus.attachSocketServer(io);
    return io;
};

module.exports = {
    initializeSocketServer,
};