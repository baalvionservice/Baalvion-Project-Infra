'use strict';
const crypto = require('crypto');

// Short, URL-safe, unguessable — regenerated on the rare collision in the caller
// (the DB unique index on tracking_code is the real guard). Pulled into its own module
// (no db import) so it's testable without a database — see test/affiliateSchemas.test.js.
const generateTrackingCode = () => crypto.randomBytes(6).toString('base64url');

module.exports = { generateTrackingCode };
