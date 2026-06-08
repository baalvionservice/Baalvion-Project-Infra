'use strict';
const { tryGetSdk } = require('./sdk');
const SupplierEvents = Object.freeze({ STAGE_CHANGED: 'gtos.supplier.stage_changed.v1', SCORECARD_PUBLISHED: 'gtos.supplier.scorecard.published.v1' });
async function emit(t, p, m) { const sdk = tryGetSdk(); if (!sdk) return; try { await sdk.events.publish(t, p, m); } catch (e) { try { sdk.logger.warn({ err: e && e.message, eventType: t }, 'publish failed'); } catch { /* noop */ } } }
const emitSafe = (t, p, m) => { void emit(t, p, m); };
module.exports = { SupplierEvents, emit, emitSafe };
