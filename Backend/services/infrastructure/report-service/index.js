'use strict';
const express = require('express');
const http = require('http');
const cors = require('cors');
const helmet = require('helmet');

const config = require('./config/appConfig');
const jwt = require('./config/jwt');
const redis = require('./config/redis');
const requestContext = require('./middleware/requestContext');
const v1Routes = require('./routes/v1');
const { errorHandler, notFoundHandler } = require('./middleware/errorMiddleware');
const { startScheduler, stopScheduler } = require('./workers/scheduleWorker');
const queryRunner = require('./services/queryRunner');
const db = require('./models');
const logger = require('./utils/logger');

const app = express();
const server = http.createServer(app);

app.set('trust proxy', 1);
app.use(helmet());
app.use(cors({ origin: config.corsOrigins, credentials: true }));
app.use(express.json({ limit: '4mb' }));
app.use(requestContext);

app.get('/', (req, res) => res.json({ service: 'Baalvion Report Service', version: config.apiVersion, formats: require('./services/exporters').FORMATS }));
app.get('/health', (req, res) => res.json({
    status: 'ok', service: 'report-service', timestamp: new Date().toISOString(),
    rs256: jwt.isRs256Enabled(), redis: redis.isAvailable() ? 'ok' : 'unavailable',
    scheduler: config.reports.schedulerEnabled ? 'on' : 'off',
    datasources: Object.keys(config.reports.datasources),
}));

app.use('/v1', v1Routes);
app.use('/api/v1', v1Routes);
app.use(notFoundHandler);
app.use(errorHandler);

const start = async () => {
    try {
        await db.sequelize.authenticate();
        await db.sequelize.query(`CREATE SCHEMA IF NOT EXISTS ${config.db.schema}`);
        await db.sequelize.sync({ alter: false });
        logger.info('[report-service] DB ready');
    } catch (err) {
        logger.error({ err: err.message }, '[report-service] DB init failed');
        process.exit(1);
    }

    await redis.connect();
    startScheduler();

    server.listen(config.port, () => logger.info(`[report-service] running on port ${config.port} (RS256=${jwt.isRs256Enabled()})`));

    const shutdown = async () => { stopScheduler(); await queryRunner.closeAll(); server.close(() => process.exit(0)); };
    process.on('SIGTERM', shutdown);
    process.on('SIGINT', shutdown);
};

if (require.main === module) start();
module.exports = app;
