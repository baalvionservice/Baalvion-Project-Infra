'use strict';
const { tryGetSdk } = require('./sdk');
const QualityEvents = Object.freeze({ SCHEDULED: 'gtos.quality.inspection.scheduled.v1', COMPLETED: 'gtos.quality.inspection.completed.v1' });
async function emit(t, p, m) { const sdk = tryGetSdk(); if (!sdk) return; try { await sdk.events.publish(t, p, m); } catch (e) { try { sdk.logger.warn({ err: e && e.message, eventType: t }, 'publish failed'); } catch { /* noop */ } } }
const emitSafe = (t, p, m) => { void emit(t, p, m); };
module.exports = { QualityEvents, emit, emitSafe };
