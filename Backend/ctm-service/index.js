'use strict';
const express      = require('express');
const cors         = require('cors');
const helmet       = require('helmet');
const cookieParser = require('cookie-parser');
const config       = require('./config/appConfig');
const requestContext = require('./middleware/requestContext');
const rateLimit    = require('./middleware/rateLimit');
const v1Routes     = require('./routes/v1');
const { errorHandler, notFoundHandler } = require('./middleware/errorMiddleware');
const db           = require('./models');
const { metricsMiddleware, metricsHandler } = require('./middleware/metrics');
const swaggerUi    = require('swagger-ui-express');
const swaggerSpec  = require('./config/swagger');

const app = express();

app.set('trust proxy', 1);
app.use(helmet());
app.use(cors({ origin: config.corsOrigins, credentials: true }));
app.use(express.json({ limit: '2mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(requestContext);
app.use(metricsMiddleware);
app.use(rateLimit());

app.get('/', (req, res) => res.json({ service: 'Baalvion CTM Service', version: config.apiVersion }));
app.get('/health', (req, res) => res.json({ status: 'ok', timestamp: new Date().toISOString() }));
app.get('/metrics', metricsHandler);
app.use('/docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, { customSiteTitle: 'CTM API Docs' }));
app.get('/docs.json', (req, res) => res.json(swaggerSpec));

app.use('/v1', v1Routes);
app.use('/api/v1', v1Routes);

app.use(notFoundHandler);
app.use(errorHandler);

const start = async () => {
    try {
        await db.sequelize.authenticate();
        await db.sequelize.query('CREATE SCHEMA IF NOT EXISTS ctm');
        await db.sequelize.sync({ alter: false });
        console.log('[DB] Connected and schema synced');
    } catch (err) {
        console.error('[DB] Failed to connect:', err.message);
        process.exit(1);
    }
    app.listen(config.port, () =>
        console.log(`Baalvion CTM Service running on port ${config.port}`)
    );
};

start();
module.exports = app;
