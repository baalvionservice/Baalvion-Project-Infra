const client = require('prom-client');

// Default metrics
client.collectDefaultMetrics();

// Custom metrics
const httpRequestDuration = new client.Histogram({
  name: 'http_request_duration_seconds',
  help: 'Duration of HTTP requests in seconds',
  labelNames: ['method', 'route', 'status'],
  buckets: [0.1, 0.5, 1, 2, 5],
});

const journalEntriesTotal = new client.Counter({
  name: 'journal_entries_total',
  help: 'Total journal entries created',
  labelNames: ['entry_type', 'status'],
});

const ledgerBalance = new client.Gauge({
  name: 'ledger_balance',
  help: 'Current ledger balance by account',
  labelNames: ['account_id', 'currency'],
});

function metricsMiddleware(req, res, next) {
  const start = Date.now();

  res.on('finish', () => {
    const duration = (Date.now() - start) / 1000;
    const route = req.route?.path || req.url;
    httpRequestDuration
      .labels(req.method, route, res.statusCode)
      .observe(duration);
  });

  next();
}

function metricsHandler(req, res) {
  res.set('Content-Type', client.register.contentType);
  res.end(client.register.metrics());
}

module.exports = {
  metricsMiddleware,
  metricsHandler,
  journalEntriesTotal,
  ledgerBalance,
};
