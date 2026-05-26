const express = require('express');
const app = express();

app.use(express.json());

const users = [
  { id: '1', name: 'Harvey Specter', role: 'lawyer', status: 'active' },
  { id: '2', name: 'Jonathan Edwards', role: 'client', status: 'active' }
];

app.get('/health', (req, res) => res.json({ status: 'USER_SERVICE_UP' }));

app.get('/api/users', (req, res) => res.json(users));

app.get('/api/users/:id', (req, res) => {
  const user = users.find(u => u.id === req.params.id);
  user ? res.json(user) : res.status(404).json({ error: 'User not located' });
});

module.exports = app;