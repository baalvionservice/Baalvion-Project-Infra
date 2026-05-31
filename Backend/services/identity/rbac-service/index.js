'use strict';
const express = require('express');
const http = require('http');
const cors = require('cors');
const helmet = require('helmet');
const cookieParser = require('cookie-parser');

const config = require('./config/appConfig');
const jwt = require('./config/jwt');
const requestContext = require('./middleware/requestContext');
const v1Routes = require('./routes/v1');
const { errorHandler, notFoundHandler } = require('./middleware/errorMiddleware');
const db = require('./models');
const logger = require('./utils/logger');

const app = express();
const server = http.createServer(app);

// ── Core middleware ──────────────────────────────────────────────────────────
app.set('trust proxy', 1);
app.use(helmet());
app.use(cors({ origin: config.corsOrigins, credentials: true }));
app.use(express.json({ limit: '512kb' }));
app.use(cookieParser());
app.use(requestContext);

// ── Meta routes ────────────────────────────────────────────────────────────────
app.get('/', (req, res) => res.json({ service: 'Baalvion RBAC Service', version: config.apiVersion, model: 'RBAC + ABAC' }));
app.get('/health', (req, res) => res.json({ status: 'ok', timestamp: new Date().toISOString(), rs256: jwt.isRs256Enabled() }));

app.use('/v1', v1Routes);
app.use('/api/v1', v1Routes);

app.use(notFoundHandler);
app.use(errorHandler);

// ── Startup ──────────────────────────────────────────────────────────────────
const start = async () => {
    try {
        await db.sequelize.authenticate();
        logger.info('[RBAC] DB connected');
        await db.sequelize.query(`CREATE SCHEMA IF NOT EXISTS ${config.db.schema}`);
        await db.sequelize.sync({ alter: false });
        logger.info('[RBAC] Models synced');
    } catch (err) {
        logger.error({ err: err.message }, '[RBAC] DB init failed');
        process.exit(1);
    }

    server.listen(config.port, () =>
        logger.info(`[RBAC] Service running on port ${config.port} (RS256=${jwt.isRs256Enabled()})`));
};

if (require.main === module) start();

module.exports = app;
