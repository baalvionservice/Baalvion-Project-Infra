'use strict';
const express = require('express');
const path = require('path');
const helmet = require('helmet');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const config = require('./config/appConfig');
const { connectDB, sequelize } = require('./models');
const v1Router = require('./routes/v1');
const { errorHandler } = require('./middleware/errorMiddleware');
const requestContext = require('./middleware/requestContext');
const traceMiddleware = require('./platform/trace');
const { bootstrapPlatform } = require('./platform/bootstrap');
const { logger } = require('./platform/logger');
const createIpRateLimit = require('./middleware/rateLimit');
const { startSchedulerWorker } = require('./queues/schedulerQueue');
const { startNotificationWorker } = require('./queues/notificationQueue');

const app = express();

app.use(helmet());
app.use(cors({ origin: config.corsOrigins, credentials: true }));

// Static media — served before the JSON parser & rate limiter. Override helmet's
// same-origin CORP so uploaded images can be embedded by the admin console (:3030).
app.use('/uploads', express.static(path.resolve(__dirname, 'uploads'), {
    setHeaders: (res) => {
        res.set('Cross-Origin-Resource-Policy', 'cross-origin');
        res.set('Access-Control-Allow-Origin', '*');
    },
}));

app.use(express.json({ limit: '10mb' }));
app.use(cookieParser());
app.use(requestContext);
// SDK trace context: binds a traceId (+ tenant) to the request before any route,
// so all logging / events / outbound HTTP downstream are correlated.
app.use(traceMiddleware);
app.use(createIpRateLimit());

app.use('/api/v1', v1Router);

// Catch-all
app.use((req, res) => res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Route not found' } }));

app.use(errorHandler);

async function start() {
    try {
        await connectDB();

        // Ensure schema exists (idempotent)
        await sequelize.query(`CREATE SCHEMA IF NOT EXISTS cms;`);

        // Initialise the platform SDK (logging / tracing / events / internal-auth /
        // resilient HTTP) BEFORE the listener accepts traffic, so the trace
        // middleware and every handler are SDK-native from the first request.
        await bootstrapPlatform(app);

        startSchedulerWorker();
        startNotificationWorker();

        app.listen(config.port, () => {
            logger('boot').info({ port: config.port, env: config.env }, 'cms-service listening');
        });
    } catch (err) {
        logger('boot').error({ err: err && err.message }, 'cms-service startup failed');
        process.exit(1);
    }
}

start();
