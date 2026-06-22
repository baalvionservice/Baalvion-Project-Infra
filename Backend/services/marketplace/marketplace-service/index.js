'use strict';
require('@baalvion/telemetry/bootstrap');
const express = require('express');
const http = require('http');
const cors = require('cors');
const helmet = require('helmet');
const { v4: uuidv4 } = require('uuid');
const config = require('./config/appConfig');
const v1Routes = require('./routes/v1');
const apiVersion = require('./middleware/apiVersion');
const { errorHandler, notFoundHandler } = require('./middleware/errorMiddleware');
const db = require('./models');
const { initGracefulShutdown, registerShutdown } = require('@baalvion/graceful-shutdown');

const app = express();
const server = http.createServer(app);

app.set('trust proxy', 1);
app.use(helmet());
app.use(cors({ origin: config.corsOrigins, credentials: true }));
app.use(express.urlencoded({ extended: true }));
app.use(express.json({ limit: '2mb' }));
app.use((req, _res, next) => { req.requestId = req.headers['x-request-id'] || uuidv4(); next(); });

app.get('/', (req, res) => res.json({ service: 'Baalvion Invest — Marketplace Service', version: config.apiVersion }));
app.get('/health', (req, res) => res.json({ status: 'ok', timestamp: new Date().toISOString() }));
// Version discovery — clients negotiate against supportedVersions; current is the default mount.
app.get('/version', (req, res) => res.json({
    service: 'marketplace-service',
    current: config.apiVersion,
    supported: config.supportedVersions,
}));

// URI-based versioning: stamp the negotiated version (→ X-API-Version header + response meta),
// then mount the v1 router at both /v1 and /api/v1.
app.use(['/v1', '/api/v1'], apiVersion('v1'));
app.use('/v1', v1Routes);
app.use('/api/v1', v1Routes);
app.use(notFoundHandler);
app.use(errorHandler);

const start = async () => {
    try {
        await db.sequelize.authenticate();
        // Tables are created by migrations/001_init.sql — never auto-alter in this service.
        console.log('[Marketplace] DB connected');
    } catch (err) {
        console.error('[Marketplace] DB error:', err.message);
        process.exit(1);
    }
    server.listen(config.port, () => console.log(`[Marketplace] Service running on port ${config.port}`));

    registerShutdown('db', async () => { if (db.sequelize && db.sequelize.close) await db.sequelize.close(); });
    initGracefulShutdown(server);
};

if (require.main === module) start();
module.exports = app;
