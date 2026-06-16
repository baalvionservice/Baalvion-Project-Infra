'use strict';
require('@baalvion/telemetry/bootstrap');
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
const { startReconciliationWorker } = require('./queues/reconciliationQueue');
const { startLedgerOutboxRelay, stopLedgerOutboxRelay } = require('./service/ledgerOutbox');
const { initGracefulShutdown, registerShutdown } = require('@baalvion/graceful-shutdown');

const app = express();

app.use(helmet());
app.use(cors({ origin: config.corsOrigins, credentials: true }));
// Capture the raw request bytes so the payment-webhook signature (paymentWebhookAuth) can verify
// the HMAC over the EXACT body the gateway signed (a re-serialization could differ byte-for-byte).
app.use(express.json({ limit: '10mb', verify: (req, _res, buf) => { req.rawBody = buf && buf.length ? buf.toString('utf8') : ''; } }));
app.use(cookieParser());
app.use(requestContext);
app.use(createIpRateLimit());

// Liveness (cheap) + readiness (DB check). Paths match the Helm probes (/healthz, /readyz).
app.get(['/health', '/healthz'], (req, res) => res.json({ status: 'ok', service: 'order-service', port: config.port }));
app.get('/readyz', async (req, res) => {
    try { await sequelize.authenticate(); return res.json({ status: 'ready', db: 'connected' }); }
    catch (err) { return res.status(503).json({ status: 'not_ready', db: 'unavailable', error: err.message }); }
});
// Minimal Prometheus exposition (dependency-free) so the platform scrape has a live target.
app.get('/metrics', (req, res) => {
    const m = process.memoryUsage();
    res.set('Content-Type', 'text/plain; version=0.0.4').send(
        `# TYPE baalvion_service_up gauge\nbaalvion_service_up{service="order-service"} 1\n` +
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
        await sequelize.query('CREATE SCHEMA IF NOT EXISTS orders;');
        // Scheduled financial reconciliation sweep (no-op if disabled / ledger unconfigured).
        await startReconciliationWorker().catch((e) => console.error('[Reconcile] worker failed to start:', e.message));
        // Transactional-outbox relay: durably delivers captured-payment / refund ledger mirrors to
        // ledger-service with retry + dead-letter (replaces the old fire-and-forget safeLedger path).
        startLedgerOutboxRelay();
        const server = app.listen(config.port, () => {
            console.log(`[Order Service] Running on port ${config.port} (${config.env})`);
        });
        registerShutdown('ledger-outbox-relay', async () => { await stopLedgerOutboxRelay(); });
        registerShutdown('db', async () => { if (sequelize && sequelize.close) await sequelize.close(); });
        initGracefulShutdown(server);
    } catch (err) {
        console.error('[Order Service] Startup failed:', err.message);
        process.exit(1);
    }
}

start();
