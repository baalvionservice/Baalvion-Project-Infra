'use strict';
require('@baalvion/telemetry/bootstrap');
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const cookieParser = require('cookie-parser');

const config = require('./config/appConfig');
const requestContext = require('./middleware/requestContext');
const rateLimit = require('./middleware/rateLimit');
const v1Routes = require('./routes/v1');
const { notFoundHandler, errorHandler } = require('./middleware/error');
const neo = require('./config/neo4j');
const { initGracefulShutdown, registerShutdown } = require('@baalvion/graceful-shutdown');

const app = express();
app.set('trust proxy', 1);
app.use(helmet());
app.use(cors({ origin: config.corsOrigins, credentials: true }));
app.use(express.urlencoded({ extended: true }));
app.use(express.json({ limit: '2mb' }));
app.use(cookieParser());
app.use(requestContext);
app.use(rateLimit());

app.get('/', (req, res) => res.json({ service: config.service, version: config.version }));
app.get('/health', (req, res) => res.json({ status: 'ok', service: config.service, port: config.port, timestamp: new Date().toISOString() }));
app.get('/health/live', (req, res) => res.json({ status: 'alive', timestamp: new Date().toISOString() }));
app.get('/health/ready', async (req, res) => {
    try { await neo.verifyConnectivity(); return res.json({ status: 'ready', neo4j: 'connected' }); }
    catch (err) { return res.status(503).json({ status: 'not_ready', neo4j: 'unavailable', error: err.message }); }
});

app.use('/v1', v1Routes);
app.use('/api/v1', v1Routes);
app.use(notFoundHandler);
app.use(errorHandler);

const start = async () => {
    try { await neo.verifyConnectivity(); console.log(`[${config.service}] Neo4j connected`); }
    catch (err) { console.error(`[${config.service}] Neo4j connection failed:`, err.message); process.exit(1); }
    try {
        const { initSdk } = require('./platform/sdk');
        await initSdk();
        if (config.startEventConsumer) await require('./workers/eventConsumer').startEventConsumer();
    } catch (err) { console.warn(`[${config.service}] SDK/consumer degraded:`, err.message); }
    const server = app.listen(config.port, () => console.log(`[${config.service}] running on port ${config.port}`));
    registerShutdown('event-consumer', async () => {
        const { stopEventConsumer } = require('./workers/eventConsumer');
        if (typeof stopEventConsumer === 'function') await stopEventConsumer();
    });
    registerShutdown('neo4j', async () => { if (neo.close) await neo.close(); });
    initGracefulShutdown(server);
};

if (require.main === module) start();
module.exports = app;
