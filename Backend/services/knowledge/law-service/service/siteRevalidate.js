'use strict';
// Tells the public website its cached content changed, so an admin edit shows
// up in seconds instead of at the next cache window. Fire-and-forget: an
// unreachable site must never fail an admin save. Off unless both env vars are set.
const URL_ = process.env.LEN_REVALIDATE_URL;
const SECRET = process.env.LEN_REVALIDATE_SECRET;

function notifySite(paths = []) {
    if (!URL_ || !SECRET) return;
    fetch(URL_, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-revalidate-secret': SECRET },
        body: JSON.stringify({ paths }),
        signal: AbortSignal.timeout(4000),
    }).catch(() => { /* best effort */ });
}

module.exports = { notifySite };
