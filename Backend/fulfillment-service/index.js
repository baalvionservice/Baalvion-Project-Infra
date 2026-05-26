'use strict';
const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const config = require('./config/appConfig');
const { connectDB, sequelize } = require('./models');
const v1Router = require('./routes/v1');
const { errorHandler } = require('./middleware/errorMiddleware');
const requestContext = require('./middleware/requestContext');
const createIpRateLimit = require('./middleware/rateLimit');

const app = express();

app.use(helmet());
app.use(cors({ origin: config.corsOrigins, credentials: true }));
app.use(express.json({ limit: '10mb' }));
app.use(cookieParser());
app.use(requestContext);
app.use(createIpRateLimit());

app.get('/health', (req, res) => res.json({ status: 'ok', service: 'fulfillment-service', port: config.port }));

app.use('/api/v1', v1Router);

app.use((req, res) => res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Route not found' } }));

app.use(errorHandler);

async function start() {
    try {
        await connectDB();
        await sequelize.query('CREATE SCHEMA IF NOT EXISTS fulfillment;');
        app.listen(config.port, () => {
            console.log(`[Fulfillment Service] Running on port ${config.port} (${config.env})`);
        });
    } catch (err) {
        console.error('[Fulfillment Service] Startup failed:', err.message);
        process.exit(1);
    }
}

start();
