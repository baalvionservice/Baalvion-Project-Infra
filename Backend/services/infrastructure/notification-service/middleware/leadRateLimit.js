'use strict';
// Stricter, dedicated limiter for the public (UNAUTHENTICATED) lead-notification endpoint —
// separate from the generous global IP limiter in index.js. This route triggers a real email
// send per request, so it needs a tighter ceiling than general API traffic. The per-recipient
// hourly cap in emailService.js (checkRateLimit) is a second, independent layer: even if this
// limiter were bypassed across many IPs, total volume to any one team inbox still caps out.
const rateLimit = require('express-rate-limit');

module.exports = () => rateLimit({
    windowMs: 15 * 60_000,
    max: parseInt(process.env.LEAD_RATE_LIMIT_PER_15MIN || '5', 10),
    standardHeaders: true,
    legacyHeaders: false,
    message: { success: false, error: { code: 'RATE_LIMITED', message: 'Too many submissions. Please try again later.' } },
});
