require('@baalvion/telemetry/bootstrap');
﻿const express = require('express');
const http = require('http');
const cors = require('cors');
const helmet = require('helmet');
const cookieParser = require('cookie-parser');
const config = require('./config/appConfig');
const requestContext = require('./middleware/requestContext');
const rateLimit = require('./middleware/rateLimit');
const v1Routes = require('./routes/v1');
const { errorHandler, notFoundHandler } = require('./middleware/errorMiddleware');
const db = require('./models');
const { metricsMiddleware, metricsHandler } = require('./middleware/metrics');
const { initGracefulShutdown, registerShutdown } = require('@baalvion/graceful-shutdown');
const app = express();
const server = http.createServer(app);
app.set('trust proxy', 1);
app.use(helmet());
app.use(cors({ origin: config.corsOrigins, credentials: true }));
app.use(express.urlencoded({ extended: true }));
app.use(express.json({ limit: '1mb' }));
app.use(cookieParser());
app.use(requestContext);
app.use(metricsMiddleware);
app.use(rateLimit());
app.get('/', (req, res) => res.json({ service: 'Baalvion Market Service', version: config.apiVersion }));
app.get('/health', (req, res) => res.json({ status: 'ok', timestamp: new Date().toISOString() }));
// Readiness probe — only reports ready once the DB connection is established.
app.get('/readyz', async (req, res) => {
    try {
        await db.sequelize.authenticate();
        return res.json({ status: 'ready', db: 'connected' });
    } catch (err) {
        return res.status(503).json({ status: 'not_ready', db: 'unavailable' });
    }
});
app.get('/metrics', metricsHandler);
app.use('/v1', v1Routes);
app.use('/api/v1', v1Routes);
app.use(notFoundHandler);
app.use(errorHandler);
const start = async () => {
    try {
        await db.sequelize.authenticate();
        await db.sequelize.query('CREATE SCHEMA IF NOT EXISTS market');
        await db.sequelize.sync({ alter: false });
        console.log('[Market] DB connected and synced');
    } catch (err) { console.error('[Market] DB error:', err.message); process.exit(1); }
    server.listen(config.port, () => console.log(`[Market] Service running on port ${config.port}`));
    registerShutdown('db', async () => { if (db.sequelize && db.sequelize.close) await db.sequelize.close(); });
    initGracefulShutdown(server);
};
start();
module.exports = app;
