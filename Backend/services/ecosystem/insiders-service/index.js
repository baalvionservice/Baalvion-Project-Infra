'use strict';

const fs = require('fs');
const path = require('path');
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const cookieParser = require('cookie-parser');

const config = require('./config/appConfig');
const db = require('./models');
const requestContext = require('./middleware/requestContext');
const authTrace = require('./observability/authTrace');
const rateLimit = require('./middleware/rateLimit');
const v1Routes = require('./routes/v1');
const { errorHandler, notFoundHandler } = require('./middleware/errorMiddleware');

const app = express();

// ─────────────────────────────
// CORE MIDDLEWARE
// ─────────────────────────────
app.set('trust proxy', 1);
app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }));
app.use(cors({ origin: config.corsOrigins, credentials: true }));
app.use(express.json({ limit: '2mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

app.use(requestContext);
app.use(authTrace.middleware('insiders-service'));
app.use(rateLimit());

// ─────────────────────────────
// STATIC STORAGE
// ─────────────────────────────
const uploadRoot = path.resolve(config.uploads.dir);
fs.mkdirSync(uploadRoot, { recursive: true });
app.use('/storage', express.static(uploadRoot));

// ─────────────────────────────
// BASIC ROUTES
// ─────────────────────────────
app.get('/', (req, res) =>
    res.json({
        service: 'Baalvion Insiders API',
        version: config.apiVersion,
    })
);

app.get('/health', (req, res) =>
    res.json({
        status: 'ok',
        service: 'insiders-service',
        port: config.port,
        timestamp: new Date().toISOString(),
    })
);

app.get('/health/ready', async (req, res) => {
    try {
        await db.sequelize.authenticate();
        return res.json({ status: 'ready', db: 'connected' });
    } catch (err) {
        return res.status(503).json({
            status: 'not_ready',
            error: err.message,
        });
    }
});

// ─────────────────────────────
// ROUTES
// ─────────────────────────────
app.use('/v1', v1Routes);
app.use('/api/v1', v1Routes);

// ─────────────────────────────
// ERROR HANDLING
// ─────────────────────────────
app.use(notFoundHandler);
app.use(errorHandler);

// ─────────────────────────────
// STARTUP
// ─────────────────────────────
const start = async () => {
    try {
        await db.sequelize.authenticate();

        const { run: runMigrations } = require('./migrate');
        const migrated = await runMigrations();

        console.log(
            `[insiders-service] DB ready (migrations applied this boot: ${migrated.applied.length})`
        );
    } catch (err) {
        console.error('[insiders-service] startup failed:');
        console.error(err);
        console.error(err?.stack);
        process.exit(1);
    }

    app.listen(config.port, () => {
        console.log(
            `[insiders-service] running on http://localhost:${config.port}`
        );
    });
};

// ─────────────────────────────
// BOOTSTRAP
// ─────────────────────────────
if (require.main === module) start();

module.exports = app;