'use strict';
/**
 * On-demand reconciliation sweep (ops):  node reconcile.js
 * Detection-only — prints a JSON drift report and exits non-zero if any drift is found.
 */
const { reconcileOnce } = require('./services/reconciliation');

(async () => {
    try {
        const result = await reconcileOnce(null);
        console.log(JSON.stringify(result, null, 2));
        const dirty = result.driftCount > 0 || result.stuckOutboxCount > 0 || result.failedOutboxCount > 0;
        process.exit(dirty ? 1 : 0);
    } catch (e) {
        console.error('[reconcile] failed:', e.message);
        process.exit(2);
    }
})();
