#!/usr/bin/env node
'use strict';
/**
 * Backfill `tradeops.trade_operations.buyer_org_id` / `seller_org_id`.
 *
 * WHY THIS EXISTS
 * Operations created before the party stamping in service/freight/materialiseShipment.js
 * carry no buyer or seller. Every party-scoped surface — the trade operations dashboard,
 * the clearance ledger — matches on those two columns, so an unstamped operation is
 * invisible to the very orgs that are party to it. Tenant isolation still applies; this
 * only fills in WHICH SIDE of the trade an org sits on.
 *
 * WHAT IT WILL AND WON'T INFER
 * It applies exactly one rule, the same one used at creation time: an operation's tenant
 * maps to a trade organization (trade.organizations.tenant_id), and that organization's
 * own `type` says which side it is. So:
 *
 *   org type 'buyer'  → buyer_org_id  = org.code
 *   org type 'seller' → seller_org_id = org.code
 *
 * It will NOT:
 *   • guess the OTHER side of the trade — a counterparty that was never recorded is not
 *     recoverable, and inventing one would grant a real org visibility it never had;
 *   • touch a column that already has a value (re-runnable, never destructive);
 *   • act when a tenant maps to zero organizations or to more than one, because then
 *     "the org for this tenant" is not a fact.
 *
 * Anything it cannot derive is reported, not filled. A half-stamped operation is correct
 * and useful (the org that IS stamped can see its own trade); a wrongly-stamped one is a
 * visibility leak.
 *
 * USAGE
 *   node scripts/backfill-trade-parties.js               # dry run (default) — writes nothing
 *   node scripts/backfill-trade-parties.js --apply       # perform the writes
 *   node scripts/backfill-trade-parties.js --apply --tenant=<id>   # confine to one tenant
 */
const db = require('../models');

const args = process.argv.slice(2);
const APPLY = args.includes('--apply');
const tenantArg = args.find((a) => a.startsWith('--tenant='));
const ONLY_TENANT = tenantArg ? tenantArg.split('=')[1] : null;

const SIDE_FOR_TYPE = { buyer: 'buyer_org_id', seller: 'seller_org_id' };

async function main() {
    await db.sequelize.authenticate();

    const where = { [db.Sequelize.Op.or]: [{ buyer_org_id: null }, { seller_org_id: null }] };
    if (ONLY_TENANT) where.tenant_id = ONLY_TENANT;

    // Read through the raw query interface: the tenant hooks would otherwise scope this
    // to whatever ambient context a CLI run has (none), and a backfill is deliberately
    // cross-tenant.
    const operations = await db.TradeOperation.unscoped().findAll({
        where,
        attributes: ['id', 'tenant_id', 'reference_no', 'buyer_org_id', 'seller_org_id'],
        order: [['created_at', 'ASC']],
    });

    if (!operations.length) {
        console.log('Nothing to do — every trade operation already names its parties.');
        return { scanned: 0, stamped: 0, skipped: 0 };
    }

    // Resolve each tenant's organization once. A tenant with 0 or >1 orgs is unresolvable.
    const tenantIds = [...new Set(operations.map((o) => o.tenant_id).filter(Boolean))];
    const orgs = await db.Organization.findAll({
        where: { tenant_id: { [db.Sequelize.Op.in]: tenantIds } },
        attributes: ['id', 'code', 'type', 'tenant_id', 'name'],
    });

    const byTenant = new Map();
    for (const org of orgs) {
        const list = byTenant.get(org.tenant_id) || [];
        list.push(org);
        byTenant.set(org.tenant_id, list);
    }

    const stamped = [];
    const skipped = [];

    for (const op of operations) {
        const candidates = byTenant.get(op.tenant_id) || [];

        if (candidates.length === 0) { skipped.push({ op, reason: 'tenant maps to no organization' }); continue; }
        if (candidates.length > 1) { skipped.push({ op, reason: `tenant maps to ${candidates.length} organizations — ambiguous` }); continue; }

        const org = candidates[0];
        if (!org.code) { skipped.push({ op, reason: `organization ${org.id} has no code` }); continue; }

        const column = SIDE_FOR_TYPE[org.type];
        if (!column) { skipped.push({ op, reason: `organization type '${org.type || 'unset'}' does not name a trade side` }); continue; }
        if (op[column]) { skipped.push({ op, reason: `${column} already set` }); continue; }

        stamped.push({ op, org, column });
    }

    console.log(`\nScanned ${operations.length} operation(s) missing at least one party.\n`);

    if (stamped.length) {
        console.log(`WILL STAMP (${stamped.length}):`);
        for (const { op, org, column } of stamped) {
            console.log(`  ${op.reference_no || op.id}  [${op.tenant_id}]  ${column} = ${org.code}  (${org.name})`);
        }
    } else {
        console.log('WILL STAMP: nothing — no operation has a derivable party.');
    }

    if (skipped.length) {
        console.log(`\nLEFT ALONE (${skipped.length}) — not derivable, reported rather than guessed:`);
        const byReason = {};
        for (const { op, reason } of skipped) (byReason[reason] = byReason[reason] || []).push(op.reference_no || op.id);
        for (const [reason, refs] of Object.entries(byReason)) {
            console.log(`  ${reason}: ${refs.length}`);
            for (const ref of refs.slice(0, 10)) console.log(`      ${ref}`);
            if (refs.length > 10) console.log(`      …and ${refs.length - 10} more`);
        }
    }

    // The counterparty side is never inferable from a single-org tenant, so say so
    // plainly rather than letting a "done" message imply both sides are now filled.
    const stillOneSided = stamped.length;
    if (stillOneSided) {
        console.log(`\nNOTE: ${stillOneSided} operation(s) will name ONE side only. The counterparty`);
        console.log('was never recorded on these rows and is not recoverable — set it when the');
        console.log('trade is re-linked to a deal, order, or booking that names both parties.');
    }

    if (!APPLY) {
        console.log('\nDRY RUN — nothing written. Re-run with --apply to perform these writes.');
        return { scanned: operations.length, stamped: 0, skipped: skipped.length };
    }

    let written = 0;
    await db.sequelize.transaction(async (transaction) => {
        for (const { op, org, column } of stamped) {
            await db.TradeOperation.unscoped().update(
                { [column]: org.code },
                { where: { id: op.id }, transaction, hooks: false },
            );
            written += 1;
        }
    });

    console.log(`\nAPPLIED — ${written} operation(s) stamped.`);
    return { scanned: operations.length, stamped: written, skipped: skipped.length };
}

main()
    .then(async () => { await db.sequelize.close(); process.exit(0); })
    .catch(async (err) => {
        console.error('\nBackfill failed:', err.message);
        try { await db.sequelize.close(); } catch { /* already closed */ }
        process.exit(1);
    });
