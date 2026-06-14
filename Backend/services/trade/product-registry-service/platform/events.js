'use strict';
const { tryGetSdk } = require('./sdk');
const ProductEvents = Object.freeze({ UPSERTED: 'gtos.product.upserted.v1', RETIRED: 'gtos.product.retired.v1' });
async function emit(t, p, m) { const sdk = tryGetSdk(); if (!sdk) return; try { await sdk.events.publish(t, p, m); } catch (e) { try { sdk.logger.warn({ err: e && e.message, eventType: t }, 'publish failed'); } catch { /* noop */ } } }
const emitSafe = (t, p, m) => { void emit(t, p, m); };
module.exports = { ProductEvents, emit, emitSafe };
