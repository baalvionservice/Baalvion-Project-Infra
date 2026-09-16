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
const { optionalAuth } = require('./middleware/authMiddleware');
const { createIpRateLimit, createDealWriteRateLimit, createWebhookRateLimit } = require('./middleware/rateLimit');
const { tenantConnection } = require('./middleware/tenantConnection');
const { metricsMiddleware, metricsHandler } = require('./middleware/metrics');
const { startAuditRelay, stopAuditRelay } = require('./service/auditRelay');
const { errorHandler, notFoundHandler } = require('./middleware/errorMiddleware');
const db = require('./models');
const { initGracefulShutdown, registerShutdown } = require('@baalvion/graceful-shutdown');

const app = express();
const server = http.createServer(app);

app.set('trust proxy', 1);
app.use(helmet());
app.use(cors({ origin: config.corsOrigins, credentials: true }));
// Provider webhooks, mounted BEFORE the JSON body parser: signature verification needs the raw
// bytes, and express.json() would have consumed them. Outside the auth/tenant chain too — the
// caller is an escrow or e-signature provider, authenticated by request signature, not a session.
// That early mount also puts them ahead of the global IP limiter, so they carry their own.
app.use('/webhooks', createWebhookRateLimit(), require('./routes/webhooks'));

app.use(express.urlencoded({ extended: true }));
app.use(express.json({ limit: '2mb' }));
app.use((req, _res, next) => { req.requestId = req.headers['x-request-id'] || uuidv4(); next(); });
app.use(metricsMiddleware);
app.use(createIpRateLimit());

app.get('/', (req, res) => res.json({ service: 'Baalvion Invest — Marketplace Service', version: config.apiVersion }));
app.get('/health', (req, res) => res.json({ status: 'ok', timestamp: new Date().toISOString() }));
app.get('/metrics', metricsHandler);
// Version discovery — clients negotiate against supportedVersions; current is the default mount.
app.get('/version', (req, res) => res.json({
    service: 'marketplace-service',
    current: config.apiVersion,
    supported: config.supportedVersions,
}));

// URI-based versioning: stamp the negotiated version (→ X-API-Version header + response meta),
// then mount the v1 router at both /v1 and /api/v1.
app.use(['/v1', '/api/v1'], apiVersion('v1'));
// Resolve the caller before opening the tenant transaction, so RLS sees the verified org.
// Routes still run their own authMiddleware — optionalAuth only supplies the tenant.
app.use(['/v1', '/api/v1'], optionalAuth, tenantConnection(db.sequelize));
// Deal-state changes get a tighter, org-keyed budget on top of the global IP limit.
app.use(['/v1/deals', '/api/v1/deals'], createDealWriteRateLimit());
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
    // Drains the audit outbox — the deal-room trail is at-least-once, not best-effort.
    startAuditRelay();

    registerShutdown('audit-relay', async () => stopAuditRelay());
    registerShutdown('db', async () => { if (db.sequelize && db.sequelize.close) await db.sequelize.close(); });
    initGracefulShutdown(server);
};

if (require.main === module) start();
module.exports = app;
