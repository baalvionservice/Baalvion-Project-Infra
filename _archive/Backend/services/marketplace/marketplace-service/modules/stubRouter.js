'use strict';
// Mounted placeholder for modules scaffolded but not yet implemented (per the roadmap).
// Keeps the API surface discoverable and the service wired end-to-end.
module.exports = (name, phase) => {
    const router = require('express').Router();
    router.get('/', (req, res) =>
        res.json({ success: true, data: { items: [], module: name, status: 'scaffolded', phase } }));
    return router;
};
