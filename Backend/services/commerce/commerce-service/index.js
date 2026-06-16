'use strict';
require('@baalvion/telemetry/bootstrap');
const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const config = require('./config/appConfig');
const { connectDB, sequelize } = require('./models');
const v1Router = require('./routes/v1');
const storefrontRoutes = require('./routes/storefrontRoutes');
const { errorHandler } = require('./middleware/errorMiddleware');
const requestContext = require('./middleware/requestContext');
const createIpRateLimit = require('./middleware/rateLimit');
const { startProductWorker, productQueue } = require('./queues/productQueue');
const { UPLOAD_DIR } = require('./service/productMediaService');
const fxRateProvider = require('./service/fxRateProvider');
const { initGracefulShutdown, registerShutdown } = require('@baalvion/graceful-shutdown');

const app = express();

app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }));

// Locally-stored product media (MEDIA_DRIVER=local). Served publicly with permissive CORS so
// storefront/admin origins can render images. No-op when MEDIA_DRIVER=minio/s3 (objects served
// directly by the object store). Mounted before auth so assets are anonymously fetchable.
app.use('/uploads', cors(), express.static(UPLOAD_DIR, { fallthrough: true, maxAge: '7d' }));

// Public storefront API (anonymous, read-only, published+public catalog). Permissive CORS so
// any storefront origin can browse — mounted BEFORE the restricted global CORS / authed router.
app.use('/api/v1/commerce/storefront/:storeId', cors(), storefrontRoutes);

app.use(cors({ origin: config.corsOrigins, credentials: true }));
app.use(express.json({ limit: '10mb' }));
app.use(cookieParser());
app.use(requestContext);
app.use(createIpRateLimit());

// Liveness (cheap) + readiness (DB check). Paths match the Helm probes (/healthz, /readyz);
// /health kept for backward compatibility.
app.get(['/health', '/healthz'], (req, res) => res.json({ status: 'ok', service: 'commerce-service', port: config.port }));
app.get('/readyz', async (req, res) => {
    try { await sequelize.authenticate(); return res.json({ status: 'ready', db: 'connected' }); }
    catch (err) { return res.status(503).json({ status: 'not_ready', db: 'unavailable', error: err.message }); }
});
// Minimal Prometheus exposition (dependency-free) so the platform scrape has a live target.
app.get('/metrics', (req, res) => {
    const m = process.memoryUsage();
    res.set('Content-Type', 'text/plain; version=0.0.4').send(
        `# TYPE baalvion_service_up gauge\nbaalvion_service_up{service="commerce-service"} 1\n` +
        `# TYPE baalvion_process_uptime_seconds gauge\nbaalvion_process_uptime_seconds ${process.uptime()}\n` +
        `# TYPE baalvion_process_resident_memory_bytes gauge\nbaalvion_process_resident_memory_bytes ${m.rss}\n` +
        `# TYPE baalvion_process_heap_used_bytes gauge\nbaalvion_process_heap_used_bytes ${m.heapUsed}\n`,
    );
});

app.use('/api/v1', v1Router);

app.use((req, res) => res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Route not found' } }));

app.use(errorHandler);

async function start() {
    try {
        await connectDB();
        await sequelize.query('CREATE SCHEMA IF NOT EXISTS commerce;');
        startProductWorker();
        // Live FX feed: prime from Redis + refresh on an interval (no-op unless FX_LIVE_FEED=true;
        // every read gracefully falls back to the static markets.js rate if the feed is unavailable).
        const fx = fxRateProvider.startBackgroundRefresh();
        if (fx.started) console.log('[Commerce Service] Live FX feed enabled (background refresh started)');
        const server = app.listen(config.port, () => {
            console.log(`[Commerce Service] Running on port ${config.port} (${config.env})`);
        });
        registerShutdown('product-queue', async () => { if (productQueue && productQueue.close) await productQueue.close(); });
        registerShutdown('redis', async () => { const r = require('./service/cacheService'); const c = (r.getClient && r.getClient()) || r.client || (typeof r.quit === 'function' ? r : null); if (c && c.quit) await c.quit(); });
        registerShutdown('db', async () => { if (sequelize && sequelize.close) await sequelize.close(); });
        initGracefulShutdown(server);
    } catch (err) {
        console.error('[Commerce Service] Startup failed:', err.message);
        process.exit(1);
    }
}

start();
