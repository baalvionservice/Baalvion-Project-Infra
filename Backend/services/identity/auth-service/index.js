'use strict';
require('@baalvion/telemetry/bootstrap');
const express      = require('express');
const http         = require('http');
const cors         = require('cors');
const helmet       = require('helmet');
const cookieParser = require('cookie-parser');

const config         = require('./config/appConfig');
const redis          = require('./config/redis');
const requestContext = require('./middleware/requestContext');
const rateLimit      = require('./middleware/rateLimit');
const { csrfTokenMiddleware } = require('./middleware/csrf');
const v1Routes       = require('./routes/v1');
const wellKnown      = require('./routes/wellKnownRoutes');
const { errorHandler, notFoundHandler } = require('./middleware/errorMiddleware');
const { auditMiddleware } = require('./services/auditService');
const db             = require('./models');
const { initGracefulShutdown, registerShutdown } = require('@baalvion/graceful-shutdown');

const app    = express();
const server = http.createServer(app);

// ── Core middleware ────────────────────────────────────────────────────────────
app.set('trust proxy', 1);
app.use(helmet());
app.use(cors({ origin: config.corsOrigins, credentials: true }));
app.use(express.urlencoded({ extended: true }));
app.use(express.json({ limit: '512kb' }));
app.use(cookieParser());
app.use(requestContext);
app.use(auditMiddleware); // Phase 9: req.audit.log(event, fields) -> auth.auth_audit_log
app.use(rateLimit());
app.use(csrfTokenMiddleware);

// ── Routes ────────────────────────────────────────────────────────────────────
app.get('/',       (req, res) => res.json({ service: 'Baalvion Auth Service', version: config.apiVersion }));
app.get('/health', (req, res) => res.json({ status: 'ok', timestamp: new Date().toISOString(), redis: redis.isAvailable() }));

app.use('/.well-known', wellKnown);
app.use('/v1',          v1Routes);
app.use('/api/v1',      v1Routes);

app.use(notFoundHandler);
app.use(errorHandler);

// ── Startup ───────────────────────────────────────────────────────────────────
const start = async () => {
    // 1 — Database
    try {
        await db.sequelize.authenticate();
        console.log('[Auth] DB connected');
        await db.sequelize.query('CREATE SCHEMA IF NOT EXISTS auth');
        // INVARIANT (identity-consolidation migration): models are DECLARED, never auto-ALTERed.
        // auth.sessions gains columns (008a) and later RLS (008b) via explicit SQL migrations; an
        // auto-ALTER here would race/clobber those. This is a hard `false` on purpose — do NOT wire
        // it to an env var. If someone tries via env, refuse loudly but keep it false.
        if (process.env.DB_SYNC_ALTER === 'true' || process.env.SEQUELIZE_ALTER === 'true') {
            console.error('[Auth] REFUSING sync({alter:true}) — schema changes go through SQL migrations, not auto-alter.');
        }
        await db.sequelize.sync({ alter: false });
        console.log('[Auth] Models synced (alter:false — schema owned by SQL migrations)');
    } catch (err) {
        console.error('[Auth] DB failed:', err.message);
        process.exit(1);
    }

    // 2 — Redis (optional — service stays up without it)
    await redis.connect();

    // 3 — Listen
    server.listen(config.port, () =>
        console.log(`[Auth] Service running on port ${config.port} (RS256 + Redis=${redis.isAvailable()})`)
    );

    // 4 — Graceful shutdown (drains HTTP, then runs cleanup handlers in parallel)
    registerShutdown('redis', async () => {
        const r = require('./config/redis');
        const c = (r.getClient && r.getClient()) || r.client || (typeof r.quit === 'function' ? r : null);
        if (c && c.quit) await c.quit();
    });
    registerShutdown('db', async () => {
        if (db.sequelize && db.sequelize.close) await db.sequelize.close();
    });
    initGracefulShutdown(server);
};

start();
module.exports = app;
