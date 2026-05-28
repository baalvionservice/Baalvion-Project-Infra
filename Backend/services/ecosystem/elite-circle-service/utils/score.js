'use strict';
// Founder/startup quality scoring (mirrors the design's weighted rubric).
// Pure + null-safe so it can run in the seed and in the live endpoint.

const clamp01 = (n) => Math.max(0, Math.min(1, n));
const has = (v) => v != null && String(v).trim() !== '';
const words = (s) => (s ? String(s).trim().split(/\s+/).filter(Boolean).length : 0);
const arr = (v) => (Array.isArray(v) ? v : []);

function computeScores(p = {}, metrics = [], verifiedKinds = []) {
    const COMPLETE_FIELDS = ['company_name', 'headline', 'idea', 'problem', 'solution', 'why_now',
        'differentiation', 'sector', 'region', 'stage', 'video_url', 'contact_email', 'market_tam', 'business_model'];
    const completeness = clamp01(COMPLETE_FIELDS.filter((f) => has(p[f])).length / COMPLETE_FIELDS.length);

    const anyVerifiedMetric = metrics.some((m) => m.verified);
    const traction = metrics.length === 0 ? 0.08 : clamp01(metrics.length / 4) * (anyVerifiedMetric ? 1 : 0.7);

    const clarity = clamp01(
        (has(p.idea) ? clamp01(words(p.idea) / 300) : 0) * 0.5 +
        (has(p.company_about) ? 0.25 : 0) +
        (has(p.why_now) ? 0.25 : 0));

    const exits = arr(p.work_experience).some((w) => /exit|acqui|ipo/i.test(JSON.stringify(w || '')));
    const founderCred = clamp01(
        clamp01(arr(p.work_experience).length / 2) * 0.5 +
        (exits ? 0.25 : 0) +
        (arr(p.skills).length ? 0.25 : 0));

    const market = clamp01((has(p.market_tam) ? 0.6 : 0) + (has(p.why_now) ? 0.4 : 0));
    const differentiation = has(p.differentiation) ? 1 : 0.2;
    const socialProof = clamp01(
        clamp01(arr(p.interview).length / 3) * 0.4 +
        (has(p.video_url) ? 0.3 : 0) +
        (has(p.linkedin_url) || has(p.website) ? 0.3 : 0));
    const verification = clamp01(verifiedKinds.length / 4);

    const breakdown = {
        completeness: Math.round(completeness * 100),
        traction: Math.round(traction * 100),
        clarity: Math.round(clarity * 100),
        founder_credibility: Math.round(founderCred * 100),
        market: Math.round(market * 100),
        differentiation: Math.round(differentiation * 100),
        social_proof: Math.round(socialProof * 100),
        verification: Math.round(verification * 100),
    };

    const profile_score = Math.round(100 * (
        0.20 * completeness + 0.22 * traction + 0.12 * clarity + 0.15 * founderCred +
        0.10 * market + 0.08 * differentiation + 0.08 * socialProof + 0.05 * verification));

    const readiness_score = Math.round(100 * (
        0.30 * traction + 0.20 * completeness + 0.20 * (p.raising ? 1 : 0.3) +
        0.15 * ((has(p.pitch_deck_url) || has(p.video_url)) ? 1 : 0) + 0.15 * verification));

    // Red flags surfaced for the founder + investors.
    const flags = [];
    if (!has(p.why_now)) flags.push('Missing "why now" — the #1 question investors ask.');
    if (metrics.length === 0) flags.push('No traction metrics added yet.');
    if (!anyVerifiedMetric && metrics.length) flags.push('Metrics are self-reported (not verified).');
    if (!has(p.video_url)) flags.push('No founder/pitch video.');
    if (verifiedKinds.length === 0) flags.push('Profile is unverified.');
    if (words(p.idea) < 80) flags.push('Idea description is thin (<80 words).');

    return { profile_score, readiness_score, breakdown, flags };
}

module.exports = { computeScores };
