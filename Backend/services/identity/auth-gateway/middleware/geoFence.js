'use strict';
// Phase 7 — geo-fence middleware. Compares session-recorded country against request-detected country.
// Modes (GEO_ENFORCEMENT env, also in config.geoEnforcement):
//   log     → detect + log mismatch; never block (default — safe for rollout)
//   warn    → detect + warn; never block
//   enforce → detect + block on mismatch with 403 GEO_MISMATCH
//
// Reads config at call-time so GEO_ENFORCEMENT can be changed with a restart.
const { detectGeo, geoMatch } = require('../lib/geoDetect');
const config = require('../config/appConfig');

function geoFence() {
  return (req, res, next) => {
    try {
      const mode = config.geoEnforcement || 'log';
      const { country, source } = detectGeo(req);
      req._geoDetected = { country, source };

      const session = req._session;
      if (session && session.geo && session.geo.country) {
        const result = geoMatch(session.geo.country, country);
        if (result.match === false) {
          const msg = `[geo-fence] country mismatch sid=${session.sessionId} session=${result.sessionGeo} request=${result.requestGeo} mode=${mode}`;
          if (mode === 'enforce') {
            console.warn(msg);
            return res.status(403).json({ error: { code: 'GEO_MISMATCH', message: 'Geographic location change detected; please re-authenticate' } });
          }
          if (mode === 'warn') console.warn(msg);
          else console.info(msg);
        }
      }
    } catch (e) {
      console.error('[geo-fence] error:', e.message);
    }
    return next();
  };
}

module.exports = { geoFence };
