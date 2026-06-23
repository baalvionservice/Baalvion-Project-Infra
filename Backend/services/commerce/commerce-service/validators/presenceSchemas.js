'use strict';
const { z } = require('zod');

// Heartbeat body for the public storefront presence beacon. `visitorId` is an opaque,
// client-generated token (sessionStorage-scoped) — never a user id — so one open tab counts
// as one live visitor without any auth.
exports.heartbeatSchema = z.object({
    visitorId: z.string().trim().min(1).max(100),
});
