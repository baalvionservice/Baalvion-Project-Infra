#!/usr/bin/env node
'use strict';
/**
 * Idempotent NodeBB bootstrap: creates the initial community categories + the three
 * per-community groups (member/mod/paid) that community-service's nodebbClient grants/
 * revokes membership in. Run once after NodeBB is up and an admin has completed
 * `./nodebb setup` (see docker-compose.nodebb.yml's first-time bring-up notes).
 *
 *   NODEBB_BASE_URL=http://localhost:4567 NODEBB_WRITE_API_TOKEN=... node seed-categories.js
 *
 * ⚠ VERIFY AT EXECUTION TIME: this targets the nodebb-plugin-write-api's documented
 * /api/v1/categories and /api/v1/groups endpoints. Confirm exact request/response shapes
 * against your installed NodeBB + plugin version before relying on this in production —
 * same caveat as Backend/services/ecosystem/community-service/service/nodebbClient.js,
 * which is the ONLY other place these endpoints are called from (this script is a one-time
 * operator tool, not something community-service itself runs).
 *
 * Keep this list in sync with the seed rows in
 * Backend/database/migrations/031_community_forum_full.sql — after running this script,
 * copy the returned category `cid` values into that community's `communities.nodebb_cid`
 * row (a follow-up UPDATE, not automated here, since this script only talks to NodeBB, not
 * to community-service's own Postgres).
 */

const BASE = process.env.NODEBB_BASE_URL || 'http://localhost:4567';
const TOKEN = process.env.NODEBB_WRITE_API_TOKEN;

const COMMUNITIES = [
    { slug: 'general', name: 'General Discussion', description: 'Open discussion for the whole Market Underworld community.' },
    { slug: 'cybersecurity', name: 'Cybersecurity & Ethical Hacking', description: 'Legal, defensive-security and ethical-hacking discussion.' },
    { slug: 'education', name: 'Education & Mentorship', description: 'Learning resources, study groups, and mentorship.' },
    { slug: 'investors-founders', name: 'Investors & Founders', description: 'Vetted community for investors and startup founders.' },
    { slug: 'trading-markets', name: 'Trading & Markets', description: 'Markets discussion.' },
];

if (!TOKEN) {
    console.error('NODEBB_WRITE_API_TOKEN is required');
    process.exit(1);
}

async function nb(path, options = {}) {
    const res = await fetch(`${BASE}${path}`, {
        ...options,
        headers: { 'content-type': 'application/json', authorization: `Bearer ${TOKEN}`, ...(options.headers || {}) },
    });
    const body = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(`${path} -> ${res.status}: ${body.status?.message || JSON.stringify(body)}`);
    return body;
}

async function ensureGroup(name) {
    try {
        return await nb('/api/v1/groups', { method: 'POST', body: JSON.stringify({ name }) });
    } catch (err) {
        // Already exists — idempotent no-op (write-api returns 4xx on duplicate group name).
        if (/exist/i.test(err.message)) return null;
        throw err;
    }
}

async function ensureCategory(community) {
    // VERIFIED at execution time (2026-07-27, nodebb-plugin-write-api@5.8.20): the response
    // envelope is {code, payload}, not {response} or a top-level cid — the two shapes this
    // used to check for never matched, silently logging cid=undefined every run.
    const created = await nb('/api/v1/categories', {
        method: 'POST',
        body: JSON.stringify({ name: community.name, description: community.description }),
    });
    return created?.payload?.cid;
}

async function main() {
    for (const community of COMMUNITIES) {
        console.log(`[seed] ${community.slug} — creating category + groups`);
        const memberGroup = `community-${community.slug}-member`;
        const modGroup = `community-${community.slug}-mod`;
        const paidGroup = `community-${community.slug}-paid`;

        await ensureGroup(memberGroup);
        await ensureGroup(modGroup);
        await ensureGroup(paidGroup);

        const cid = await ensureCategory(community);
        console.log(`[seed] ${community.slug} -> cid=${cid}, groups=[${memberGroup}, ${modGroup}, ${paidGroup}]`);
        console.log(`[seed]   NOTE: set community.communities.nodebb_cid=${cid}, nodebb_group_member='${memberGroup}', nodebb_group_mod='${modGroup}', nodebb_group_paid='${paidGroup}' WHERE slug='${community.slug}'`);
        console.log('[seed]   NOTE: also set category privileges in NodeBB admin UI — deny "registered-users", grant read/topics/reply to the member group (see plan doc).');
    }
}

main().catch((err) => {
    console.error('[seed] failed:', err.message);
    process.exit(1);
});
