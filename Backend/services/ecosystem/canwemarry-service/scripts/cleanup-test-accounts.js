'use strict';
/**
 * Remove accounts created by CanWeMarry's automated testing — and nothing else.
 *
 * `auth.users` is the SHARED identity table for the whole platform. It holds accounts
 * belonging to the jobs portal, the admin console and the platform superadmin, none of
 * which this service created or may delete. So the script never works from a date range or
 * a domain: it matches an explicit, reviewable list of the prefixes this service's own test
 * runs used, and refuses anything that does not match.
 *
 * Two ordering constraints come from the schema, not from preference:
 *   - `auth.organizations.owner_id` is ON DELETE NO ACTION, and registration creates one
 *     workspace per account, so the workspace must go first or the delete fails outright.
 *   - `canwemarry.users` cascades from nothing in auth; it is keyed on the subject string,
 *     so its rows are removed here explicitly.
 *
 *   node scripts/cleanup-test-accounts.js          # dry run — reports, changes nothing
 *   node scripts/cleanup-test-accounts.js --apply  # performs the deletion, in one transaction
 */
const db = require('../models');

// Every prefix this service's test runs have used. Adding one is a deliberate act.
const TEST_PREFIXES = [
    'cwm-test-', 'cwm-', 'cwm-invitee-', 'seeker-', 'partner-', 'browser-', 'trace-',
    'proxytest-', 'cookie-', 'hdr-', 'hdr2-', 'hdr3-', 'dbg-', 'flow-', 'flowa-', 'flowb-',
    'final-', 'sowner-', 'sother-', 'smod-', 'p4-', 'p5-', 'p5a-', 'p5b-', 'p5probe-',
    'kbd-', 'kbd2-',
    // Prompt 6 — the auth/gateway hardening pass: verification lifecycle, resend,
    // allow-list, password reset, and the two-person browser journey.
    'p6a-', 'p6b-', 'p6c-', 'p6d-', 'p6e-', 'p6f-', 'p6g-', 'p6h-', 'p6i-', 'p6j-',
    'p6ja-', 'p6jb-', 'p6final-',
    // Prompt 7 — the case + community ecosystem pass.
    'p7a-', 'p7b-', 'p7c-', 'p7dbg-', 'p7sweep-', 'p7host-',
    // Prompt 8 — the operations, moderation and trust pass.
    'p8u-', 'p8c-', 'p8m-', 'p8a-', 'p8sweep-', 'p8sweepb-',
    // Prompt 9 — the production-hardening pass.
    'p9r-', 'p9o-', 'p9x-', 'p9h-', 'p9m-', 'p9a-', 'p9u-', 'p9c-', 'p9sweep-',
    // Prompt 10 — the release-candidate audit.
    'p10f-', 'p10j-', 'p8sweep-', 'p8sweepb-', 'p6k-', 'p6l-', 'p6m-', 'p6n-', 'p6sweep-', 'rl-probe-',
];

// Belt and braces: a test account must ALSO be on this domain. A real member never is.
const TEST_DOMAIN = '@example.com';

// Accounts that must never be touched whatever else matches — the platform's own operators.
const PROTECTED_EMAILS = ['superadmin@baalvion.com', 'jobs-admin@baalvion.test'];

const apply = process.argv.includes('--apply');

const isTestEmail = (email) => {
    if (!email || !email.endsWith(TEST_DOMAIN)) return false;
    if (PROTECTED_EMAILS.includes(email)) return false;
    const local = email.slice(0, email.indexOf('@'));
    // The suffix after the prefix is a timestamp this service generates; requiring it stops
    // a real address that merely starts with, say, "partner-" from being swept up.
    return TEST_PREFIXES.some((p) => local.startsWith(p) && /^\d+$/.test(local.slice(p.length)));
};

/**
 * Communities created BY a test run, identified the way test emails are: a known prefix
 * followed by the timestamp this service generates.
 *
 * They need their own pass because a community outlives the account that made it —
 * `created_by` is nulled when the account goes, so deleting accounts leaves the rooms
 * behind. On a real deployment that would mean a hub slowly filling with debris named
 * after test runs.
 *
 * The platform's own seeded communities have no timestamp suffix and never match.
 */
/**
 * Resources created by a test run, matched the same way.
 *
 * They need their own pass because a resource has no owner column to cascade from — the
 * platform's four seeded example entries have no timestamp suffix and never match.
 */
const RESOURCE_PREFIXES = ['p10-resource-', 'p9-resource-', 'cwm-test-resource-'];

const isTestResource = (slug) =>
    RESOURCE_PREFIXES.some((p) => slug.startsWith(p) && /^\d+$/.test(slug.slice(p.length)));

const COMMUNITY_PREFIXES = ['p7host-', 'p7-', 'p7sweep-', 'p8-', 'p8sweep-', 'p9-', 'p9sweep-', 'p10-', 'cwm-test-', 'p4-', 'p5-', 'p6-'];

const isTestCommunity = (slug) =>
    COMMUNITY_PREFIXES.some((p) => slug.startsWith(p) && /^\d+$/.test(slug.slice(p.length)));

async function main() {
    const [allUsers] = await db.sequelize.query('SELECT id, email, created_at FROM auth.users ORDER BY id');
    const candidates = allUsers.filter((u) => isTestEmail(u.email));
    const retained = allUsers.filter((u) => !isTestEmail(u.email));

    console.log(`accounts in auth.users: ${allUsers.length}`);
    console.log(`matched as CanWeMarry test accounts: ${candidates.length}`);
    console.log(`retained (not ours to delete): ${retained.length}`);

    const ids = candidates.map((u) => u.id);

    // Refuse if a candidate holds a relationship a test account would not.
    //
    // Registration creates a workspace AND an owner membership in it, so EVERY account has
    // exactly one team_members row for its own workspace — that is not a signal of anything.
    // What would be a signal is membership of a workspace somebody else owns: that means a
    // real person invited this account into real work, and it is no longer ours to delete.
    const [foreignTeams] = candidates.length === 0 ? [[]] : await db.sequelize.query(
        `SELECT tm.user_id, count(*)::int AS n
         FROM auth.team_members tm
         JOIN auth.organizations o ON o.id = tm.org_id
         WHERE tm.user_id IN (:ids) AND o.owner_id <> tm.user_id
         GROUP BY tm.user_id`,
        { replacements: { ids } },
    );
    if (foreignTeams.length > 0) {
        console.error("REFUSING: these candidates belong to a workspace they do not own, so they are not ours to delete:");
        for (const t of foreignTeams) console.error(`  user ${t.user_id}: ${t.n} membership(s) elsewhere`);
        process.exitCode = 1;
        return;
    }

    const [orgs] = candidates.length === 0 ? [[]] : await db.sequelize.query(
        'SELECT id, name, owner_id FROM auth.organizations WHERE owner_id IN (:ids)',
        { replacements: { ids } },
    );

    // CanWeMarry rows are keyed on the subject string, not the numeric id.
    const subjects = ids.map(String);
    const [cwmUsers] = candidates.length === 0 ? [[]] : await db.sequelize.query(
        'SELECT id, platform_subject FROM canwemarry.users WHERE platform_subject IN (:subjects)',
        { replacements: { subjects } },
    );

    const [allCommunities] = await db.sequelize.query('SELECT id, slug FROM canwemarry.communities');
    const [allResources] = await db.sequelize.query('SELECT id, slug FROM canwemarry.resources');
    const testResources = allResources.filter((r) => isTestResource(r.slug));
    const testCommunities = allCommunities.filter((c) => isTestCommunity(c.slug));

    // Local rows whose auth account is already gone — left behind by an earlier run that
    // deleted the account without them.
    // Reports and moderation actions whose TARGET no longer exists. `reporter_id` and
    // `actor_id` are nulled when an account goes, and the target row is cascaded away, but
    // these rows survive both — so a cleaned database still had a queue full of reports
    // about content that is not there, and analytics counting them.
    const [orphanReports] = await db.sequelize.query(
        `SELECT r.id FROM canwemarry.reports r
         WHERE (r.target_type = 'CASE'      AND NOT EXISTS (SELECT 1 FROM canwemarry.cases      c WHERE c.id = r.target_id))
            OR (r.target_type = 'POST'      AND NOT EXISTS (SELECT 1 FROM canwemarry.posts     p WHERE p.id = r.target_id))
            OR (r.target_type = 'COMMENT'   AND NOT EXISTS (SELECT 1 FROM canwemarry.comments  c WHERE c.id = r.target_id))
            OR (r.target_type = 'COMMUNITY' AND NOT EXISTS (SELECT 1 FROM canwemarry.communities cm WHERE cm.id = r.target_id))
            OR (r.target_type IN ('PROFILE','USER') AND NOT EXISTS (SELECT 1 FROM canwemarry.users u WHERE u.id = r.target_id))`,
    );
    const [orphanActions] = await db.sequelize.query(
        `SELECT a.id FROM canwemarry.moderation_actions a
         WHERE (a.target_type = 'CASE'      AND NOT EXISTS (SELECT 1 FROM canwemarry.cases      c WHERE c.id = a.target_id))
            OR (a.target_type = 'POST'      AND NOT EXISTS (SELECT 1 FROM canwemarry.posts     p WHERE p.id = a.target_id))
            OR (a.target_type = 'COMMENT'   AND NOT EXISTS (SELECT 1 FROM canwemarry.comments  c WHERE c.id = a.target_id))
            OR (a.target_type IN ('PROFILE','USER') AND NOT EXISTS (SELECT 1 FROM canwemarry.users u WHERE u.id = a.target_id))`,
    );
    // Audit rows whose ACTOR no longer exists.
    //
    // `actor_id` is not nulled when an account is deleted — it is left dangling — so a first
    // attempt keyed on `actor_id IS NULL` matched nothing while 47 rows from deleted test
    // accounts sat in the trail. The trail stays append-only for real activity: this can only
    // ever match a row whose actor has been removed, so a live account's history is untouchable.
    const [orphanAudit] = await db.sequelize.query(
        `SELECT a.id FROM canwemarry.audit_logs a
         WHERE a.actor_id IS NOT NULL
           AND NOT EXISTS (SELECT 1 FROM canwemarry.users u WHERE u.id = a.actor_id)`,
    );

    const [orphans] = await db.sequelize.query(
        `SELECT u.id, u.platform_subject FROM canwemarry.users u
         WHERE NOT EXISTS (SELECT 1 FROM auth.users a WHERE a.id::text = u.platform_subject)`,
    );

    console.log(`workspaces owned by them: ${orgs.length}`);
    console.log(`canwemarry.users rows: ${cwmUsers.length}`);
    console.log(`test communities: ${testCommunities.length}`);
    console.log(`test resources: ${testResources.length}`);
    console.log(`orphaned canwemarry.users rows: ${orphans.length}`);
    console.log(`orphaned reports: ${orphanReports.length}`);
    console.log(`orphaned moderation actions: ${orphanActions.length}`);
    console.log(`orphaned audit rows: ${orphanAudit.length}`);
    for (const c of testCommunities) console.log(`  would delete community: ${c.slug}`);

    for (const u of candidates) console.log(`  would delete: ${u.id}  ${u.email}`);

    const nothingToDo = candidates.length === 0 && testCommunities.length === 0 && orphans.length === 0
        && testResources.length === 0
        && orphanReports.length === 0 && orphanActions.length === 0 && orphanAudit.length === 0;
    if (nothingToDo) {
        console.log('nothing to do');
        return;
    }

    if (!apply) {
        console.log('\nDRY RUN — nothing was changed. Re-run with --apply to delete.');
        return;
    }

    await db.sequelize.transaction(async (tx) => {
        const opts = { replacements: { ids, subjects }, transaction: tx };
        if (candidates.length) {
            // CanWeMarry first: its rows cascade internally, and nothing in auth depends on them.
            await db.sequelize.query('DELETE FROM canwemarry.users WHERE platform_subject IN (:subjects)', opts);
            // Then the workspaces, because organizations.owner_id will not cascade.
            await db.sequelize.query('DELETE FROM auth.organizations WHERE owner_id IN (:ids)', opts);
            // Then the accounts; everything else referencing them cascades or nulls.
            await db.sequelize.query('DELETE FROM auth.users WHERE id IN (:ids)', opts);
        }

        // Communities a test run created, and any local row whose account has already gone.
        if (testCommunities.length) {
            await db.sequelize.query('DELETE FROM canwemarry.communities WHERE id IN (:cids)', {
                replacements: { cids: testCommunities.map((c) => c.id) }, transaction: tx,
            });
        }
        if (testResources.length) {
            await db.sequelize.query('DELETE FROM canwemarry.resources WHERE id IN (:rsids)', {
                replacements: { rsids: testResources.map((r) => r.id) }, transaction: tx,
            });
        }
        if (orphans.length) {
            await db.sequelize.query('DELETE FROM canwemarry.users WHERE id IN (:oids)', {
                replacements: { oids: orphans.map((o) => o.id) }, transaction: tx,
            });
        }

        /*
         * Reports, actions and audit rows whose subject has gone.
         *
         * Re-selected INSIDE the transaction, after the deletions above, rather than reused
         * from the survey. A report about a post is not an orphan until the post is deleted,
         * so the earlier count was taken before the rows it describes existed — which is why
         * a single run used to leave six reports behind and needed a second invocation.
         *
         * The predicates are the same ones the survey used, so this still only ever matches
         * a row whose target or actor is genuinely absent. A live account's history cannot
         * satisfy them.
         */
        await db.sequelize.query(
            `DELETE FROM canwemarry.reports r
             WHERE (r.target_type = 'CASE'      AND NOT EXISTS (SELECT 1 FROM canwemarry.cases       c  WHERE c.id  = r.target_id))
                OR (r.target_type = 'POST'      AND NOT EXISTS (SELECT 1 FROM canwemarry.posts      p  WHERE p.id  = r.target_id))
                OR (r.target_type = 'COMMENT'   AND NOT EXISTS (SELECT 1 FROM canwemarry.comments   c  WHERE c.id  = r.target_id))
                OR (r.target_type = 'COMMUNITY' AND NOT EXISTS (SELECT 1 FROM canwemarry.communities cm WHERE cm.id = r.target_id))
                OR (r.target_type IN ('PROFILE','USER') AND NOT EXISTS (SELECT 1 FROM canwemarry.users u WHERE u.id = r.target_id))`,
            { transaction: tx },
        );
        await db.sequelize.query(
            `DELETE FROM canwemarry.moderation_actions a
             WHERE (a.target_type = 'CASE'    AND NOT EXISTS (SELECT 1 FROM canwemarry.cases    c WHERE c.id = a.target_id))
                OR (a.target_type = 'POST'    AND NOT EXISTS (SELECT 1 FROM canwemarry.posts    p WHERE p.id = a.target_id))
                OR (a.target_type = 'COMMENT' AND NOT EXISTS (SELECT 1 FROM canwemarry.comments c WHERE c.id = a.target_id))
                OR (a.target_type IN ('PROFILE','USER') AND NOT EXISTS (SELECT 1 FROM canwemarry.users u WHERE u.id = a.target_id))`,
            { transaction: tx },
        );
        // Audit rows are append-only for real activity; this can only match one whose actor
        // has been removed, so a live account's history is untouchable.
        await db.sequelize.query(
            `DELETE FROM canwemarry.audit_logs a
             WHERE a.actor_id IS NOT NULL
               AND NOT EXISTS (SELECT 1 FROM canwemarry.users u WHERE u.id = a.actor_id)`,
            { transaction: tx },
        );
    });

    console.log(`\ndeleted ${candidates.length} test account(s), ${orgs.length} workspace(s), ${cwmUsers.length} canwemarry row(s), ${testCommunities.length} test communit(y/ies), ${testResources.length} test resource(s), ${orphans.length} orphan row(s), ${orphanReports.length}+ orphan report(s), ${orphanActions.length}+ orphan action(s), ${orphanAudit.length}+ orphan audit row(s) (re-selected after deletion, so the count may be higher)`);
}

main()
    .then(() => db.sequelize.close())
    .then(() => process.exit(process.exitCode ?? 0))
    .catch(async (err) => {
        console.error('cleanup failed:', err.message);
        await db.sequelize.close().catch(() => {});
        process.exit(1);
    });
