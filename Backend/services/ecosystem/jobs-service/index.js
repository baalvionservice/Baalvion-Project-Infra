const express = require('express');
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

// BullMQ workers — started after DB connects
let workersStarted = false;
function startWorkers() {
    if (workersStarted) return;
    workersStarted = true;
    try {
        require('./workers/emailWorker');
        require('./workers/scoringWorker');
        require('./workers/indexingWorker');
        require('./workers/resumeWorker');
        console.log('[Workers] BullMQ workers started');
    } catch (err) {
        console.error('[Workers] Failed to start:', err.message);
    }
}

const { metricsMiddleware, metricsHandler } = require('./middleware/metrics');
const swaggerUi   = require('swagger-ui-express');
const swaggerSpec  = require('./config/swagger');
const { createBullBoard } = require('@bull-board/api');
const { BullMQAdapter }   = require('@bull-board/api/bullMQAdapter');
const { ExpressAdapter }  = require('@bull-board/express');

const app = express();

app.set('trust proxy', 1);
app.use(helmet());
app.use(cors({ origin: config.corsOrigins, credentials: true }));
app.use(express.urlencoded({ extended: true }));
app.use(express.json({ limit: '1mb' }));
app.use(cookieParser());
app.use(requestContext);
app.use(metricsMiddleware);
app.use(rateLimit());

app.get('/', (req, res) => res.json({ service: 'Baalvion Jobs Service (TalentOS)', version: config.apiVersion }));
app.get('/health', (req, res) => res.json({ status: 'ok', timestamp: new Date().toISOString() }));
app.get('/metrics', metricsHandler);
app.use('/docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, { customSiteTitle: 'TalentOS API Docs' }));
app.get('/docs.json', (req, res) => res.json(swaggerSpec));

// Bull-Board queue monitoring (admin only in production — add authMiddleware here if needed)
const { emailQueue, scoringQueue, indexingQueue, resumeQueue } = require('./queues');
const boardAdapter = new ExpressAdapter();
boardAdapter.setBasePath('/admin/queues');
createBullBoard({
    queues: [
        new BullMQAdapter(emailQueue),
        new BullMQAdapter(scoringQueue),
        new BullMQAdapter(indexingQueue),
        new BullMQAdapter(resumeQueue),
    ],
    serverAdapter: boardAdapter,
});
app.use('/admin/queues', boardAdapter.getRouter());

app.use('/v1', v1Routes);
app.use('/api/v1', v1Routes);

app.use(notFoundHandler);
app.use(errorHandler);

const start = async () => {
    try {
        await db.sequelize.authenticate();
        await db.sequelize.query('CREATE SCHEMA IF NOT EXISTS jobs');
        await db.sequelize.sync({ alter: false });
        console.log('[DB] Connected and synced');
        startWorkers();
        require('./service/searchService').ensureIndex().catch(() => {});
    } catch (err) {
        console.error('[DB] Failed:', err.message);
        process.exit(1);
    }
    app.listen(config.port, () =>
        console.log(`Baalvion Jobs Service (TalentOS) running on port ${config.port}`)
    );
};

start();

module.exports = app;
