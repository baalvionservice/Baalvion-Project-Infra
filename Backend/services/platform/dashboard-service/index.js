require('@baalvion/telemetry/bootstrap');
const express = require('express');
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
app.set('trust proxy', 1);
app.use(helmet());
app.use(cors({ origin: config.corsOrigins, credentials: true }));
app.use(express.urlencoded({ extended: true }));
app.use(express.json({ limit: '1mb' }));
app.use(cookieParser());
app.use(requestContext);
app.use(rateLimit());

app.get('/', (req, res) => res.json({ service: 'dashboard-service', version: config.apiVersion }));
app.get('/health', (req, res) => res.json({ status: 'ok', timestamp: new Date().toISOString() }));

app.use('/v1', v1Routes);
app.use('/api/v1', v1Routes);

app.use(notFoundHandler);
app.use(errorHandler);

const start = async () => {
    try {
        await db.sequelize.authenticate();
        await db.sequelize.query('CREATE SCHEMA IF NOT EXISTS dashboard');
        await db.sequelize.sync({ alter: false });
        // DB connected and synced
    } catch (err) {
        // eslint-disable-next-line no-console
        process.stderr.write(`[DB] ${err.message}\n`);
        process.exit(1);
    }
    const server = app.listen(config.port, () => { /* dashboard-service listening */ });

    registerShutdown('db', async () => { if (db.sequelize && db.sequelize.close) await db.sequelize.close(); });
    initGracefulShutdown(server);
};

start();
module.exports = app;
