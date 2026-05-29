const { v4: uuidv4 } = require('uuid');
const { AsyncLocalStorage } = require('async_hooks');

const requestALS = new AsyncLocalStorage();

function requestContext(req, res, next) {
  const requestId = req.headers['x-request-id'] || uuidv4();
  const traceId = req.headers['x-trace-id'] || requestId;

  req.requestId = requestId;
  req.traceId = traceId;

  requestALS.run({
    requestId,
    traceId,
    startTime: Date.now(),
  }, () => {
    res.setHeader('x-request-id', requestId);
    res.setHeader('x-trace-id', traceId);

    const originalJson = res.json.bind(res);
    res.json = function (data) {
      const duration = Date.now() - (requestALS.getStore()?.startTime || 0);
      res.setHeader('x-response-time', `${duration}ms`);
      return originalJson(data);
    };

    next();
  });
}

function getRequestContext() {
  return requestALS.getStore();
}

module.exports = {
  requestContext,
  getRequestContext,
  requestALS,
};
