#!/usr/bin/env node
'use strict';
/**
 * Bulk-invite users to an org from a CSV — the operator tool for onboarding 100+ people to a site
 * (e.g. ControlTheMarket) into the free/trial tier. Run ON the auth-service host with its env
 * loaded (needs DB access). Invited users accept via the (CTM-branded) link, which creates their
 * account + verifies their email; the downstream service (ctm-service) auto-provisions their
 * profile + free plan on first authenticated request.
 *
 *   Usage:
 *     node scripts/bulkInviteFromCsv.js <orgId> <csvPath> <requesterUserId> [frontendUrl] [defaultRole]
 *
 *   CSV (header row required): email,role,fullName     (role + fullName optional per row)
 *   - <requesterUserId> MUST have manage-users on <orgId> (e.g. the org owner) — authz is enforced.
 *   - [frontendUrl] defaults to https://controlthemarket.com so accept links are CTM-branded.
 *   - [defaultRole] is used for rows that omit a role (default: member).
 *
 *   Email delivery requires SMTP/SES configured (SMTP_HOST/SMTP_USER/SMTP_PASS); otherwise the
 *   mailer logs invites to the console instead of sending them.
 */
const path = require('path');
const fs = require('fs');

// Minimal CSV parser: supports double-quoted fields with embedded commas / escaped quotes.
function splitRow(line) {
    const out = []; let cur = ''; let q = false;
    for (let i = 0; i < line.length; i++) {
        const c = line[i];
        if (q) {
            if (c === '"' && line[i + 1] === '"') { cur += '"'; i++; }
            else if (c === '"') q = false;
            else cur += c;
        } else if (c === '"') q = true;
        else if (c === ',') { out.push(cur); cur = ''; }
        else cur += c;
    }
    out.push(cur);
    return out.map((s) => s.trim());
}

function parseCsv(text) {
    const lines = text.split(/\r?\n/).filter((l) => l.trim().length > 0);
    if (lines.length === 0) return [];
    const header = splitRow(lines[0]).map((h) => h.toLowerCase());
    const ei = header.indexOf('email');
    const ri = header.indexOf('role');
    const fi = header.indexOf('fullname') >= 0 ? header.indexOf('fullname') : header.indexOf('full_name');
    if (ei < 0) throw new Error('CSV must have an "email" column header');
    const rows = [];
    for (let i = 1; i < lines.length; i++) {
        const cols = splitRow(lines[i]);
        const email = (cols[ei] || '').trim();
        if (!email) continue;
        rows.push({
            email,
            role: ri >= 0 ? (cols[ri] || '').trim() || undefined : undefined,
            fullName: fi >= 0 ? (cols[fi] || '').trim() || undefined : undefined,
        });
    }
    return rows;
}

async function main() {
    const [orgId, csvPath, requesterId, frontendUrl = 'https://controlthemarket.com', defaultRole = 'member'] = process.argv.slice(2);
    if (!orgId || !csvPath || !requesterId) {
        console.error('Usage: node scripts/bulkInviteFromCsv.js <orgId> <csvPath> <requesterUserId> [frontendUrl] [defaultRole]');
        process.exit(2);
    }

    const text = fs.readFileSync(path.resolve(csvPath), 'utf8');
    const rows = parseCsv(text).map((r) => ({ email: r.email, role: r.role || defaultRole, fullName: r.fullName }));
    if (rows.length === 0) { console.error('No rows with an email found in CSV'); process.exit(1); }
    console.log(`Inviting ${rows.length} user(s) to org ${orgId} (accept links → ${frontendUrl}) …`);

    const teamService = require('../service/teamService');
    const CHUNK = 25;
    const invited = []; const failed = [];
    for (let i = 0; i < rows.length; i += CHUNK) {
        const batch = rows.slice(i, i + CHUNK);
        const res = await teamService.bulkInvite({ orgId, invites: batch, requesterId, frontendUrl });
        invited.push(...res.invited); failed.push(...res.failed);
        console.log(`  batch ${Math.floor(i / CHUNK) + 1}: +${res.invited.length} invited, ${res.failed.length} failed`);
    }

    console.log(`\nDone. Invited: ${invited.length}, Failed: ${failed.length}`);
    if (failed.length) console.log('Failures:', JSON.stringify(failed, null, 2));
    process.exit(failed.length && invited.length === 0 ? 1 : 0);
}

main().catch((err) => { console.error('bulkInviteFromCsv failed:', err && (err.message || err)); process.exit(1); });
