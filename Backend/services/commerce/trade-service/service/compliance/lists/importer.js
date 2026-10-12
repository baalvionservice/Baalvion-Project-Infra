'use strict';
/**
 * Sanctions-list importer.
 *
 * Takes the raw file from a publisher and brings compliance_sanctioned_parties in
 * line with it. The failure to design against is a screening table that is quietly
 * wrong: a truncated download that "delists" half the list, or an import that
 * silently stops running. So:
 *
 *   - the file must parse to exactly the record count the publisher declares (where
 *     it declares one) and clear a floor for that list;
 *   - a run that would shrink the active list by more than MAX_SHRINK is REFUSED
 *     and recorded, not applied. Real mass-delistings are rare; bad downloads are
 *     not. `force` exists for the day a real one happens, and is an operator choice;
 *   - the same file twice is a no-op (sha256 of the bytes);
 *   - a party no longer listed is deactivated with a delisted_at, never deleted;
 *   - every attempt, applied or refused, leaves a compliance_list_imports row.
 */

const crypto = require('crypto');
const { PARSERS } = require('./parsers');

const MAX_SHRINK = 0.2;
const MIN_RECORDS = Object.freeze({ OFAC: 10000, UN: 500, EU: 3000 });
const BATCH = 500;

class ImportRefused extends Error {
    constructor(message) { super(message); this.name = 'ImportRefused'; }
}

const sha256 = (s) => crypto.createHash('sha256').update(s).digest('hex');

/** Pure checks, separated so they can be tested without a database. */
function assertPlausible({ source, parsed, declared, existingActive, force = false, minRecords = MIN_RECORDS[source] }) {
    const floor = minRecords;
    if (floor && parsed < floor) {
        throw new ImportRefused(`${source}: parsed ${parsed} records, below the ${floor} minimum — the file looks truncated or its format changed`);
    }
    if (declared != null && parsed !== declared) {
        throw new ImportRefused(`${source}: publisher declares ${declared} records but ${parsed} were read`);
    }
    if (!force && existingActive > 0 && parsed < existingActive * (1 - MAX_SHRINK)) {
        throw new ImportRefused(`${source}: would shrink the active list from ${existingActive} to ${parsed} (more than ${MAX_SHRINK * 100}%). Re-run with force only after confirming the publisher really removed these entries`);
    }
}

async function record(sequelize, row) {
    await sequelize.query(
        `INSERT INTO tradeops.compliance_list_imports
           (list_source, source_url, source_list_date, source_sha256, records_parsed, records_added,
            records_updated, records_delisted, status, detail, started_at, finished_at)
         VALUES (:source, :url, :listDate, :sha, :parsed, :added, :updated, :delisted, :status, :detail, :startedAt, now())`,
        { replacements: { detail: null, added: 0, updated: 0, delisted: 0, ...row } },
    );
}

/**
 * @param {object} o
 * @param {object} o.sequelize   Sequelize instance
 * @param {'OFAC'|'UN'|'EU'} o.source
 * @param {string} o.xml         the file exactly as downloaded
 * @param {string} o.sourceUrl
 * @param {boolean} [o.force]
 * @param {number} [o.minRecords]  override the per-list floor (tests only; never set in production)
 */
async function importList({ sequelize, source, xml, sourceUrl, force = false, minRecords }) {
    const parse = PARSERS[source];
    if (!parse) throw new Error(`importList: unknown source '${source}'`);
    const startedAt = new Date();
    const sha = sha256(xml);

    const base = { source, url: sourceUrl, sha, startedAt };
    let parsedList;
    try {
        parsedList = parse(xml);
    } catch (err) {
        await record(sequelize, { ...base, listDate: null, parsed: 0, status: 'failed', detail: `parse error: ${err.message}` });
        throw err;
    }
    const { parties, list_date: listDate, declared_count: declared } = parsedList;
    Object.assign(base, { listDate, parsed: parties.length });

    const [[prev]] = await sequelize.query(
        `SELECT source_sha256 FROM tradeops.compliance_list_imports
          WHERE list_source = :source AND status IN ('succeeded','unchanged')
          ORDER BY started_at DESC LIMIT 1`,
        { replacements: { source } },
    );
    if (prev && prev.source_sha256 === sha) {
        await record(sequelize, { ...base, status: 'unchanged', detail: 'identical to the last applied file' });
        return { source, status: 'unchanged', parsed: parties.length, listDate };
    }

    const [[{ n: existingActive }]] = await sequelize.query(
        `SELECT count(*)::int AS n FROM tradeops.compliance_sanctioned_parties
          WHERE list_source = :source AND source_id IS NOT NULL AND active`,
        { replacements: { source } },
    );
    try {
        assertPlausible({ source, parsed: parties.length, declared, existingActive, force, ...(minRecords != null ? { minRecords } : {}) });
    } catch (err) {
        if (err instanceof ImportRefused) await record(sequelize, { ...base, status: 'refused', detail: err.message });
        throw err;
    }

    let added = 0;
    let updated = 0;
    let delisted = 0;
    await sequelize.transaction(async (transaction) => {
        for (let i = 0; i < parties.length; i += BATCH) {
            const chunk = parties.slice(i, i + BATCH);
            const values = [];
            const replacements = { source, listDate, startedAt };
            chunk.forEach((p, k) => {
                values.push(`(gen_random_uuid(), :source, :sid${k}, :type${k}, :name${k}, :country${k}, :aliases${k}::text[], :program${k}, :severity${k}, :notes${k}, :meta${k}::jsonb, true, :listDate, :startedAt, NULL, now(), now())`);
                replacements[`sid${k}`] = p.source_id;
                replacements[`type${k}`] = p.party_type;
                replacements[`name${k}`] = p.name;
                replacements[`country${k}`] = p.country;
                replacements[`aliases${k}`] = `{${p.aliases.map((a) => `"${String(a).replace(/\\/g, '\\\\').replace(/"/g, '\\"')}"`).join(',')}}`;
                replacements[`program${k}`] = p.program;
                replacements[`severity${k}`] = p.severity;
                replacements[`notes${k}`] = p.notes;
                replacements[`meta${k}`] = JSON.stringify(p.metadata);
            });
            const [rows] = await sequelize.query(
                `INSERT INTO tradeops.compliance_sanctioned_parties
                   (id, list_source, source_id, party_type, name, country, aliases, program, severity, notes, metadata,
                    active, source_list_date, last_seen_at, delisted_at, created_at, updated_at)
                 VALUES ${values.join(',')}
                 ON CONFLICT (list_source, source_id) WHERE source_id IS NOT NULL DO UPDATE SET
                    party_type = EXCLUDED.party_type, name = EXCLUDED.name, country = EXCLUDED.country,
                    aliases = EXCLUDED.aliases, program = EXCLUDED.program, severity = EXCLUDED.severity,
                    notes = EXCLUDED.notes, metadata = EXCLUDED.metadata, active = true,
                    source_list_date = EXCLUDED.source_list_date, last_seen_at = EXCLUDED.last_seen_at,
                    delisted_at = NULL, updated_at = now()
                 RETURNING (xmax = 0) AS inserted`,
                { replacements, transaction },
            );
            for (const r of rows) { if (r.inserted) added += 1; else updated += 1; }
        }
        const [, meta] = await sequelize.query(
            `UPDATE tradeops.compliance_sanctioned_parties
                SET active = false, delisted_at = now(), updated_at = now()
              WHERE list_source = :source AND source_id IS NOT NULL AND active
                AND (last_seen_at IS NULL OR last_seen_at < :startedAt)`,
            { replacements: { source, startedAt }, transaction },
        );
        delisted = (meta && (meta.rowCount != null ? meta.rowCount : meta)) || 0;
    });

    await record(sequelize, { ...base, status: 'succeeded', added, updated, delisted });
    return { source, status: 'succeeded', parsed: parties.length, added, updated, delisted, listDate };
}

module.exports = { importList, assertPlausible, ImportRefused, MAX_SHRINK, MIN_RECORDS };
