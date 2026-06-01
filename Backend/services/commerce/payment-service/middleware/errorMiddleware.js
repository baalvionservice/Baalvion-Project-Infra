const { logger } = require('../platform/logger');

function notFoundHandler(req, res) {
  res.status(404).json({
    error: 'NOT_FOUND',
    message: `Route ${req.method} ${req.path} not found`,
    timestamp: new Date().toISOString(),
  });
}

function errorHandler(err, req, res, next) {
  const status = err.status || err.statusCode || 500;
  const code = err.code || 'INTERNAL_ERROR';

  // Structured, trace-stamped server-side log (full error incl. stack). The stack
  // and internal 5xx messages NEVER reach the HTTP response.
  const log = logger('errorHandler');
  if (status >= 500) {
    log.error({ err: err.message, stack: err.stack, code, method: req.method, path: req.path, requestId: req.requestId }, 'unhandled error');
  } else {
    log.debug({ code, status, method: req.method, path: req.path }, 'request error');
  }

  res.status(status).json({
    error: code,
    // Generic message for server faults; only client-error (4xx) messages are surfaced.
    message: status >= 500 ? 'Internal server error' : (err.message || 'Error'),
    timestamp: new Date().toISOString(),
    requestId: req.requestId,
  });
}

module.exports = {
  notFoundHandler,
  errorHandler,
};
