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
const { errorHandler, notFoundHandler } = require('./middleware/errorMiddleware');
const db = require('./models');
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
app.use(rateLimit());

app.get('/', (req, res) => res.json({ service: 'Baalvion Brand Connector Service', version: config.apiVersion }));
app.get('/health', (req, res) => res.json({ status: 'ok', timestamp: new Date().toISOString() }));

app.use('/v1', v1Routes);
app.use('/api/v1', v1Routes);
// Compat mount for the brand-connector frontend BFF, which calls `/api/<resource>`
// (e.g. /api/leads). Additive only — does not affect /v1 or /api/v1.
app.use('/api', v1Routes);
app.use(notFoundHandler);
app.use(errorHandler);

const start = async () => {
    try {
        await db.sequelize.authenticate();
        console.log('[BrandConnector] DB connected');
        await db.sequelize.query('CREATE SCHEMA IF NOT EXISTS brand');
        await db.sequelize.sync({ alter: false });
        console.log('[BrandConnector] Models synced');
    } catch (err) {
        console.error('[BrandConnector] DB connection failed:', err.message);
        process.exit(1);
    }
    server.listen(config.port, () => console.log(`[BrandConnector] Service running on port ${config.port}`));
    registerShutdown('db', async () => { if (db.sequelize && db.sequelize.close) await db.sequelize.close(); });
    initGracefulShutdown(server);
};

start();
module.exports = app;
