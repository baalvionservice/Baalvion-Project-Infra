'use strict';
/**
 * Delegated authority (Compression, Phase 7) — public surface.
 *
 *   policy  PURE decision evaluation: pre-authorised limits, the never-delegable
 *           list that no configuration can override, and the rota arithmetic that
 *           turns "waiting for someone's morning" into a number of hours.
 *   engine  DB-backed orchestrator — loads delegations and rota, records every
 *           decision, and blocks the right compression stage when a human is
 *           needed so the wait is visible instead of hiding inside a slow stage.
 */
module.exports = {
    policy: require('./policy'),
    engine: require('./authorityEngine'),
};
