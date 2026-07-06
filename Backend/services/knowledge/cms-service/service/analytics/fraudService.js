'use strict';
/**
 * Fraud + bot intelligence (heuristic scoring).
 *
 * Produces a 0..1 fraud score per event and an action (allow / flag / block).
 * Deliberately dependency-free heuristics (bot UA, UA entropy, referrer spam,
 * clock skew/replay, datacenter hints). ML-based scoring (behavioral clustering,
 * click-velocity models, IP-reputation feeds) is the v3 upgrade — this layer is
 * the seam it slots behind.
 *
 * Thresholds: score >= BLOCK → drop (not stored); >= FLAG → stored + excluded
 * from metric rollups (still counted in the Security module). Below → allowed.
 */
const BLOCK = 0.9;
const FLAG = 0.5;

// Known referral-spam / ghost-traffic hosts (extend via config as needed).
const REFERRER_SPAM = /(semalt|buttons-for-website|darodar|econom|ilovevitaly|priceg|blackhatworth|hulfingtonpost|floating-share|social-buttons|4webmasters|guardlink)/i;

/**
 * Score one normalized event. `ctx` may carry { receivedAt } for replay checks.
 * Returns { score, action, reasons }.
 */
function scoreEvent(evt) {
    const reasons = [];
    let score = 0;

    const device = evt.device || {};
    if (device.type === 'bot') { score += 0.6; reasons.push('bot_ua'); }

    // UA entropy: an event whose device fields are all unknown looks synthetic.
    if (device.type === 'unknown' && device.os === 'unknown' && device.browser === 'unknown') {
        score += 0.25; reasons.push('no_ua_signal');
    }

    // Referrer spam / ghost traffic.
    if (evt.referrer && REFERRER_SPAM.test(evt.referrer)) { score += 0.5; reasons.push('referrer_spam'); }

    // Replay / clock skew: occurredAt far in the future, or long after receivedAt.
    const occ = Date.parse(evt.occurredAt);
    const recv = Date.parse(evt.receivedAt || evt.occurredAt);
    if (Number.isFinite(occ) && Number.isFinite(recv)) {
        const skewMin = Math.abs(recv - occ) / 60000;
        if (skewMin > 60) { score += 0.2; reasons.push('clock_skew'); }
        if (occ - recv > 5 * 60000) { score += 0.3; reasons.push('future_timestamp'); }
    }

    // Missing session/visitor identity on a page_view is suspicious for first-party.
    if (evt.provider === 'first_party' && evt.event === 'page_view' && !evt.sessionId && !evt.visitorId) {
        score += 0.15; reasons.push('no_identity');
    }

    score = Math.min(1, Math.round(score * 100) / 100);
    const action = score >= BLOCK ? 'block' : score >= FLAG ? 'flag' : 'allow';
    return { score, action, reasons };
}

module.exports = { scoreEvent, BLOCK, FLAG };
