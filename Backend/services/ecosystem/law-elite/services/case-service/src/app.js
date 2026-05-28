const express = require('express');
const app = express();

app.use(express.json());

const cases = [
  { id: 'CASE_992', title: 'Enterprise Compliance Audit', status: 'active', client: 'Jonathan Edwards' }
];

app.get('/health', (req, res) => res.json({ status: 'CASE_SERVICE_UP' }));

app.get('/api/cases', (req, res) => res.json(cases));

app.post('/api/cases', (req, res) => {
  const newCase = { id: `CASE_${Date.now()}`, ...req.body, status: 'open' };
  cases.push(newCase);
  // Placeholder for event emission (e.g. publishToKafka('CASE_CREATED', newCase))
  res.status(201).json(newCase);
});

module.exports = app;