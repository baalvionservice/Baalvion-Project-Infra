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

const transactionsInitiated = new client.Counter({
  name: 'transactions_initiated_total',
  help: 'Total transactions initiated',
  labelNames: ['scheme', 'currency'],
});

const transactionsFailed = new client.Counter({
  name: 'transactions_failed_total',
  help: 'Total failed transactions',
  labelNames: ['scheme', 'failure_reason'],
});

const feesCollected = new client.Gauge({
  name: 'fees_collected_total',
  help: 'Total fees collected',
  labelNames: ['currency'],
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
  transactionsInitiated,
  transactionsFailed,
  feesCollected,
};
