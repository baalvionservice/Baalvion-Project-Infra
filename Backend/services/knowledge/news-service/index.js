require('@baalvion/telemetry/bootstrap');
const express = require('express');
const http = require('http');
const cors = require('cors');
const helmet = require('helmet');
const cookieParser = require('cookie-parser');
const config = require('./config/appConfig');
const requestContext = require('./middleware/requestContext');
const rateLimit = require('./middleware/rateLimit');
const v1Routes = require('./routes/v1');
const internalRoutes = require('./routes/internalRoutes');
const { errorHandler, notFoundHandler } = require('./middleware/errorMiddleware');
const db = require('./models');
const { metricsMiddleware, metricsHandler } = require('./middleware/metrics');
const { initGracefulShutdown, registerShutdown } = require('@baalvion/graceful-shutdown');
const { startIngestionWorker } = require('./workers/ingestionWorker');

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
app.get('/', (req, res) => res.json({ service: 'Baalvion News Intelligence Service', version: config.apiVersion }));
app.get('/health', (req, res) => res.json({ status: 'ok', timestamp: new Date().toISOString() }));
app.get('/metrics', metricsHandler);
app.use('/v1', v1Routes);
app.use('/api/v1', v1Routes);
app.use('/internal/v1/news', internalRoutes);
app.use(notFoundHandler);
app.use(errorHandler);

const start = async () => {
    try {
        await db.sequelize.authenticate();
        await db.sequelize.query('CREATE SCHEMA IF NOT EXISTS news_intelligence');
        // Schema creation alone doesn't create tables -- this was missing entirely, so every
        // model-backed route 500'd with "relation news_intelligence.articles does not exist".
        // Matches the established pattern documented in deploy/consolidated's own workflow:
        // "CREATE SCHEMA IF NOT EXISTS <domain> + sequelize.sync({alter:false})".
        await db.sequelize.sync({ alter: false });
        console.log('[news-service] DB connected');
    } catch (err) {
        console.error('[news-service] DB error:', err.message);
        process.exit(1);
    }

    // Ingestion worker needs Redis; fail open so a Redis outage never blocks the
    // HTTP listener (the public API stays up even if ingestion is temporarily down).
    let ingestion;
    try {
        ingestion = startIngestionWorker();
    } catch (err) {
        console.error('[news-service] ingestion worker failed to start:', err.message);
    }

    server.listen(config.port, () => console.log(`[news-service] Service running on port ${config.port}`));

    registerShutdown('ingestion-worker', async () => {
        if (ingestion) {
            await ingestion.worker.close().catch(() => {});
            await ingestion.queue.close().catch(() => {});
        }
    });
    registerShutdown('db', async () => {
        if (db.sequelize && db.sequelize.close) await db.sequelize.close();
    });
    initGracefulShutdown(server);
};

start();
module.exports = app;
