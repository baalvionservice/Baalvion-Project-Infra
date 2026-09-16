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

app.get('/', (req, res) => res.json({ service: 'Baalvion Community Service', version: config.apiVersion }));
app.get('/health', (req, res) => res.json({ status: 'ok', timestamp: new Date().toISOString() }));

app.use('/v1', v1Routes);
app.use('/api/v1', v1Routes);

app.use(notFoundHandler);
app.use(errorHandler);

const start = async () => {
    try {
        await db.sequelize.authenticate();
        await db.sequelize.query('CREATE SCHEMA IF NOT EXISTS community');
        await db.sequelize.sync({ alter: false });
        console.log('[DB] Connected and synced');
    } catch (err) {
        console.error('[DB] Failed:', err.message);
        process.exit(1);
    }
    // Drain this service's payment outbox onto the platform bus. Each service owns its own
    // `pcl` schema, so each runs its own relay; without it payments record locally and never
    // reach the cross-estate panel. Flag-gated and never fatal.
    try {
        const { startPaymentRelay } = require('./service/paymentSpine');
        startPaymentRelay();
    } catch (err) {
        console.error(JSON.stringify({ evt: 'payment_outbox.wire_failed', msg: err.message }));
    }
    const server = app.listen(config.port, () =>
        console.log(`Baalvion Community Service running on port ${config.port}`)
    );

    registerShutdown('db', async () => { if (db.sequelize && db.sequelize.close) await db.sequelize.close(); });
    initGracefulShutdown(server);
};

start();

module.exports = app;
