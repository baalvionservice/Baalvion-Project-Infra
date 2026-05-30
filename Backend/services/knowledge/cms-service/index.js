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

        startSchedulerWorker();
        startNotificationWorker();

        app.listen(config.port, () => {
            console.log(`[CMS Service] Running on port ${config.port} (${config.env})`);
        });
    } catch (err) {
        console.error('[CMS Service] Startup failed:', err.message);
        process.exit(1);
    }
}

start();
