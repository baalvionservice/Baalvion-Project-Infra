const express = require('express');
const rateLimit = require('express-rate-limit');
const morgan = require('morgan');
const { createProxyMiddleware } = require('http-proxy-middleware');
const authMiddleware = require('./middleware/auth.middleware');

const app = express();

app.use(morgan('dev'));
// Global IP rate limiter (express-rate-limit, CodeQL-recognized) — generous DoS ceiling.
app.use(rateLimit({ windowMs: 60_000, max: Number(process.env.IP_RATE_LIMIT_MAX) || 1000, standardHeaders: true, legacyHeaders: false }));
app.use(express.json());

// Routes mapping
const services = {
  user: process.env.USER_SERVICE_URL || 'http://localhost:3001',
  case: process.env.CASE_SERVICE_URL || 'http://localhost:3002',
  // Canonical Java payment-service (financial-services-java) PSP gateway, host port 13015.
  payment: process.env.PAYMENT_SERVICE_URL || 'http://localhost:13015'
};

// Health Check
app.get('/health', (req, res) => res.json({ status: 'GATEWAY_OPERATIONAL' }));

// Auth Service (Proxy to User Service)
app.use('/api/auth', createProxyMiddleware({ target: services.user, changeOrigin: true }));

// Protected Service Proxies
app.use('/api/users', authMiddleware, createProxyMiddleware({ target: services.user, changeOrigin: true }));
app.use('/api/cases', authMiddleware, createProxyMiddleware({ target: services.case, changeOrigin: true }));
app.use('/api/payments', authMiddleware, createProxyMiddleware({ target: services.payment, changeOrigin: true }));

module.exports = app;