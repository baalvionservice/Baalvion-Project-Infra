const express = require('express');
const morgan = require('morgan');
const { createProxyMiddleware } = require('http-proxy-middleware');
const authMiddleware = require('./middleware/auth.middleware');

const app = express();

app.use(morgan('dev'));
app.use(express.json());

// Routes mapping
const services = {
  user: process.env.USER_SERVICE_URL || 'http://localhost:3001',
  case: process.env.CASE_SERVICE_URL || 'http://localhost:3002',
  payment: process.env.PAYMENT_SERVICE_URL || 'http://localhost:8080'
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