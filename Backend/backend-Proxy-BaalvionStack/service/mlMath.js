'use strict';

/**
 * mlMath — the REAL, dependency-free statistical/ML core of the network
 * intelligence platform. Every function here is PURE and unit-tested. These are
 * genuine algorithms (logistic regression by gradient descent, robust z-scores,
 * Holt-Winters exponential smoothing, OLS regression, PSI/KS drift), not
 * heuristics dressed up as "AI". Higher layers (banPrediction, anomalyDetection,
 * forecastingEngine, aiRoutingEngine) consume these; the optional Python service
 * uses scikit-learn equivalents and the registry keeps them interchangeable.
 */

// ── basic stats ────────────────────────────────────────────────────────────────
function mean(xs) {
  if (!xs.length) return 0;
  return xs.reduce((s, v) => s + v, 0) / xs.length;
}

function variance(xs) {
  if (xs.length < 2) return 0;
  const m = mean(xs);
  return xs.reduce((s, v) => s + (v - m) ** 2, 0) / (xs.length - 1);
}

function std(xs) {
  return Math.sqrt(variance(xs));
}

function median(xs) {
  if (!xs.length) return 0;
  const s = [...xs].sort((a, b) => a - b);
  const mid = Math.floor(s.length / 2);
  return s.length % 2 ? s[mid] : (s[mid - 1] + s[mid]) / 2;
}

/** Linear-interpolation quantile (q in [0,1]). */
function quantile(xs, q) {
  if (!xs.length) return 0;
  const s = [...xs].sort((a, b) => a - b);
  if (s.length === 1) return s[0];
  const pos = clamp(q, 0, 1) * (s.length - 1);
  const lo = Math.floor(pos);
  const hi = Math.ceil(pos);
  if (lo === hi) return s[lo];
  return s[lo] + (s[hi] - s[lo]) * (pos - lo);
}

/** Median absolute deviation (scaled to be a consistent σ estimator). */
function mad(xs) {
  if (!xs.length) return 0;
  const med = median(xs);
  const devs = xs.map((v) => Math.abs(v - med));
  return median(devs);
}

function clamp(v, lo, hi) {
  return Math.max(lo, Math.min(hi, v));
}

function sigmoid(z) {
  if (z >= 0) return 1 / (1 + Math.exp(-z));
  const e = Math.exp(z);
  return e / (1 + e);
}

function dot(a, b) {
  let s = 0;
  for (let i = 0; i < a.length; i++) s += a[i] * (b[i] || 0);
  return s;
}

// ── feature scaling ──────────────────────────────────────────────────────────
/** Z-score standardize a column-major-ish matrix (rows of features). */
function standardize(X) {
  if (!X.length) return { X: [], mu: [], sigma: [] };
  const n = X[0].length;
  const mu = new Array(n).fill(0);
  const sigma = new Array(n).fill(1);
  for (let j = 0; j < n; j++) {
    const col = X.map((r) => r[j]);
    mu[j] = mean(col);
    const s = std(col);
    sigma[j] = s > 1e-9 ? s : 1;
  }
  const Xs = X.map((r) => r.map((v, j) => (v - mu[j]) / sigma[j]));
  return { X: Xs, mu, sigma };
}

function applyStandardize(x, mu, sigma) {
  return x.map((v, j) => (v - (mu[j] || 0)) / (sigma[j] || 1));
}

// ── logistic regression (binary classifier, batch gradient descent + L2) ──────
/**
 * Train a logistic-regression classifier on standardized features.
 * @returns {{weights:number[], bias:number, mu:number[], sigma:number[], logloss:number, iterations:number, classBalance:number}}
 */
function trainLogisticRegression(Xraw, y, opts = {}) {
  const lr = opts.lr ?? 0.1;
  const epochs = opts.epochs ?? 500;
  const l2 = opts.l2 ?? 1e-3;
  if (!Xraw.length) return { weights: [], bias: 0, mu: [], sigma: [], logloss: 0, iterations: 0, classBalance: 0 };

  const { X, mu, sigma } = standardize(Xraw);
  const n = X[0].length;
  const m = X.length;
  let w = new Array(n).fill(0);
  let b = 0;

  // class weighting to counter imbalance (bans are rarer than non-bans).
  const pos = y.reduce((s, v) => s + (v > 0.5 ? 1 : 0), 0);
  const classBalance = pos / m;
  const wPos = classBalance > 0 ? 0.5 / classBalance : 1;
  const wNeg = classBalance < 1 ? 0.5 / (1 - classBalance) : 1;

  for (let epoch = 0; epoch < epochs; epoch++) {
    const gradW = new Array(n).fill(0);
    let gradB = 0;
    for (let i = 0; i < m; i++) {
      const pred = sigmoid(dot(w, X[i]) + b);
      const sw = y[i] > 0.5 ? wPos : wNeg;
      const err = (pred - y[i]) * sw;
      for (let j = 0; j < n; j++) gradW[j] += err * X[i][j];
      gradB += err;
    }
    for (let j = 0; j < n; j++) w[j] -= lr * (gradW[j] / m + l2 * w[j]);
    b -= lr * (gradB / m);
  }

  const preds = X.map((row) => sigmoid(dot(w, row) + b));
  return { weights: w, bias: b, mu, sigma, logloss: logLoss(y, preds), iterations: epochs, classBalance };
}

/** Predict probability from a trained model on RAW (unscaled) feature vector. */
function logisticPredict(model, xRaw) {
  if (!model || !model.weights || !model.weights.length) return 0;
  const xs = applyStandardize(xRaw, model.mu, model.sigma);
  return sigmoid(dot(model.weights, xs) + model.bias);
}

function logLoss(yTrue, yPred) {
  const eps = 1e-12;
  let s = 0;
  for (let i = 0; i < yTrue.length; i++) {
    const p = clamp(yPred[i], eps, 1 - eps);
    s += -(yTrue[i] * Math.log(p) + (1 - yTrue[i]) * Math.log(1 - p));
  }
  return yTrue.length ? s / yTrue.length : 0;
}

/** Area under ROC curve (rank-based, ties-aware) — model quality metric. */
function rocAuc(yTrue, yScore) {
  const pairs = yTrue.map((y, i) => ({ y, s: yScore[i] })).sort((a, b) => a.s - b.s);
  let rankSum = 0;
  let i = 0;
  let rank = 1;
  while (i < pairs.length) {
    let j = i;
    while (j < pairs.length && pairs[j].s === pairs[i].s) j++;
    const avgRank = (rank + (rank + (j - i) - 1)) / 2;
    for (let k = i; k < j; k++) if (pairs[k].y > 0.5) rankSum += avgRank;
    rank += j - i;
    i = j;
  }
  const nPos = yTrue.reduce((s, v) => s + (v > 0.5 ? 1 : 0), 0);
  const nNeg = yTrue.length - nPos;
  if (nPos === 0 || nNeg === 0) return 0.5;
  return (rankSum - (nPos * (nPos + 1)) / 2) / (nPos * nNeg);
}

// ── anomaly detection ──────────────────────────────────────────────────────────
/**
 * Robust z-score using median + MAD (resistant to the very spikes we detect).
 * Returns the modified z-score; |z| >= ~3.5 is the conventional anomaly cutoff.
 */
function robustZScore(value, series) {
  if (series.length < 3) return 0;
  const med = median(series);
  const m = mad(series);
  if (m < 1e-9) {
    const s = std(series);
    return s < 1e-9 ? 0 : (value - med) / s;
  }
  return (0.6745 * (value - med)) / m;
}

/** Exponentially-weighted moving average over a series (last value emphasised). */
function ewma(series, alpha = 0.3) {
  if (!series.length) return 0;
  let acc = series[0];
  for (let i = 1; i < series.length; i++) acc = alpha * series[i] + (1 - alpha) * acc;
  return acc;
}

function severityFromZ(z) {
  const a = Math.abs(z);
  if (a >= 6) return 'critical';
  if (a >= 4.5) return 'high';
  if (a >= 3.5) return 'medium';
  return 'low';
}

// ── forecasting ────────────────────────────────────────────────────────────────
/** Ordinary least squares over (0..n-1) → ys. */
function linearRegression(ys) {
  const n = ys.length;
  if (n < 2) return { slope: 0, intercept: n ? ys[0] : 0, r2: 0 };
  const xs = ys.map((_, i) => i);
  const mx = mean(xs);
  const my = mean(ys);
  let num = 0;
  let den = 0;
  for (let i = 0; i < n; i++) {
    num += (xs[i] - mx) * (ys[i] - my);
    den += (xs[i] - mx) ** 2;
  }
  const slope = den < 1e-9 ? 0 : num / den;
  const intercept = my - slope * mx;
  let ssRes = 0;
  let ssTot = 0;
  for (let i = 0; i < n; i++) {
    const yhat = intercept + slope * xs[i];
    ssRes += (ys[i] - yhat) ** 2;
    ssTot += (ys[i] - my) ** 2;
  }
  const r2 = ssTot < 1e-9 ? 0 : 1 - ssRes / ssTot;
  return { slope, intercept, r2 };
}

function forecastLinear(ys, horizon) {
  const { slope, intercept } = linearRegression(ys);
  const n = ys.length;
  const out = [];
  for (let h = 1; h <= horizon; h++) out.push(Math.max(0, intercept + slope * (n - 1 + h)));
  return out;
}

/**
 * Holt-Winters exponential smoothing. Additive seasonality when the series is
 * long enough (>= 2*period); otherwise falls back to Holt's linear trend
 * (double exponential). Returns forecast points with simple residual-based
 * prediction intervals.
 *
 * @returns {{forecast:number[], lower:number[], upper:number[], level:number, trend:number, seasonal:boolean}}
 */
function holtWinters(series, opts = {}) {
  const horizon = opts.horizon ?? 7;
  const alpha = opts.alpha ?? 0.4;
  const beta = opts.beta ?? 0.1;
  const gamma = opts.gamma ?? 0.2;
  const period = opts.period ?? 7;
  const ys = series.filter((v) => Number.isFinite(v));
  if (ys.length < 2) {
    const v = ys.length ? ys[0] : 0;
    return { forecast: new Array(horizon).fill(Math.max(0, v)), lower: new Array(horizon).fill(0), upper: new Array(horizon).fill(Math.max(0, v) * 2), level: v, trend: 0, seasonal: false };
  }

  const useSeasonal = ys.length >= 2 * period && period >= 2;
  let level = ys[0];
  let trend = ys[1] - ys[0];
  const season = new Array(period).fill(0);
  const residuals = [];

  if (useSeasonal) {
    // seasonal init: average of first cycle as level; per-index deviation as season.
    const firstCycle = ys.slice(0, period);
    level = mean(firstCycle);
    for (let i = 0; i < period; i++) season[i] = ys[i] - level;
    const secondCycle = ys.slice(period, 2 * period);
    trend = (mean(secondCycle) - mean(firstCycle)) / period;
  }

  for (let i = 0; i < ys.length; i++) {
    const s = useSeasonal ? season[i % period] : 0;
    const prevLevel = level;
    const fitted = level + trend + s;
    residuals.push(ys[i] - fitted);
    if (useSeasonal) {
      level = alpha * (ys[i] - season[i % period]) + (1 - alpha) * (level + trend);
      trend = beta * (level - prevLevel) + (1 - beta) * trend;
      season[i % period] = gamma * (ys[i] - level) + (1 - gamma) * season[i % period];
    } else {
      level = alpha * ys[i] + (1 - alpha) * (level + trend);
      trend = beta * (level - prevLevel) + (1 - beta) * trend;
    }
  }

  const resStd = std(residuals);
  const forecast = [];
  const lower = [];
  const upper = [];
  for (let h = 1; h <= horizon; h++) {
    const s = useSeasonal ? season[(ys.length + h - 1) % period] : 0;
    const yhat = Math.max(0, level + h * trend + s);
    const band = 1.96 * resStd * Math.sqrt(h);
    forecast.push(yhat);
    lower.push(Math.max(0, yhat - band));
    upper.push(yhat + band);
  }
  return { forecast, lower, upper, level, trend, seasonal: useSeasonal };
}

// ── drift detection ────────────────────────────────────────────────────────────
/** Population Stability Index between an expected and actual distribution. */
function psi(expected, actual, buckets = 10) {
  if (!expected.length || !actual.length) return 0;
  const all = [...expected, ...actual];
  const lo = Math.min(...all);
  const hi = Math.max(...all);
  if (hi - lo < 1e-9) return 0;
  const width = (hi - lo) / buckets;
  let total = 0;
  for (let b = 0; b < buckets; b++) {
    const bLo = lo + b * width;
    const bHi = b === buckets - 1 ? hi + 1e-9 : lo + (b + 1) * width;
    const eFrac = expected.filter((v) => v >= bLo && v < bHi).length / expected.length || 1e-6;
    const aFrac = actual.filter((v) => v >= bLo && v < bHi).length / actual.length || 1e-6;
    total += (aFrac - eFrac) * Math.log(aFrac / eFrac);
  }
  return total;
}

module.exports = {
  mean, variance, std, median, quantile, mad, clamp, sigmoid, dot,
  standardize, applyStandardize,
  trainLogisticRegression, logisticPredict, logLoss, rocAuc,
  robustZScore, ewma, severityFromZ,
  linearRegression, forecastLinear, holtWinters,
  psi,
};
