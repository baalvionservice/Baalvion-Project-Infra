'use strict';
/**
 * Forward seam for the v3 streaming-first architecture.
 *
 * v2 persists events to Postgres. v3 makes the pipeline streaming-first
 * (event → stream → processor → ClickHouse/Redis/S3). This module is the single
 * attach point: today it is a no-op, so v2 runs unchanged. A v3 deploy sets
 * ANALYTICS_STREAM_SINK=kafka|kinesis|redpanda and drops a driver at
 * ./sinks/<name>.js exporting `emit(topic, event)`. `eventService.persist` already
 * calls `streamSink.emit(evt)` fire-and-forget, so enabling the stream is a config
 * + driver change — not a rewrite. Dual-writing (Postgres + stream) is how the
 * migration runs without downtime.
 */
const SINK = process.env.ANALYTICS_STREAM_SINK || 'noop';
const TOPIC_RAW = process.env.ANALYTICS_STREAM_TOPIC || 'events.raw';

let driver;
function getDriver() {
    if (driver !== undefined) return driver;
    if (SINK === 'noop') { driver = null; return driver; }
    try { driver = require(`./sinks/${SINK}`); } catch { driver = null; }
    return driver;
}

/** Emit a persisted event to the stream (fire-and-forget, fail-open). No-op in v2. */
async function emit(event) {
    const d = getDriver();
    if (!d || typeof d.emit !== 'function') return;
    try { await d.emit(TOPIC_RAW, event); } catch { /* fail-open */ }
}

module.exports = { emit, SINK, TOPIC_RAW };
