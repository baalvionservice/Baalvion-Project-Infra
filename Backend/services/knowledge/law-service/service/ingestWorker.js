'use strict';
// Optional scheduler for the official-source fetcher. Off unless INGEST_ENABLED=true, so a
// new deploy never starts calling third-party sites on its own. Drafts only; nothing goes live.
const db = require('../models');
const { runAndRecord } = require('./ingest/run');

const LOCK_KEY = 728194; // stable advisory-lock id: with several instances only one fetches per cycle
const ENABLED = String(process.env.INGEST_ENABLED || 'false').toLowerCase() === 'true';
const INTERVAL_MS = Math.max(15, Number(process.env.INGEST_INTERVAL_MINUTES || 60)) * 60 * 1000;
let timer = null;

async function cycle() {
    const [[{ locked }]] = await db.sequelize.query(`SELECT pg_try_advisory_lock(${LOCK_KEY}) AS locked`);
    if (!locked) return;
    try {
        const r = await runAndRecord();
        console.log(`[ingest] drafted ${r.created} new, ${r.alreadyKnown} already known${r.sources.some((s) => s.error) ? `, errors: ${r.sources.filter((s) => s.error).map((s) => `${s.id}: ${s.error}`).join('; ')}` : ''}`);
    } catch (err) {
        console.error('[ingest] cycle failed:', err.message);
    } finally {
        await db.sequelize.query(`SELECT pg_advisory_unlock(${LOCK_KEY})`);
    }
}

function startIngestWorker() {
    if (!ENABLED || timer) return;
    setTimeout(cycle, 30 * 1000);
    timer = setInterval(cycle, INTERVAL_MS);
    timer.unref?.();
    console.log(`[ingest] worker started (every ${INTERVAL_MS / 60000} min)`);
}
function stopIngestWorker() { if (timer) { clearInterval(timer); timer = null; } }

module.exports = { startIngestWorker, stopIngestWorker };
