'use strict';

// =====================
// Global Error Handlers
// =====================
process.on('uncaughtException', (err) => {
    console.error('UNCAUGHT EXCEPTION:', err);
});

process.on('unhandledRejection', (err) => {
    console.error('UNHANDLED REJECTION:', err);
});

// =====================
// Imports
// =====================
const express = require('express');
const app = express();

// =====================
// Middlewares
// =====================
app.use(express.json());

// =====================
// Test Route
// =====================
app.get('/', (req, res) => {
    res.json({ message: 'API is alive 🚀' });
});

// =====================
// Port Setup
// =====================
const PORT = process.env.PORT || 3000;

// =====================
// Start Server
// =====================
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});