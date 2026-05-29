function notFoundHandler(req, res) {
  res.status(404).json({
    error: 'NOT_FOUND',
    message: `Route ${req.method} ${req.path} not found`,
    timestamp: new Date().toISOString(),
  });
}

function errorHandler(err, req, res, next) {
  console.error('[errorHandler]', {
    message: err.message,
    stack: err.stack,
    method: req.method,
    path: req.path,
    requestId: req.requestId,
  });

  const status = err.status || err.statusCode || 500;
  const code = err.code || 'INTERNAL_ERROR';

  res.status(status).json({
    error: code,
    message: err.message || 'Internal server error',
    timestamp: new Date().toISOString(),
    requestId: req.requestId,
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  });
}

module.exports = {
  notFoundHandler,
  errorHandler,
};
