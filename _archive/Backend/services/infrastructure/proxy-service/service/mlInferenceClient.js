'use strict';

/**
 * ML inference client. Delegates heavy models (scikit-learn ban classifier,
 * IsolationForest anomaly, Holt-Winters/ARIMA forecasts) to the Python ml-service
 * when ML_SERVICE_URL is configured, with HMAC-signed requests for integrity.
 * When the service is unavailable it transparently falls back to the in-process
 * Node models (banPrediction / anomalyDetection / forecastingEngine) so the
 * platform never loses its intelligence — the Python tier is an accelerator, not
 * a hard dependency.
 */

const crypto = require('crypto');
const logger = require('./logger');
const intelMetrics = require('../observability/intelligenceMetrics');

const BASE = process.env.ML_SERVICE_URL || '';
const SECRET = process.env.ML_SERVICE_SECRET || '';
const TIMEOUT = Number(process.env.ML_SERVICE_TIMEOUT_MS || 4000);

function isRemoteEnabled() {
  return Boolean(BASE);
}

function sign(bodyStr, ts) {
  if (!SECRET) return '';
  return crypto.createHmac('sha256', SECRET).update(`${ts}.${bodyStr}`).digest('hex');
}

async function callRemote(path, body) {
  const ts = Date.now().toString();
  const bodyStr = JSON.stringify(body);
  const headers = { 'Content-Type': 'application/json', 'X-Baalvion-Ts': ts };
  if (SECRET) headers['X-Baalvion-Signature'] = sign(bodyStr, ts);

  const ac = new AbortController();
  const timer = setTimeout(() => ac.abort(), TIMEOUT);
  const started = Date.now();
  try {
    const res = await fetch(`${BASE.replace(/\/$/, '')}${path}`, { method: 'POST', headers, body: bodyStr, signal: ac.signal });
    if (!res.ok) throw new Error(`ml-service ${res.status}`);
    const json = await res.json();
    intelMetrics.observeInference(path.replace(/\W+/g, '_'), Date.now() - started);
    return json;
  } finally {
    clearTimeout(timer);
  }
}

/** Ban probability — remote sklearn model, else Node logistic model. */
async function predictBan(features) {
  if (isRemoteEnabled()) {
    try {
      const r = await callRemote('/predict/ban', { features });
      if (r && typeof r.probability === 'number') return r.probability;
    } catch (err) { logger.warn('[mlClient] remote ban predict failed, using local:', err.message); }
  }
  return require('./banPrediction').predictBanProbability(features);
}

/** Anomaly score — remote IsolationForest, else Node robust-z. */
async function detectAnomaly(value, history) {
  if (isRemoteEnabled()) {
    try {
      const r = await callRemote('/detect/anomaly', { value, history });
      if (r && typeof r.score === 'number') return r;
    } catch (err) { logger.warn('[mlClient] remote anomaly failed, using local:', err.message); }
  }
  return require('./anomalyDetection').scoreAnomaly(value, history);
}

/** Forecast — remote (statsmodels) else Node Holt-Winters. */
async function forecast(series, horizon = 7) {
  if (isRemoteEnabled()) {
    try {
      const r = await callRemote('/forecast', { series, horizon });
      if (r && Array.isArray(r.forecast)) return r;
    } catch (err) { logger.warn('[mlClient] remote forecast failed, using local:', err.message); }
  }
  return require('./mlMath').holtWinters(series, { horizon, period: 7 });
}

/** Verify an inbound HMAC signature (used by the Node side if it ever receives callbacks). */
function verifySignature(bodyStr, ts, sig) {
  if (!SECRET) return true;
  if (!ts || !sig) return false;
  if (Math.abs(Date.now() - Number(ts)) > 5 * 60 * 1000) return false; // 5-min replay window
  const expected = sign(bodyStr, ts);
  try { return crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(sig)); } catch (_) { return false; }
}

module.exports = { isRemoteEnabled, predictBan, detectAnomaly, forecast, verifySignature, sign };
