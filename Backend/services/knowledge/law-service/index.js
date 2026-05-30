'use strict';
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
const { metricsMiddleware, metricsHandler } = require('./middleware/metrics');

const app = express();
const server = http.createServer(app);

app.set('trust proxy', 1);
app.use(helmet());
app.use(cors({ origin: config.corsOrigins, credentials: true }));
// Razorpay webhook needs the raw body for signature verification — register it BEFORE the
// JSON parser so its bytes aren't consumed/re-encoded.
const paymentController = require('./controller/paymentController');
app.post(['/v1/payments/webhook', '/api/v1/payments/webhook'], express.raw({ type: '*/*' }), paymentController.webhookHandler);
app.use(express.urlencoded({ extended: true }));
app.use(express.json({ limit: '2mb' }));
app.use(cookieParser());
app.use(requestContext);
app.use(metricsMiddleware);
app.use(rateLimit());

app.get('/', (req, res) => res.json({ service: 'Baalvion Law Service (Law Elite Network)', version: config.apiVersion }));
app.get('/health', (req, res) => res.json({ status: 'ok', service: 'law-service', port: config.port, timestamp: new Date().toISOString() }));
app.get('/metrics', metricsHandler);

app.use('/v1', v1Routes);
app.use('/api/v1', v1Routes);
app.use(notFoundHandler);
app.use(errorHandler);

const start = async () => {
    try {
        await db.sequelize.authenticate();
        await db.sequelize.query('CREATE SCHEMA IF NOT EXISTS legal');
        await db.sequelize.sync({ alter: false });
        console.log('[law-service] DB connected and synced');
    } catch (err) {
        console.error('[law-service] DB connection failed:', err.message);
        process.exit(1);
    }
    server.listen(config.port, () => console.log(`[law-service] running on port ${config.port}`));
};

start();
module.exports = app;
